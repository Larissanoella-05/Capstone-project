import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  CUSTOMER_TIMELINE_LABEL,
  STAGES,
  STATUS_LABEL,
  STATUS_TIME_FIELD,
  fmtTime,
} from '../lib/format.js';
import { colors, fonts } from '../theme.js';

/** A bordered white box, like the web's `.panel`. */
export function Panel({ children, style, ...rest }) {
  return (
    <View style={[styles.panel, style]} {...rest}>
      {children}
    </View>
  );
}

/** The black strip at the top of a panel. */
export function PanelHead({ children, style, textStyle }) {
  return (
    <View style={[styles.panelHead, style]}>
      <Text style={[styles.panelHeadText, textStyle]}>{children}</Text>
    </View>
  );
}

const BUTTON_TONES = {
  volt: { backgroundColor: colors.volt, borderColor: colors.ink, color: colors.ink },
  ink: { backgroundColor: colors.ink, borderColor: colors.ink, color: colors.white },
  outline: { backgroundColor: colors.white, borderColor: colors.ink, color: colors.ink },
};

/** Square button in the web's three tones. `icon` is a Feather icon name. */
export function Button({ label, onPress, tone = 'volt', icon, disabled = false, style }) {
  const palette = BUTTON_TONES[tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.backgroundColor, borderColor: palette.borderColor },
        (disabled || pressed) && { opacity: 0.7 },
        style,
      ]}
    >
      {icon ? <Feather name={icon} size={18} color={palette.color} /> : null}
      <Text style={[styles.buttonText, { color: palette.color }]}>{label}</Text>
    </Pressable>
  );
}

/** Six numbered boxes: done stages are black, the current stage is yellow. */
export function StageBar({ status }) {
  const current = STAGES.indexOf(status);
  return (
    <View>
      <View accessibilityElementsHidden style={styles.stageRow}>
        {STAGES.map((stage, index) => {
          const done = index < current || status === 'RESOLVED';
          const active = index === current && status !== 'RESOLVED';
          return (
            <View
              key={stage}
              style={[
                styles.stageBox,
                index > 0 && { borderLeftWidth: 1 },
                done
                  ? { backgroundColor: colors.ink, borderColor: colors.white }
                  : active
                    ? { backgroundColor: colors.volt }
                    : null,
              ]}
            >
              <Text
                style={[
                  styles.stageText,
                  { color: done ? colors.white : active ? colors.ink : colors.muted },
                ]}
              >
                {String(index + 1).padStart(2, '0')}
              </Text>
            </View>
          );
        })}
      </View>
      <Eyebrow style={{ marginTop: 8 }}>
        {current >= 0
          ? `Stage ${current + 1} of ${STAGES.length} · ${STATUS_LABEL[status]}`
          : (STATUS_LABEL[status] ?? status)}
      </Eyebrow>
    </View>
  );
}

/** The response timeline; every role reads the same stored timestamps. */
export function Timeline({ fault, audience = 'customer' }) {
  const current = STAGES.indexOf(fault.status);
  const labels = audience === 'customer' ? CUSTOMER_TIMELINE_LABEL : STATUS_LABEL;
  return (
    <View style={styles.timeline}>
      {STAGES.map((stage, index) => {
        const time = fault[STATUS_TIME_FIELD[stage]];
        const done = Boolean(time) && (index < current || fault.status === 'RESOLVED');
        const active = index === current && fault.status !== 'RESOLVED';
        return (
          <View
            key={stage}
            accessible
            accessibilityState={{ selected: active }}
            style={styles.timelineRow}
          >
            <View
              style={[styles.timelineDot, done ? styles.dotDone : active ? styles.dotActive : null]}
            >
              {done ? <Feather name="check" size={16} color={colors.white} /> : null}
              {active ? <View style={styles.dotCore} /> : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.timelineLabel,
                  done || active ? { fontFamily: fonts.bold } : { color: colors.muted },
                ]}
              >
                {labels[stage]}
              </Text>
              {active ? (
                <Eyebrow style={{ fontSize: 10, color: colors.muted }}>Current stage</Eyebrow>
              ) : null}
            </View>
            <Text style={styles.timelineTime}>{fmtTime(time)}</Text>
          </View>
        );
      })}
      {fault.status === 'CANCELLED' ? (
        <View style={styles.timelineRow}>
          <View
            style={[
              styles.timelineDot,
              { backgroundColor: colors.danger, borderColor: colors.danger },
            ]}
          />
          <Text style={[styles.timelineLabel, { flex: 1, fontFamily: fonts.bold }]}>
            Report cancelled
          </Text>
          <Text style={styles.timelineTime}>{fmtTime(fault.cancelledAt)}</Text>
        </View>
      ) : null}
    </View>
  );
}

