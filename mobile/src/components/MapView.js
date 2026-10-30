import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme.js';

// MapLibre is native code. An older development build does not contain it, and importing it then throws,
// which would take down every screen that shows a map. Fall back to a placeholder instead.
let MapLibre = null;
try {
  MapLibre = require('@maplibre/maplibre-react-native');
} catch (error) {
  console.warn('[map] MapLibre is not in this build; rebuild the app to see maps:', error.message);
}

// Centre of the pilot area: Ndera Sector, Gasabo District, Kigali. MapLibre takes [longitude, latitude].
const NDERA_CENTRE = [30.171, -1.9495];
const MAP_STYLE = process.env.EXPO_PUBLIC_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty';

const SIZE = { site: 22, unassigned: 22, technician: 24, onsite: 24 };

// Same colours as the web markers (frontend index.css .map-marker--*).
const MARKER_STYLE = {
  unassigned: { backgroundColor: colors.danger, borderWidth: 2, borderColor: colors.white },
  site: { backgroundColor: colors.ink, borderWidth: 2, borderColor: colors.white },
  technician: { backgroundColor: colors.volt, borderWidth: 3, borderColor: colors.ink, borderRadius: 12 },
  onsite: { backgroundColor: colors.ok, borderWidth: 3, borderColor: colors.ink, borderRadius: 12 },
};

/**
 * One reusable map for the customer and technician screens (MapLibre + OpenFreeMap, no API key).
 *
 * markers: [{ id, lat, lng, kind: 'site' | 'unassigned' | 'technician' | 'onsite', label }]
 * lines:   [[[lat, lng], [lat, lng]], …]  straight links between a technician and a fault
 * interactive: false gives a static preview (no zoom, drag or rotate)
 */
export default function MapView(props) {
  if (!MapLibre) {
    return (
      <View style={[styles.missing, { height: props.height ?? 240 }]}>
        <Text style={styles.missingText}>Map unavailable in this build</Text>
      </View>
    );
  }
  return <MapLibreView {...props} />;
}

function MapLibreView({ markers = [], lines = [], interactive = true, height = 240, label = 'Map of the service location and the technician' }) {
  const { Camera, GeoJSONSource, Layer, Map, Marker } = MapLibre;
  const cameraRef = useRef(null);
  const fittedKeyRef = useRef('');

  const valid = useMemo(() => markers.filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lng)), [markers]);

  const lineData = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: lines.map((points) => ({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: points.map(([lat, lng]) => [lng, lat]) },
      })),
    }),
    [lines]
  );

  // Re-frame only when the set of markers changes, not on every position update,
  // so the map does not jump while someone is looking at it.
  useEffect(() => {
    const key = valid.map((m) => m.id).sort().join('|');
    if (key === fittedKeyRef.current || !cameraRef.current) return;
    fittedKeyRef.current = key;
    try {
      if (valid.length === 1) {
        cameraRef.current.easeTo({ center: [valid[0].lng, valid[0].lat], zoom: 16, duration: 0 });
      } else if (valid.length > 1) {
        const lngs = valid.map((m) => m.lng);
        const lats = valid.map((m) => m.lat);
        cameraRef.current.fitBounds([Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)], {
          padding: { top: 40, right: 40, bottom: 40, left: 40 },
          duration: 0,
        });
      }
    } catch (error) {
      // The native camera was not ready yet; forget the key so the next update tries again.
      fittedKeyRef.current = '';
      console.warn('[map] could not frame the markers:', error.message);
    }
  }, [valid]);

  // Inside a scrolling page a map that pans on every touch traps the finger, so an interactive map stays
  // locked (the page scrolls over it) until it is tapped once.
  const [unlocked, setUnlocked] = useState(false);
  const gestures = interactive && unlocked;

  return (
    <View accessible accessibilityLabel={label} style={{ height }}>
      <Map
        mapStyle={MAP_STYLE}
        style={styles.map}
        androidView="texture"
        dragPan={gestures}
        touchZoom={gestures}
        doubleTapZoom={gestures}
        doubleTapHoldZoom={gestures}
        touchRotate={false}
        touchPitch={false}
        compass={false}
        logo
        attribution
      >
        {/* maxZoom is a Camera prop, not a fitBounds option: it stops markers metres apart zooming in too far. */}
        <Camera ref={cameraRef} maxZoom={16} initialViewState={{ center: valid[0] ? [valid[0].lng, valid[0].lat] : NDERA_CENTRE, zoom: 14 }} />

        {lines.length > 0 ? (
          <GeoJSONSource id="links" data={lineData}>
            <Layer id="links-line" type="line" layout={{ 'line-cap': 'butt' }} paint={{ 'line-color': colors.ink, 'line-width': 4, 'line-dasharray': [0.5, 2] }} />
          </GeoJSONSource>
        ) : null}

        {valid.map((marker) => {
          const size = SIZE[marker.kind] ?? 22;
          return (
            <Marker key={marker.id} id={marker.id} lngLat={[marker.lng, marker.lat]}>
              <View accessibilityLabel={marker.label} style={[{ width: size, height: size }, MARKER_STYLE[marker.kind]]} />
            </Marker>
          );
        })}
      </Map>
      {interactive && !unlocked ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Tap to move and zoom the map" onPress={() => setUnlocked(true)} style={styles.lock}>
          <View style={styles.lockPill}>
            <Text style={styles.lockText}>Tap to move the map</Text>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  lock: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', alignItems: 'center', padding: 12 },
  lockPill: { backgroundColor: colors.ink, paddingHorizontal: 12, paddingVertical: 6 },
  lockText: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 0.9, textTransform: 'uppercase', color: colors.white },
  missing: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper },
  missingText: { fontFamily: fonts.mono, fontSize: 12, textTransform: 'uppercase', color: colors.muted },
});
