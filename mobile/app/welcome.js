import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eyebrow } from '../src/components/Bits.js';
import { LogoMark } from '../src/components/Brand.js';
import { colors, fonts } from '../src/theme.js';

/** First screen when signed out: one fixed page, no scrolling. */
export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.page, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.brandRow}>
        <LogoMark inverse />
        <Text style={styles.brandText}>Umuriro</Text>
      </View>

      <View style={styles.middle}>
        <Eyebrow style={{ color: colors.volt }}>Electricity fault response</Eyebrow>
        <Text style={styles.headline}>
          Report.{'\n'}Locate.{'\n'}
          <Text style={{ color: colors.volt }}>Respond.</Text>
        </Text>
        <View style={styles.facts}>
          {[
            ['Pilot area', 'Ndera Sector'],
            ['Real faults', 'Call 2727'],
          ].map(([label, value], index) => (
            <View key={label} style={[styles.fact, index > 0 && styles.factDivider]}>
              <Eyebrow style={{ color: colors.ash }}>{label}</Eyebrow>
              <Text style={styles.factValue}>{value}</Text>
            </View>
          ))}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/login')}
        style={({ pressed }) => [styles.cta, pressed && { opacity: 0.75 }]}
      >
        <Text style={styles.ctaText}>Sign In</Text>
        <Feather name="arrow-right" size={20} color={colors.ink} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.ink,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandText: {
    fontFamily: fonts.black,
    fontSize: 18,
    textTransform: 'uppercase',
    color: colors.white,
  },
  middle: { gap: 20 },
  headline: {
    fontFamily: fonts.black,
    fontSize: 56,
    lineHeight: 54,
    letterSpacing: -1,
    textTransform: 'uppercase',
    color: colors.white,
  },
  facts: { flexDirection: 'row', borderWidth: 1, borderColor: colors.steel },
  fact: { flex: 1, padding: 12 },
  factDivider: { borderLeftWidth: 1, borderLeftColor: colors.steel },
  factValue: { marginTop: 4, fontFamily: fonts.bold, fontSize: 14, color: colors.white },
  cta: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.ink,
    backgroundColor: colors.volt,
  },
  ctaText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: colors.ink,
  },
});
