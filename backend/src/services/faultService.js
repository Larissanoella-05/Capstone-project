import { randomUUID } from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { badRequest, conflict, forbidden, notFound } from '../utils/httpError.js';
import { distanceKm } from '../utils/geo.js';
import {
  ACTIVE_JOB_STATUSES,
  CATEGORY_LABEL,
  DEFAULT_PRIORITY,
  OPEN_STATUSES,
  STATUS_TIMESTAMP,
} from '../utils/constants.js';
import { faultStatusMachine } from '../domain/FaultStatusMachine.js';
import { customerMessageFor, notify } from './notificationService.js';
import { sendPushForNotifications } from './pushService.js';

const STALE_UPDATE_MESSAGE =
  'This fault was just updated by someone else. Refresh to see the latest status.';

/**
 * Updates a fault only if it is still in the state we checked (optimistic concurrency).
 * Two people tapping a button at the same moment can no longer both succeed:
 * the second update matches zero rows, the transaction rolls back and the user gets a 409.
 */
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

/** Turns a database row into the JSON shape shared by all three roles. */
export function serializeFault(fault) {
  const loc = fault.serviceLocation;
  const techLocation = fault.technician?.locations?.[0] ?? null;

  return {
    id: fault.id,
    reference: fault.reference,
    category: fault.category,
    description: fault.description,
    contactPhone: fault.contactPhone,
    photo: fault.photo ?? null,
    priority: fault.priority,
    status: fault.status,
    reportedAt: fault.reportedAt,
    assignedAt: fault.assignedAt,
    onTheWayAt: fault.onTheWayAt,
    arrivedAt: fault.arrivedAt,
    workingAt: fault.workingAt,
    resolvedAt: fault.resolvedAt,
    cancelledAt: fault.cancelledAt,
    updatedAt: fault.updatedAt,
    outcome: fault.outcome,
    resolutionNote: fault.resolutionNote,
    workCompleted: fault.workCompleted,
    clarificationContacts: fault.clarificationContacts,
    customer: fault.customer
      ? { id: fault.customer.id, name: fault.customer.user.name, phone: fault.customer.user.phone }
      : null,
    serviceLocation: loc
      ? {
          id: loc.id,
          meterNumber: loc.meterNumber,
          village: loc.village,
          cell: loc.cell,
          sector: loc.sector,
          district: loc.district,
          landmark: loc.landmark,
          latitude: loc.latitude,
          longitude: loc.longitude,
        }
      : null,
    technician: fault.technician
      ? {
          id: fault.technician.id,
          name: fault.technician.user.name,
          phone: fault.technician.user.phone,
          staffNumber: fault.technician.staffNumber,
          location: techLocation
            ? {
                latitude: techLocation.latitude,
                longitude: techLocation.longitude,
                label: techLocation.label,
                recordedAt: techLocation.recordedAt,
              }
            : null,
          distanceKm: techLocation && loc ? distanceKm(techLocation, loc) : null,
        }
      : null,
    history: (fault.history ?? []).map((entry) => ({
      id: entry.id,
      status: entry.status,
      note: entry.note,
      createdAt: entry.createdAt,
      changedBy: entry.changedBy?.name ?? null,
    })),
  };
}

/** Limits a query to the faults the signed-in user is allowed to see. */
function scopeFor(user) {
  if (user.role === 'CUSTOMER') return { customerId: user.customer.id };
  if (user.role === 'TECHNICIAN') return { technicianId: user.technician.id };
  return {}; // coordinators see everything
}

