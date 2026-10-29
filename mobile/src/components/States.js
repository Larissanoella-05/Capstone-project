import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme.js';
import { Eyebrow } from './Bits.js';

export function Loading({ label = 'Loading' }) {
  return (
    <View accessibilityRole="progressbar" style={[styles.box, styles.centerRow]}>
      <ActivityIndicator color={colors.muted} />
      <Eyebrow style={{ color: colors.muted }}>{label}…</Eyebrow>
    </View>
  );
}

/** A square outlined button, used by the retry actions. */
export function OutlineButton({ label, onPress, style }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.outline, pressed && styles.pressed, style]}>
      <Text style={styles.outlineText}>{label}</Text>
    </Pressable>
  );
}

/** The API client reports status 0 when the server cannot be reached or does not answer in time. */
export const isOffline = (error) => error?.status === 0;

export function ErrorState({ error, onRetry }) {
  const offline = isOffline(error);
  return (
    <View accessibilityRole="alert" style={styles.errorBox}>
      <View style={styles.errorBody}>
        <Feather name={offline ? 'wifi-off' : 'alert-triangle'} size={20} color={colors.danger} style={{ marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.errorTitle}>{offline ? 'No connection' : 'This did not load'}</Text>
          <Text style={styles.errorMessage}>{error?.message || 'Something went wrong.'}</Text>
        </View>
      </View>
      {onRetry ? (
        <View style={styles.errorFooter}>
          <OutlineButton label="Try again" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

export function EmptyState({ title, children, action }) {
  return (
    <View style={[styles.box, styles.emptyBox]}>
      <Feather name="inbox" size={22} color={colors.muted} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {children ? <Text style={styles.emptyText}>{children}</Text> : null}
      {action ? <View style={{ marginTop: 16 }}>{action}</View> : null}
    </View>
  );
}

/** Inline message under a form. */
export function FormError({ children }) {
  if (!children) return null;
  return (
    <View accessibilityRole="alert" style={styles.formError}>
      <Feather name="alert-triangle" size={16} color={colors.danger} style={{ marginTop: 2 }} />
      <Text style={styles.formErrorText}>{children}</Text>
    </View>
  );
}

/** Handles the three states every data screen has before it can show its content. */
export function Async({ state, label, children }) {
  if (state.loading && !state.data) return <Loading label={label} />;
  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />;
  if (!state.data) return null;
  return (
    <>
      {state.offline ? <OfflineStrip onRetry={state.reload} /> : null}
      {children(state.data)}
    </>
  );
}

/** Shown above already-loaded content when a refresh fails because the connection is down. */
export function OfflineStrip({ onRetry }) {
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.offline}>
      <Feather name="wifi-off" size={16} color={colors.ink} />
      <Text style={styles.offlineText}>No connection. Showing the last update.</Text>
      <Pressable accessibilityRole="button" onPress={onRetry} hitSlop={8}>
        <Text style={styles.offlineAction}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16, paddingVertical: 32 },
  centerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  outline: { minHeight: 44, borderWidth: 1, borderColor: colors.ink, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  outlineText: { fontFamily: fonts.bold, fontSize: 14, letterSpacing: 1.1, textTransform: 'uppercase', color: colors.ink },
  pressed: { backgroundColor: colors.paper },
  errorBox: { borderWidth: 1, borderColor: colors.danger },
  errorBody: { flexDirection: 'row', gap: 12, padding: 16 },
  errorTitle: { fontFamily: fonts.black, fontSize: 16, textTransform: 'uppercase', color: colors.ink },
  errorMessage: { marginTop: 4, fontFamily: fonts.regular, fontSize: 14, color: colors.ink },
  errorFooter: { borderTopWidth: 1, borderTopColor: colors.danger, padding: 12 },
  offline: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.ink, backgroundColor: colors.voltSoft, paddingHorizontal: 12, paddingVertical: 10 },
  offlineText: { flex: 1, fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  offlineAction: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 0.9, textTransform: 'uppercase', color: colors.ink, textDecorationLine: 'underline' },
  emptyBox: { alignItems: 'center' },
  emptyTitle: { marginTop: 12, fontFamily: fonts.black, fontSize: 16, textTransform: 'uppercase', color: colors.ink, textAlign: 'center' },
  emptyText: { marginTop: 4, fontFamily: fonts.regular, fontSize: 14, color: colors.muted, textAlign: 'center' },
  formError: { flexDirection: 'row', gap: 8, borderWidth: 1, borderColor: colors.danger, backgroundColor: colors.white, padding: 12 },
  formErrorText: { flex: 1, fontFamily: fonts.semibold, fontSize: 14, color: colors.danger },
});
