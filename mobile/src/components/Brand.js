import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme.js';

/** The square bolt mark. `inverse` is the yellow-on-black variant used on the login panel. */
export function LogoMark({ inverse = false }) {
  return (
    <View style={[styles.mark, { backgroundColor: inverse ? colors.volt : colors.ink }]}>
      <Feather name="zap" size={20} color={inverse ? colors.ink : colors.volt} />
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
  mark: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  banner: { backgroundColor: colors.ink, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  pilot: { backgroundColor: colors.volt, color: colors.ink, fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.8, paddingHorizontal: 6, paddingVertical: 2 },
  bannerText: { color: colors.white, fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', flexShrink: 1 },
});
