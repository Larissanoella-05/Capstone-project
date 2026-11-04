import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../theme.js';

/** The brand as the landing page's nav shows it: the accent bolt and the UMURIRO wordmark. */
export function Brand({ onDark = false, iconSize = 22 }) {
  return (
    <View style={styles.brand}>
      <Feather name="zap" size={iconSize} color={colors.accent} />
      <Text style={[styles.wordmark, { color: onDark ? colors.white : colors.ink }]}>UMURIRO</Text>
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
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmark: { fontFamily: fonts.black, fontSize: 20 },
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