export async function listFaults(user, query = {}) {
  /** @type {import('@prisma/client').Prisma.FaultReportWhereInput} */
  const where = { ...scopeFor(user) };
  const { status, priority, search, date } = query;

  if (status === 'OPEN') where.status = { in: OPEN_STATUSES };
  else if (status && status !== 'ALL') where.status = status;

  if (priority && priority !== 'ALL') where.priority = priority;

  if (date === 'TODAY') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    where.reportedAt = { gte: start };
  } else if (date === 'WEEK') {
    where.reportedAt = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
  }

  const term = typeof search === 'string' ? search.trim() : '';
  if (term) {
    const contains = { contains: term, mode: /** @type {const} */ ('insensitive') };
    const categoryMatches = Object.entries(CATEGORY_LABEL)
      .filter(([, label]) => label.toLowerCase().includes(term.toLowerCase()))
      .map(([category]) => /** @type {import('@prisma/client').FaultCategory} */ (category));
    where.OR = [
      { reference: contains },
      { description: contains },
      { serviceLocation: { cell: contains } },
      { serviceLocation: { village: contains } },
      { customer: { user: { name: contains } } },
      { technician: { user: { name: contains } } },
      ...(categoryMatches.length ? [{ category: { in: categoryMatches } }] : []),
    ];
  }

  const faults = await prisma.faultReport.findMany({
    where,
    include: faultInclude,
    omit: { photo: true }, // photos are only sent on the detail endpoint
    orderBy: { reportedAt: 'desc' },
  });
  return faults.map(serializeFault);
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

/** Customer submits a fault. It is linked to their registered service location. */
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

  const { id, notices } = await prisma.$transaction(async (tx) => {
    // The public reference is derived from the row id, so create first and then stamp it.
    const created = await tx.faultReport.create({
      data: {
        reference: `TMP-${randomUUID()}`,
        category: body.category,
        description: body.description || null,
        contactPhone: body.contactPhone || user.phone,
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
      title: 'Fault Received',
      message: `We have received your electricity fault report #${reference}. A service coordinator will assign a technician.`,
    });
    return { id: created.id, notices: [notice] };
  });

  sendPushForNotifications(notices); // after the commit; never throws and is not awaited
  return getFault(user, id);
}

/** Coordinator assigns (or reassigns) a technician to a fault. */
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
    const toCustomer = await notify(tx, {
      userId: fault.customer.userId,
      faultId: id,
      type: 'TECHNICIAN_ASSIGNED',
      title: 'Technician Assigned',
      message: `${technician.user.name} has been assigned to your electricity fault #${fault.reference}.`,
    });
    const toTechnician = await notify(tx, {
      userId: technician.userId,
      faultId: id,
      type: 'JOB_ASSIGNED',
      title: 'New Job Assigned',
      message: `Fault #${fault.reference} at ${fault.serviceLocation.cell} Cell has been assigned to you.`,
    });
    return [toCustomer, toTechnician];
  });

  sendPushForNotifications(notices);
  return getFault(user, id);
}

/**
 * Moves a fault to a new status.
 * - The assigned technician moves it one step forward at a time.
 * - A coordinator can cancel an open report.
 */
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
  if (next === 'RESOLVED') {
    data.outcome = body.outcome ?? 'SUPPLY_RESTORED';
    data.resolutionNote = body.resolutionNote;
    data.workCompleted = body.workCompleted || null;
    data.clarificationContacts = body.clarificationContacts ?? 0;
  }

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
            label: `On the way to ${fault.serviceLocation.cell}`,
          },
        });
      }
    }
    if (next === 'ARRIVED') {
      await tx.technicianLocation.create({
        data: {
          technicianId: fault.technicianId,
          faultId: id,
          latitude: fault.serviceLocation.latitude,
          longitude: fault.serviceLocation.longitude,
          label: `On site, ${fault.serviceLocation.cell}`,
        },
      });
    }

    const message = customerMessageFor(next, {
      reference: fault.reference,
      technicianName: fault.technician?.user.name,
    });
    return message
      ? [await notify(tx, { userId: fault.customer.userId, faultId: id, ...message })]
      : [];
  });

  sendPushForNotifications(notices);
  return getFault(user, id);
}

/** Coordinator edits a fault. Only the priority is editable in this prototype. */
export async function updateFault(user, id, body) {
  await loadFault(user, id);
  await prisma.faultReport.update({ where: { id }, data: { priority: body.priority } });
  return getFault(user, id);
}

export { ACTIVE_JOB_STATUSES };
