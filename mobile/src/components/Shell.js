import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext.js';
import { colors, fonts, radius } from '../theme.js';
import Backdrop from './Backdrop.js';
import { LogoMark, PilotBanner } from './Brand.js';

/** Pilot strip, brand, alerts bell and sign-out: the top bar of both role layouts. */
export function AppHeader({ base, unread = 0 }) {
  const { logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ backgroundColor: colors.white, paddingTop: insets.top }}>
      <PilotBanner />
      <View style={styles.bar}>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.navigate(base)}
          style={styles.brand}
        >
          <LogoMark />
          <Text style={styles.brandText}>Umuriro</Text>
        </Pressable>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={unread ? `Notifications, ${unread} unread` : 'Notifications'}
            onPress={() => router.navigate(`${base}/notifications`)}
            style={styles.action}
          >
            <Feather name="bell" size={20} color={colors.ink} />
            {unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread}</Text>
              </View>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            onPress={logout}
            style={styles.action}
          >
            <Feather name="log-out" size={20} color={colors.ink} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/**
 * Scrolling page body with the standard phone padding, on the paper background with the circuit art.
 * `footer` is a sticky action bar that stays above the tab bar while the page scrolls.
 */
export function Screen({ children, footer }) {
  // Android draws edge to edge, so the system no longer shrinks the page for the keyboard; do it here.
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.paper }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Backdrop />
      <ScrollView
        style={{ backgroundColor: 'transparent' }}
        contentContainerStyle={styles.screen}
        keyboardShouldPersistTaps="handled"
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 },
  brandText: {
    fontFamily: fonts.black,
    fontSize: 18,
    color: colors.ink,
  },
  actions: { flexDirection: 'row' },
  action: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius,
    backgroundColor: colors.accent,
  },
  badgeText: { fontFamily: fonts.bold, fontSize: 11, color: colors.onAccent },
  screen: { padding: 16, paddingBottom: 32, gap: 20 },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.white,
  },
});
