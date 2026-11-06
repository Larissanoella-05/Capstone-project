import { distanceKm } from '../utils/geo.js';
import { faultPoint } from './faultPoint.js';

/**
 * A guest report has no registered service location, so the clients get one built from the report's own
 * place. That keeps the shape every screen already reads.
 */
function guestLocation(fault) {
  return {
    id: null,
    meterNumber: fault.claimedMeter ?? null,
    village: null,
    cell: fault.cell ?? 'Unknown',
    sector: 'Ndera',
    district: 'Gasabo',
    landmark: fault.placeText ?? null,
    latitude: fault.latitude ?? null,
    longitude: fault.longitude ?? null,
  };
}

/** Turns a database row into the JSON shared by all three roles. */
export function serializeFault(fault) {
  const isGuest = fault.customerId === null;
  const loc = fault.serviceLocation ?? (isGuest ? guestLocation(fault) : null);
  const point = faultPoint(fault);
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
    isGuest,
    accuracyM: fault.accuracyM ?? null,
    locationSource: fault.locationSource ?? null,
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
          distanceKm: techLocation && point ? distanceKm(techLocation, point) : null,
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

/**
 * What the holder of a tracking link may see: the same shape the tracking screen reads, with the phone
 * numbers, the meter number, the technician's surname and staff number, and the names and notes in the
 * history removed.
 */
export function serializePublicFault(fault) {
  const full = serializeFault(fault);
  return {
    ...full,
    contactPhone: null,
    customer: null,
    serviceLocation: full.serviceLocation && {
      ...full.serviceLocation,
      id: null,
      meterNumber: null,
    },
    technician: full.technician && {
      ...full.technician,
      id: null,
      name: full.technician.name.split(' ')[0],
      phone: null,
      staffNumber: null,
    },
    history: full.history.map((entry) => ({ ...entry, note: null, changedBy: null })),
  };
}
