/**
 * Where a fault is: the registered service location, else the point stored on the report itself (a guest
 * report). Null when there is no usable point, for example a guest who gave a written place only.
 * @param {{ serviceLocation?: { latitude: number, longitude: number } | null, latitude?: number | null, longitude?: number | null }} fault
 * @returns {{ latitude: number, longitude: number } | null}
 */
export function faultPoint(fault) {
  const location = fault.serviceLocation;
  if (location) return { latitude: location.latitude, longitude: location.longitude };
  const { latitude, longitude } = fault;
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return {
      latitude: /** @type {number} */ (latitude),
      longitude: /** @type {number} */ (longitude),
    };
  }
  return null;
}

/**
 * The cell a fault is in, for messages and labels.
 * @param {{ serviceLocation?: { cell: string } | null, cell?: string | null }} fault
 */
export function faultCell(fault) {
  return fault.serviceLocation?.cell ?? fault.cell ?? 'Unknown';
}
