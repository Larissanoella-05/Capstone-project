import { StyleSheet, Text, View } from 'react-native';
import { PRIORITY_LABEL, STATUS_LABEL } from '../lib/format.js';
import { colors, fonts } from '../theme.js';

// [background, text, border]
const STATUS_STYLE = {
  REPORTED: [colors.danger, colors.white, colors.danger],
  ASSIGNED: [colors.ink, colors.white, colors.ink],
  ON_THE_WAY: [colors.volt, colors.ink, colors.ink],
  ARRIVED: [colors.white, colors.ink, colors.ink],
  WORKING: [colors.warn, colors.white, colors.warn],
  RESOLVED: [colors.ok, colors.white, colors.ok],
  CANCELLED: [colors.white, colors.muted, colors.line],
};

const PRIORITY_STYLE = {
  CRITICAL: [colors.danger, colors.white, colors.danger],
  HIGH: [colors.warn, colors.white, colors.warn],
  MEDIUM: [colors.white, colors.ink, colors.ink],
  LOW: [colors.white, colors.muted, colors.line],
};

function Pill({ label, palette = [colors.white, colors.ink, colors.ink] }) {
  const [background, color, borderColor] = palette;
  return (
    <View style={[styles.pill, { backgroundColor: background, borderColor }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

export function StatusPill({ status }) {
  return <Pill label={STATUS_LABEL[status] ?? status} palette={STATUS_STYLE[status]} />;
}

export function PriorityPill({ priority, withLabel = false }) {
  return (
    <Pill
      label={`${withLabel ? 'Priority: ' : ''}${PRIORITY_LABEL[priority] ?? priority}`}
      palette={PRIORITY_STYLE[priority]}
    />
  );
}

const styles = StyleSheet.create({
  pill: { alignSelf: 'flex-start', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  text: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
});
