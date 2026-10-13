import { useEffect, useRef } from 'react';
import L from 'leaflet';

// Centre of the pilot area: Ndera Sector, Gasabo District, Kigali.
const NDERA_CENTRE = [-1.9495, 30.171];

const SIZE = { site: 22, unassigned: 22, technician: 24, onsite: 24 };

function iconFor(kind, selected) {
  const size = SIZE[kind] ?? 22;
  return L.divIcon({
    className: '',
    html: `<div class="map-marker map-marker--${kind}${selected ? ' map-marker--selected' : ''}" style="width:${size}px;height:${size}px"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/**
 * One reusable map for all three roles (Leaflet + OpenStreetMap, no API key).
 *
 * markers: [{ id, lat, lng, kind: 'site' | 'unassigned' | 'technician' | 'onsite', label, onClick }]
 * lines:   [[[lat, lng], [lat, lng]], …]  straight links between a technician and a fault
 * selectedId: marker to highlight
 * interactive: false gives a static preview (no zoom or drag)
 */
export default function MapView({
  markers = [],
  lines = [],
  selectedId = null,
  interactive = true,
  className = 'h-64',
  ariaLabel = 'Map',
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const fittedKeyRef = useRef('');

  // Create the map once.
  useEffect(() => {
    const map = L.map(containerRef.current, {
      center: NDERA_CENTRE,
      zoom: 14,
      zoomControl: interactive,
      dragging: interactive,
      scrollWheelZoom: false,
      doubleClickZoom: interactive,
      touchZoom: interactive,
      boxZoom: interactive,
      keyboard: interactive,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // The container can change size after first paint (fonts, flex layout).
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [interactive]);

  // Redraw markers and lines whenever the data changes.
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    lines.forEach((points) => {
      L.polyline(points, { color: '#0B0B0B', weight: 4, opacity: 1, dashArray: '2 8', lineCap: 'square' }).addTo(layer);
    });

    const valid = markers.filter((marker) => Number.isFinite(marker.lat) && Number.isFinite(marker.lng));
    valid.forEach((marker) => {
      const leafletMarker = L.marker([marker.lat, marker.lng], {
        icon: iconFor(marker.kind, marker.id === selectedId),
        keyboard: Boolean(marker.onClick),
        title: marker.label,
        zIndexOffset: marker.kind === 'technician' || marker.kind === 'onsite' ? 500 : 0,
      }).addTo(layer);
      if (marker.label) leafletMarker.bindTooltip(marker.label, { direction: 'top', offset: [0, -12] });
      if (marker.onClick) leafletMarker.on('click', marker.onClick);
    });

    // Re-frame only when the set of markers changes, not on every position update,
    // so the map does not jump while someone is looking at it.
    const key = valid.map((marker) => marker.id).sort().join('|');
    if (key !== fittedKeyRef.current) {
      fittedKeyRef.current = key;
      if (valid.length === 1) map.setView([valid[0].lat, valid[0].lng], 16);
      else if (valid.length > 1) {
        map.fitBounds(L.latLngBounds(valid.map((marker) => [marker.lat, marker.lng])), {
          padding: [36, 36],
          maxZoom: 16,
        });
      }
    }
  }, [markers, lines, selectedId]);

  return <div ref={containerRef} role="application" aria-label={ariaLabel} className={`z-0 w-full ${className}`} />;
}

/** Helpers that turn API objects into markers, so every screen draws them the same way. */
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

/** Marker and link line for a fault and its technician, depending on the stage. */
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