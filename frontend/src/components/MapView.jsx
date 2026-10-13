export default function MapView({ markers = [], className = 'h-64', ariaLabel = 'Map' }) {
  return (
    <div role="img" aria-label={ariaLabel} className={`flex flex-col items-center justify-center gap-1 bg-paper p-4 text-center ${className}`}>
      <div className="eyebrow text-muted">Map arrives on Day 6</div>
      {markers.map((marker) => (
        <div key={marker.id} className="font-mono text-xs">
          {marker.kind} · {marker.label} · {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
        </div>
      ))}
    </div>
  );
}

// These three helpers are identical to the real MapView.jsx.
export function faultMarker(fault, onClick) {
  return {
    id: `fault-${fault.id}`,
    lat: fault.serviceLocation.latitude,
    lng: fault.serviceLocation.longitude,
    kind: fault.status === 'REPORTED' ? 'unassigned' : 'site',
    label: `${fault.reference} · ${fault.serviceLocation.cell}`,
    onClick,
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

export function faultMapParts(fault) {
  const markers = [faultMarker(fault)];
  const lines = [];
  const onSite = ['ARRIVED', 'WORKING'].includes(fault.status);
  const showTechnician = ['ASSIGNED', 'ON_THE_WAY', 'ARRIVED', 'WORKING'].includes(fault.status);
  const technician = showTechnician ? technicianMarker(fault.technician, { onSite }) : null;
  if (technician) {
    markers.push(technician);
    if (!onSite) lines.push([[technician.lat, technician.lng], [markers[0].lat, markers[0].lng]]);
  }
  return { markers, lines };
}