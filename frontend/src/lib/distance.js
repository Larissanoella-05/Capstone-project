/**
 * A distance in metres as text: "42 m" under a kilometre, "1.2 km" from 1,000 m, "—" if it was not measured.
 * @param {number | null | undefined} metres
 */
export function fmtMetres(metres) {
  if (metres === null || metres === undefined) return '—';
  if (metres < 1000) return `${metres} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}
