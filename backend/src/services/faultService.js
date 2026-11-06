import { randomUUID } from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { badRequest, conflict, forbidden, notFound } from '../utils/httpError.js';
import { distanceMetres } from '../utils/geo.js';
import { ACTIVE_JOB_STATUSES, DEFAULT_PRIORITY, STATUS_TIMESTAMP } from '../utils/constants.js';
import { faultStatusMachine } from '../domain/FaultStatusMachine.js';
import { serializeFault, serializePublicFault } from '../domain/FaultSerializer.js';
import { faultCell, faultPoint } from '../domain/faultPoint.js';
import { newTrackingToken, trackingLinkExpired } from '../domain/trackingLink.js';
import { buildFaultFilter, pageMeta, pagingFor } from './faultQuery.js';
import { customerMessageFor, notify } from './notificationService.js';
import { sendPushForNotifications } from './pushService.js';
import { isSmsSimulated, sendGuestSms, sendSmsForNotifications } from './smsService.js';
import { env } from '../config/env.js';
import { guestSmsMessage } from '../domain/guestSms.js';

const STALE_UPDATE_MESSAGE =
  'This fault was just updated by someone else. Refresh to see the latest status.';

/** Updates only if the fault is still in the state we checked; a stale update rolls back with a 409. */
async function guardedUpdate(tx, id, expected, data) {
  const { count } = await tx.faultReport.updateMany({ where: { id, ...expected }, data });
  if (count === 0) throw conflict(STALE_UPDATE_MESSAGE);
}

/** Everything the three interfaces need to draw a fault. */
const faultInclude = /** @satisfies {import('@prisma/client').Prisma.FaultReportInclude} */ ({
  customer: { include: { user: { select: { id: true, name: true, phone: true } } } },
  serviceLocation: true,
  technician: {
    include: {
      user: { select: { id: true, name: true, phone: true } },
      locations: { orderBy: { recordedAt: 'desc' }, take: 1 },
    },
  },
  history: {
    orderBy: { createdAt: 'asc' },
    include: { changedBy: { select: { name: true, role: true } } },
  },
});

/** The faults the user may see, newest first; paged only when the query asks for it. */
export async function listFaults(user, query = {}) {
  const where = buildFaultFilter(user, query);
  const paging = pagingFor(query);

  const find = {
    where,
    include: faultInclude,
    omit: { photo: true }, // photos are only sent on the detail endpoint
    // The id breaks ties, so reports made in the same instant never swap places between pages.
    orderBy: [{ reportedAt: /** @type {const} */ ('desc') }, { id: /** @type {const} */ ('desc') }],
  };

  if (!paging.paged) {
    const faults = await prisma.faultReport.findMany(find);
    return { faults: faults.map(serializeFault), ...pageMeta(faults.length, paging) };
  }

  const [faults, total] = await prisma.$transaction([
    prisma.faultReport.findMany({ ...find, skip: paging.skip, take: paging.take }),
    prisma.faultReport.count({ where }),
  ]);
  return { faults: faults.map(serializeFault), ...pageMeta(total, paging) };
}

/** Loads one fault and checks the signed-in user may see it. */
async function loadFault(user, id, client = prisma) {
  const fault = await client.faultReport.findUnique({ where: { id }, include: faultInclude });
  if (!fault) throw notFound('That fault report does not exist.');

  const allowed =
    user.role === 'COORDINATOR' ||
    (user.role === 'CUSTOMER' && fault.customerId === user.customer.id) ||
    (user.role === 'TECHNICIAN' && fault.technicianId === user.technician.id);
  if (!allowed) throw forbidden('This fault report belongs to someone else.');

  return fault;
}

export async function getFault(user, id) {
  return serializeFault(await loadFault(user, id));
}

