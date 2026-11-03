import { StyleSheet, Text, View } from 'react-native';
import { PRIORITY_LABEL, STATUS_LABEL } from '../lib/format.js';
import { PRIORITY_TONE, STATUS_TONE } from '../lib/statusTone.js';
import { colors, fonts, radius } from '../theme.js';

const OUTLINE = { bg: colors.white, fg: colors.ink };

function Pill({ label, tone = OUTLINE }) {
  return (
    <View style={[styles.pill, { backgroundColor: tone.bg }]}>
      <Text style={[styles.text, { color: tone.fg }]}>{label}</Text>
    </View>
  );
}

export function StatusPill({ status }) {
  return <Pill label={STATUS_LABEL[status] ?? status} tone={STATUS_TONE[status]} />;
}

export function PriorityPill({ priority, withLabel = false }) {
  return (
    <Pill
      label={`${withLabel ? 'Priority: ' : ''}${PRIORITY_LABEL[priority] ?? priority}`}
      tone={PRIORITY_TONE[priority]}
    />
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: radius,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: {
    fontFamily: fonts.bold,
    fontSize: 11.5,
    lineHeight: 16,
  },
});
