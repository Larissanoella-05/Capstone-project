import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  CUSTOMER_TIMELINE_LABEL,
  STATUS_LABEL,
  STATUS_TIME_FIELD,
  fmtTime,
} from '../lib/format.js';
import { colors, fonts, radius } from '../theme.js';

// The five steps the segments and the timeline show. WORKING folds into ARRIVED, as on the web.
const STEPS = ['REPORTED', 'ASSIGNED', 'ON_THE_WAY', 'ARRIVED', 'RESOLVED'];
const stepIndex = (status) => STEPS.indexOf(status === 'WORKING' ? 'ARRIVED' : status);

/**
 * A white card with a 4 px radius, like the web's `.panel`. It has no overflow clipping and no elevation shadow:
 * buttons inside an elevated, clipped card did not receive taps on Android (Open job, Track live).
 */
export function Panel({ children, style, ...rest }) {
  return (
    <View style={[styles.panel, style]} {...rest}>
      {children}
    </View>
  );
}

/** The title strip at the top of a panel. */
export function PanelHead({ children, style, textStyle }) {
  return (
    <View style={[styles.panelHead, style]}>
      <Text style={[styles.panelHeadText, textStyle]}>{children}</Text>
    </View>
  );
}

const BUTTON_TONES = {
  volt: { backgroundColor: colors.accent, borderColor: colors.accent, color: colors.onAccent },
  ink: { backgroundColor: colors.ink, borderColor: colors.ink, color: colors.white },
  outline: { backgroundColor: colors.white, borderColor: colors.line, color: colors.ink },
};

/** Button in the web's three tones (`volt` is the accent fill). `icon` is a Feather icon name. */
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

/** Filter chip (All / Open / Resolved). */
export function Chip({ label, active, onPress }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}

const CATEGORY_ICON = {
  POWER_OUTAGE: 'zap-off',
  LOW_VOLTAGE: 'zap',
  DAMAGED_CONNECTION: 'activity',
  METER_ISSUE: 'sliders',
  OTHER: 'help-circle',
};

/** Square tint tile with the icon of a fault category, used in lists of faults. */
export function FaultIcon({ category }) {
  return (
    <View style={styles.faultIcon}>
      <Feather name={CATEGORY_ICON[category] ?? 'zap'} size={22} color={colors.accent} />
    </View>
  );
}

