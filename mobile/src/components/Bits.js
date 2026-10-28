import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme.js';

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
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontFamily: fonts.mono, fontSize: 11, lineHeight: 16, letterSpacing: 0.9, textTransform: 'uppercase', color: colors.ink },
  keyRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 10 },
  hairline: { borderBottomWidth: 1, borderBottomColor: colors.line },
  keyLabel: { color: colors.muted, flexShrink: 0, lineHeight: 20 },
  keyValue: { flex: 1, textAlign: 'right', fontSize: 14, color: colors.ink },
  semibold: { fontFamily: fonts.semibold },
  mono: { fontFamily: fonts.monoMedium },
  cell: { padding: 12 },
  cellValue: { marginTop: 4, fontSize: 14, fontFamily: fonts.semibold, color: colors.ink },
  heading: { borderBottomWidth: 1, borderBottomColor: colors.ink, paddingBottom: 16 },
  title: { marginTop: 8, fontFamily: fonts.black, fontSize: 30, lineHeight: 30, letterSpacing: -0.6, textTransform: 'uppercase', color: colors.ink },
});