const MAP_LEGEND = {
  unassigned: ['Unassigned fault', { backgroundColor: colors.danger }],
  site: ['Assigned / on the way', { backgroundColor: colors.ink }],
  onsite: [
    'Technician on site',
    { backgroundColor: colors.ok, borderRadius: 7, borderWidth: 2, borderColor: colors.ink },
  ],
  technician: [
    'Technician',
    { backgroundColor: colors.volt, borderRadius: 7, borderWidth: 2, borderColor: colors.ink },
  ],
};

/** The small key under a map. */
export function MapLegend({ items }) {
  return (
    <View style={styles.legend}>
      {items.map((item) => (
        <View key={item} style={styles.legendItem}>
          <View style={[styles.swatch, MAP_LEGEND[item][1]]} />
          <Eyebrow>{MAP_LEGEND[item][0]}</Eyebrow>
        </View>
      ))}
    </View>
  );
}

/** Small monospace label used above headings and inside panels. */
export function Eyebrow({ children, style }) {
  return <Text style={[styles.eyebrow, style]}>{children}</Text>;
}

/** Label on the left, value on the right, hairline underneath. */
export function KeyRow({ label, children, mono = false, last = false }) {
  return (
    <View style={[styles.keyRow, !last && styles.hairline]}>
      <Eyebrow style={styles.keyLabel}>{label}</Eyebrow>
      <Text style={[styles.keyValue, mono ? styles.mono : styles.semibold]}>{children}</Text>
    </View>
  );
}

/** Label above value, used in the bordered detail grids. */
export function Cell({ label, children, style }) {
  return (
    <View style={[styles.cell, style]}>
      <Eyebrow style={{ color: colors.muted }}>{label}</Eyebrow>
      <Text style={styles.cellValue}>{children}</Text>
    </View>
  );
}

/** Page title block with the small label above it. */
export function PageHeading({ eyebrow, title, children }) {
  return (
    <View style={styles.heading}>
      {eyebrow ? <Eyebrow style={{ color: colors.muted }}>{eyebrow}</Eyebrow> : null}
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { borderWidth: 1, borderColor: colors.ink, backgroundColor: colors.white },
  panelHead: {
    borderBottomWidth: 1,
    borderBottomColor: colors.ink,
    backgroundColor: colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  panelHeadText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.white,
  },
  button: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    paddingHorizontal: 20,
  },
  buttonText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  stageRow: { flexDirection: 'row', borderWidth: 1, borderColor: colors.ink },
  stageBox: { flex: 1, height: 44, padding: 8, borderColor: colors.ink },
  stageText: { fontFamily: fonts.mono, fontSize: 11 },
  timeline: { padding: 16, gap: 14 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timelineDot: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  dotDone: { backgroundColor: colors.ink, borderColor: colors.ink },
  dotActive: { backgroundColor: colors.volt, borderColor: colors.ink },
  dotCore: { width: 8, height: 8, backgroundColor: colors.ink },
  timelineLabel: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink },
  timelineTime: { fontFamily: fonts.mono, fontSize: 12, color: colors.ink },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 20,
    rowGap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  swatch: { width: 14, height: 14 },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.ink,
  },
  keyRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 10 },
  hairline: { borderBottomWidth: 1, borderBottomColor: colors.line },
  keyLabel: { color: colors.muted, flexShrink: 0, lineHeight: 20 },
  keyValue: { flex: 1, textAlign: 'right', fontSize: 14, color: colors.ink },
  semibold: { fontFamily: fonts.semibold },
  mono: { fontFamily: fonts.monoMedium },
  cell: { padding: 12 },
  cellValue: { marginTop: 4, fontSize: 14, fontFamily: fonts.semibold, color: colors.ink },
  heading: { borderBottomWidth: 1, borderBottomColor: colors.ink, paddingBottom: 16 },
  title: {
    marginTop: 8,
    fontFamily: fonts.black,
    fontSize: 30,
    lineHeight: 30,
    letterSpacing: -0.6,
    textTransform: 'uppercase',
    color: colors.ink,
  },
});
