import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../theme.js';

/** The square bolt mark. `inverse` is the accent-on-white variant used on dark backgrounds. */
export function LogoMark({ inverse = false }) {
  return (
    <View style={[styles.mark, { backgroundColor: inverse ? colors.white : colors.accent }]}>
      <Feather name="zap" size={20} color={inverse ? colors.accent : colors.onAccent} />
    </View>
  );
}

/** Black strip that reminds everyone this is a pilot and not the real fault line. */
export function PilotBanner() {
  return (
    <View style={styles.banner}>
      <Text style={styles.pilot}>PILOT</Text>
      <Text style={styles.bannerText}>Test reports only. Real fault: call 2727.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    width: 40,
    height: 40,
    borderRadius: radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    backgroundColor: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  pilot: {
    backgroundColor: colors.accent,
    color: colors.onAccent,
    borderRadius: radius,
    overflow: 'hidden',
    fontFamily: fonts.bold,
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  bannerText: {
    color: colors.white,
    fontFamily: fonts.medium,
    fontSize: 10,
    flexShrink: 1,
  },
});