export async function createFault(user, body) {
  const customer = user.customer;

  const location = body.serviceLocationId
    ? await prisma.serviceLocation.findFirst({
        where: { id: body.serviceLocationId, customerId: customer.id },
      })
    : await prisma.serviceLocation.findFirst({
        where: { customerId: customer.id },
        orderBy: { id: 'asc' },
      });
  if (!location) throw badRequest('No registered service location was found for your account.');

  const contactPhone = body.contactPhone || user.phone;

  const { id, notices } = await prisma.$transaction(async (tx) => {
    // The public reference is derived from the row id, so create first and then stamp it.
    const created = await tx.faultReport.create({
      data: {
        reference: `TMP-${randomUUID()}`,
        category: body.category,
        description: body.description || null,
        contactPhone,
        photo: body.photo || null,
        priority: DEFAULT_PRIORITY[body.category] ?? 'MEDIUM',
        status: 'REPORTED',
        customerId: customer.id,
        serviceLocationId: location.id,
      },
    });
    const reference = `FR-${1000 + created.id}`;
    await tx.faultReport.update({ where: { id: created.id }, data: { reference } });

    await tx.faultStatusHistory.create({
      data: {
        faultId: created.id,
        status: 'REPORTED',
        changedById: user.id,
        note: 'Fault reported by customer',
      },
    });
    const notice = await notify(tx, {
      userId: user.id,
      faultId: created.id,
      type: 'FAULT_SUBMITTED',
      title: 'Fault received',
      message: `We have received your electricity fault report #${reference}. A service coordinator will assign a technician.`,
    });
    return { id: created.id, notices: [notice] };
  });

  sendPushForNotifications(notices); // after the commit; never throws and is not awaited
  sendSmsForNotifications(notices, contactPhone);
  return getFault(user, id);
}

/**
 * Texts the guest about their report, after the transaction has committed and without waiting for the
 * gateway. A registered customer is not texted here: they have the app and the in-app feed.
 */
function textGuest(fault, type, technicianName) {
  if (fault.customerId !== null) return null;
  const message = guestSmsMessage(type, {
    reference: fault.reference,
    token: fault.trackingToken,
    technicianName,
    webUrl: env.publicWebUrl,
  });
  if (message) sendGuestSms([message], fault.contactPhone);
  return message;
}

/**
 * A report made without an account. The tracking token is the only key to it, so it is returned once here
 * and never serialized again.
 */
export async function createGuestFault(body) {
  const trackingToken = newTrackingToken();

  const created = await prisma.$transaction(async (tx) => {
    const fault = await tx.faultReport.create({
      data: {
        reference: `TMP-${randomUUID()}`,
        category: body.category,
        description: body.description || null,
        contactPhone: body.contactPhone,
        photo: body.photo || null,
        priority: DEFAULT_PRIORITY[body.category] ?? 'MEDIUM',
        status: 'REPORTED',
        trackingToken,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        accuracyM: body.accuracyM ?? null,
        locationSource: body.locationSource,
        placeText: body.placeText ?? null,
        claimedMeter: body.claimedMeter ?? null,
      },
    });
    const reference = `FR-${1000 + fault.id}`;
    await tx.faultReport.update({ where: { id: fault.id }, data: { reference } });
    await tx.faultStatusHistory.create({
      data: { faultId: fault.id, status: 'REPORTED', note: 'Fault reported without an account' },
    });
    return { id: fault.id, reference, reportedAt: fault.reportedAt };
  });

  const text = textGuest(
    {
      customerId: null,
      reference: created.reference,
      trackingToken,
      contactPhone: body.contactPhone,
    },
    'FAULT_SUBMITTED'
  );
  // `delivery` lets the confirmation page say so when no gateway is connected and nothing was really sent.
  const sms = { delivery: isSmsSimulated() ? 'simulated' : 'queued', text: text?.message ?? '' };
  return { ...created, status: 'REPORTED', trackingToken, sms };
}

/** The only way a guest reads a report: by the link they were given. */
export async function getFaultByToken(token) {
  const fault = await prisma.faultReport.findUnique({
    where: { trackingToken: token },
    include: faultInclude,
  });
  if (!fault || trackingLinkExpired(fault)) throw notFound('This tracking link is not valid.');
  return serializePublicFault(fault);
}