/** Round tile with the initials of a person, used in the greeting row. */
export function Avatar({ name }) {
  const initials = (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
  return (
    <View accessibilityElementsHidden style={styles.avatar}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

/** Five progress segments: done steps are the accent colour, the current step a lighter accent. */
export function StageBar({ status }) {
  const current = stepIndex(status);
  const resolved = status === 'RESOLVED';
  return (
    <View>
      <View accessibilityElementsHidden style={styles.stageRow}>
        {STEPS.map((step, index) => {
          const done = resolved || index < current;
          const active = index === current && !resolved;
          return (
            <View
              key={step}
              style={[
                styles.segment,
                done && { backgroundColor: colors.accent },
                active && { backgroundColor: colors.accent, opacity: 0.45 },
              ]}
            />
          );
        })}
      </View>
      <Eyebrow style={{ marginTop: 8 }}>
        {current >= 0
          ? `Stage ${current + 1} of ${STEPS.length} · ${STATUS_LABEL[status]}`
          : (STATUS_LABEL[status] ?? status)}
      </Eyebrow>
    </View>
  );
}

/** The response timeline; every role reads the same stored timestamps. */
export function Timeline({ fault, audience = 'customer' }) {
  const current = stepIndex(fault.status);
  const resolved = fault.status === 'RESOLVED';
  const labels = audience === 'customer' ? CUSTOMER_TIMELINE_LABEL : STATUS_LABEL;
  return (
    <View style={styles.timeline}>
      {STEPS.map((step, index) => {
        const time = fault[STATUS_TIME_FIELD[step]];
        const done = Boolean(time) && (index < current || resolved);
        const active = index === current && !resolved;
        const last = index === STEPS.length - 1 && fault.status !== 'CANCELLED';
        return (
          <View
            key={step}
            accessible
            accessibilityState={{ selected: active }}
            style={styles.timelineRow}
          >
            <View style={styles.timelineRail}>
              <View
                style={[
                  styles.timelineDot,
                  done ? styles.dotDone : active ? styles.dotActive : null,
                ]}
              >
                {done ? <Feather name="check" size={14} color={colors.onAccent} /> : null}
                {active ? <View style={styles.dotCore} /> : null}
              </View>
              {!last ? (
                <View style={[styles.timelineLine, done && { backgroundColor: colors.accent }]} />
              ) : null}
            </View>
            <View style={{ flex: 1, paddingTop: 2 }}>
              <Text
                style={[
                  styles.timelineLabel,
                  done || active ? { fontFamily: fonts.bold } : { color: colors.ash },
                ]}
              >
                {labels[step]}
              </Text>
              {active ? <Text style={styles.currentNote}>Current stage</Text> : null}
            </View>
            <Text style={styles.timelineTime}>{fmtTime(time)}</Text>
          </View>
        );
      })}
      {fault.status === 'CANCELLED' ? (
        <View style={styles.timelineRow}>
          <View style={styles.timelineRail}>
            <View
              style={[
                styles.timelineDot,
                { backgroundColor: colors.danger, borderColor: colors.danger },
              ]}
            />
          </View>
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
  unassigned: ['Unassigned fault', { backgroundColor: colors.accent, borderRadius: 7 }],
  site: ['Assigned / on the way', { backgroundColor: colors.ink, borderRadius: radius }],
  onsite: ['Technician on site', { backgroundColor: colors.ok, borderRadius: radius }],
  technician: ['Technician', { backgroundColor: colors.blue, borderRadius: radius }],
};

/** The small key under a map. */
export function MapLegend({ items }) {
  return (
    <View style={styles.legend}>
      {items.map((item) => (
        <View key={item} style={styles.legendItem}>
          <View style={[styles.swatch, MAP_LEGEND[item][1]]}>
            {item === 'onsite' || item === 'technician' ? (
              <Feather name="zap" size={10} color={colors.white} />
            ) : null}
          </View>
          <Eyebrow>{MAP_LEGEND[item][0]}</Eyebrow>
        </View>
      ))}
    </View>
  );
}

/** Small label used above headings and inside panels. */
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
      <Eyebrow>{label}</Eyebrow>
      <Text style={styles.cellValue}>{children}</Text>
    </View>
  );
}

/** Page title block with the small label above it. */
export function PageHeading({ eyebrow, title, children }) {
  return (
    <View style={styles.heading}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius,
    backgroundColor: colors.white,
  },
  panelHead: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  panelHeadText: { fontFamily: fonts.heading, fontSize: 14, color: colors.ink },
  button: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: radius,
    paddingHorizontal: 20,
  },
  buttonText: { fontFamily: fonts.bold, fontSize: 15 },
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  faultIcon: {
    width: 44,
    height: 44,
    borderRadius: radius,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tint,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  avatarText: { fontFamily: fonts.black, fontSize: 14, color: colors.onAccent },
  stageRow: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.line },
  timeline: { padding: 16 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  timelineRail: { alignItems: 'center' },
  timelineLine: { width: 2, height: 24, backgroundColor: colors.line },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  dotDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  dotActive: { backgroundColor: colors.white, borderColor: colors.accent, borderWidth: 2 },
  dotCore: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  timelineLabel: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink },
  currentNote: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  timelineTime: { paddingTop: 2, fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 20,
    rowGap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  swatch: { width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.muted,
  },
  keyRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 10 },
  hairline: { borderBottomWidth: 1, borderBottomColor: colors.line },
  keyLabel: { flexShrink: 0, lineHeight: 20 },
  keyValue: { flex: 1, textAlign: 'right', fontSize: 14, color: colors.ink },
  semibold: { fontFamily: fonts.semibold },
  mono: { fontFamily: fonts.medium },
  cell: { padding: 12 },
  cellValue: { marginTop: 4, fontSize: 14, fontFamily: fonts.semibold, color: colors.ink },
  heading: { paddingBottom: 4 },
  title: {
    marginTop: 6,
    fontFamily: fonts.black,
    fontSize: 26,
    lineHeight: 30,
    color: colors.ink,
  },
});
