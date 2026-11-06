// Pure helpers that turn API objects into map markers and lines (no map library here, so they are easy to test).
// Same rules as frontend/src/components/MapView.jsx, with { lat, lng } coordinates.

const SITE_STATUSES = ['ASSIGNED', 'ON_THE_WAY', 'ARRIVED', 'WORKING'];
const ON_SITE_STATUSES = ['ARRIVED', 'WORKING'];

export function faultMarker(fault) {
  return {
    id: `fault-${fault.id}`,
    lat: fault.serviceLocation.latitude,
    lng: fault.serviceLocation.longitude,
    kind: fault.status === 'REPORTED' ? 'unassigned' : 'site',
    label: `${fault.reference} · ${fault.serviceLocation.cell}`,
  };
}

export function technicianMarker(technician, { onSite = false } = {}) {
  if (!technician?.location) return null;
  return {
    id: `tech-${technician.id}`,
    lat: technician.location.latitude,
    lng: technician.location.longitude,
    kind: onSite ? 'onsite' : 'technician',
    label: technician.name,
  };
}

/** Markers and the link line for a fault and its technician, depending on the stage. */
export function faultMapParts(fault) {
  // A guest who only described the place has no point, so there is nothing to draw for the fault.
  const site = faultMarker(fault);
  const hasSite = Number.isFinite(site.lat) && Number.isFinite(site.lng);
  const markers = hasSite ? [site] : [];
  const lines = [];
  const onSite = ON_SITE_STATUSES.includes(fault.status);
  const technician = SITE_STATUSES.includes(fault.status)
    ? technicianMarker(fault.technician, { onSite })
    : null;
  if (technician) {
    markers.push(technician);
    if (!onSite && hasSite)
      lines.push([
        [technician.lat, technician.lng],
        [site.lat, site.lng],
      ]);
  }
  return { markers, lines };
}
