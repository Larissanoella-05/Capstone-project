import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../src/components/Bits.js';
import { Screen } from '../../../src/components/Shell.js';
import { useT } from '../../../src/context/LanguageContext.js';
import { useApi } from '../../../src/hooks/useApi.js';

import { colors, fonts, radius } from '../../../src/theme.js';

export default function GuestSent() {
  const { token, reference: sentReference } = useLocalSearchParams();
  const router = useRouter();
  const t = useT();

  // The reference comes with the navigation; it is read back only if the screen was reopened without it.
  const lookup = useApi(sentReference ? null : `/public/faults/${token}`);
  const reference = sentReference ?? lookup.data?.fault.reference;

  return (
    <Screen insetBottom>
      <View style={styles.hero}>
        <View style={styles.tick}>
          <Feather name="check" size={32} color={colors.onAccent} />
        </View>
        <Text accessibilityRole="header" style={styles.title}>
          {t('Fault report sent')}
        </Text>
        <Text style={styles.reference}>
          {reference ? t('Reference #{reference}', { reference }) : t('Reference loading…')}
        </Text>
      </View>

      <Text style={styles.note}>
        {t(
          'Follow this fault in the app: it stays under Reports from this phone. A service coordinator will now assign a technician. Keep your phone nearby: the technician may call to confirm where you are.'
        )}
      </Text>

      <View style={{ gap: 12 }}>
        <Button
          label={t('Track this fault')}
          onPress={() => router.replace({ pathname: '/guest/track/[token]', params: { token } })}
          style={{ minHeight: 56 }}
        />
        <Button
          label={t('Report another fault')}
          tone="outline"
          onPress={() => router.replace('/guest/report')}
        />
        <Button
          label={t('Back to home')}
          tone="outline"
          onPress={() => router.navigate('/landing')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 10, paddingTop: 8 },
  tick: {
    width: 64,
    height: 64,
    borderRadius: radius,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  title: {
    fontFamily: fonts.black,
    fontSize: 26,
    lineHeight: 30,
    color: colors.ink,
    textAlign: 'center',
  },
  reference: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  note: {
    borderRadius: radius,
    backgroundColor: colors.tint,
    padding: 16,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.ink,
  },
});
