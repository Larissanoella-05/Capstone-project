import { distanceKm } from '../utils/geo.js';

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
    arrivalDistanceM: fault.arrivalDistanceM ?? null,
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