export async function assignTechnician(user, id, technicianId) {
  const fault = await loadFault(user, id);
  faultStatusMachine.assertAssignable(fault.status);

  const technician = await prisma.technician.findUnique({
    where: { id: technicianId },
    include: { user: true },
  });
  if (!technician) throw notFound('That technician does not exist.');
  if (!technician.onDuty) throw conflict(`${technician.user.name} is off duty.`);
  if (fault.technicianId === technician.id)
    throw conflict(`${technician.user.name} is already assigned to this fault.`);

  const notices = await prisma.$transaction(async (tx) => {
    // Only succeeds if nobody else assigned or started the job since we loaded it.
    await guardedUpdate(
      tx,
      id,
      { status: fault.status, technicianId: fault.technicianId },
      {
        technicianId: technician.id,
        assignedById: user.coordinator.id,
        status: 'ASSIGNED',
        assignedAt: new Date(),
      }
    );
    await tx.faultStatusHistory.create({
      data: {
        faultId: id,
        status: 'ASSIGNED',
        changedById: user.id,
        note: `Assigned to ${technician.user.name}`,
      },
    });
    // A guest has no account, so there is no in-app row for them.
    const toCustomer = fault.customer
      ? await notify(tx, {
          userId: fault.customer.userId,
          faultId: id,
          type: 'TECHNICIAN_ASSIGNED',
          title: 'Technician assigned',
          message: `${technician.user.name} has been assigned to your electricity fault #${fault.reference}.`,
        })
      : null;
    const toTechnician = await notify(tx, {
      userId: technician.userId,
      faultId: id,
      type: 'JOB_ASSIGNED',
      title: 'New job assigned',
      message: `Fault #${fault.reference} at ${faultCell(fault)} Cell has been assigned to you.`,
    });
    return toCustomer ? [toCustomer, toTechnician] : [toTechnician];
  });

  sendPushForNotifications(notices);
  sendSmsForNotifications(notices, fault.contactPhone || fault.customer?.user.phone);
  textGuest(fault, 'TECHNICIAN_ASSIGNED', technician.user.name);
  return getFault(user, id);
}

/** The assigned technician moves it one step forward; a coordinator can cancel an open report. */
export async function changeStatus(user, id, body) {
  const fault = await loadFault(user, id);
  const next = body.status;
  faultStatusMachine.assertTransition({
    role: user.role,
    from: fault.status,
    to: next,
    resolutionNote: body.resolutionNote,
  });

  const now = new Date();
  const data = { status: next, [STATUS_TIMESTAMP[next]]: now };
  if (next === 'ARRIVED') {
    // Measured from where the technician last reported being, before the "on site" row below is written.
    data.arrivalDistanceM = distanceMetres(fault.technician.locations[0], faultPoint(fault));
  }
  if (next === 'RESOLVED') {
    data.outcome = body.outcome ?? 'SUPPLY_RESTORED';
    data.resolutionNote = body.resolutionNote;
    data.workCompleted = body.workCompleted || null;
    data.clarificationContacts = body.clarificationContacts ?? 0;
  }

  const message = customerMessageFor(next, {
    reference: fault.reference,
    technicianName: fault.technician?.user.name,
  });

  const notices = await prisma.$transaction(async (tx) => {
    await guardedUpdate(tx, id, { status: fault.status }, data);
    await tx.faultStatusHistory.create({
      data: { faultId: id, status: next, changedById: user.id, note: body.note || null },
    });

    // Keep the technician's recorded position in step with the status.
    if (next === 'ON_THE_WAY') {
      const last = fault.technician.locations[0];
      if (last) {
        await tx.technicianLocation.create({
          data: {
            technicianId: fault.technicianId,
            faultId: id,
            latitude: last.latitude,
            longitude: last.longitude,
            label: `On the way to ${faultCell(fault)}`,
          },
        });
      }
    }
    const point = faultPoint(fault);
    if (next === 'ARRIVED' && point) {
      // A guest who gave a written place only has no point to record.
      await tx.technicianLocation.create({
        data: {
          technicianId: fault.technicianId,
          faultId: id,
          latitude: point.latitude,
          longitude: point.longitude,
          label: `On site, ${faultCell(fault)}`,
        },
      });
    }

    // A guest has no account, so there is no in-app row for them.
    return message && fault.customer
      ? [await notify(tx, { userId: fault.customer.userId, faultId: id, ...message })]
      : [];
  });

  sendPushForNotifications(notices);
  if (message) textGuest(fault, message.type, fault.technician?.user.name);
  return getFault(user, id);
}

/** Only the priority is editable in this prototype. */
export async function updateFault(user, id, body) {
  await loadFault(user, id);
  await prisma.faultReport.update({ where: { id }, data: { priority: body.priority } });
  return getFault(user, id);
}

export { ACTIVE_JOB_STATUSES, serializeFault };
