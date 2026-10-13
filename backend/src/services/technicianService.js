import { prisma } from '../lib/prisma.js';
import { badRequest, notFound } from '../utils/httpError.js';
import { distanceKm } from '../utils/geo.js';
import { ACTIVE_JOB_STATUSES } from '../utils/constants.js';

const technicianInclude = {
  user: { select: { id: true, name: true, phone: true, email: true } },
  locations: { orderBy: { recordedAt: 'desc' }, take: 1 },
  faults: {
    where: { status: { in: ACTIVE_JOB_STATUSES } },
    select: { id: true, reference: true, status: true, serviceLocation: { select: { cell: true } } },
    orderBy: { assignedAt: 'asc' },
  },
};

function serializeTechnician(technician, target) {
  const location = technician.locations[0] ?? null;
  const activeJobs = technician.faults;
  return {
    id: technician.id,
    name: technician.user.name,
    phone: technician.user.phone,
    staffNumber: technician.staffNumber,
    onDuty: technician.onDuty,
    availability: !technician.onDuty ? 'OFF_DUTY' : activeJobs.length ? 'ON_JOB' : 'AVAILABLE',
    activeJobs: activeJobs.map((job) => ({
      id: job.id,
      reference: job.reference,
      status: job.status,
      cell: job.serviceLocation.cell,
    })),
    location: location
      ? {
          latitude: location.latitude,
          longitude: location.longitude,
          label: location.label,
          recordedAt: location.recordedAt,
        }
      : null,
    distanceKm: target && location ? distanceKm(location, target) : null,
  };
}

/** All technicians. With a faultId they are sorted by distance to that fault. */
export async function listTechnicians({ faultId } = {}) {
  let target = null;
  if (faultId) {
    const fault = await prisma.faultReport.findUnique({
      where: { id: faultId },
      select: { serviceLocation: { select: { latitude: true, longitude: true } } },
    });
    if (!fault) throw notFound('That fault report does not exist.');
    target = fault.serviceLocation;
  }

  const technicians = await prisma.technician.findMany({ include: technicianInclude });
  const list = technicians.map((technician) => serializeTechnician(technician, target));

  list.sort((a, b) => {
    if (target) return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
    return a.name.localeCompare(b.name);
  });
  return list;
}

export async function getTechnician(id) {
  const technician = await prisma.technician.findUnique({ where: { id }, include: technicianInclude });
  if (!technician) throw notFound('That technician does not exist.');
  return serializeTechnician(technician, null);
}

/** Stores a new position for the signed-in technician (simulated or from the device). */
export async function recordLocation(user, { latitude, longitude, faultId, label }) {
  if (faultId) {
    const fault = await prisma.faultReport.findFirst({ where: { id: faultId, technicianId: user.technician.id } });
    if (!fault) throw badRequest('That fault is not assigned to you.');
  }
  const location = await prisma.technicianLocation.create({
    data: { technicianId: user.technician.id, faultId: faultId ?? null, latitude, longitude, label: label ?? null },
  });
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    label: location.label,
    recordedAt: location.recordedAt,
  };
}
