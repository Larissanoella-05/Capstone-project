import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button, KeyRow, Panel } from '../../../../src/components/Bits.js';
import { Screen } from '../../../../src/components/Shell.js';
import { Async } from '../../../../src/components/States.js';
import { useApi } from '../../../../src/hooks/useApi.js';
import {
  CATEGORY_LABEL,
  OUTCOME_LABEL,
  fmtTime,
  locationLine,
} from '../../../../src/lib/format.js';
import { colors, fonts, radius } from '../../../../src/theme.js';

/** Shown after a technician resolves a job. */
export default function JobClosed() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const state = useApi(`/faults/${id}`);

  return (
    <Screen>
      <Async state={state} label="Loading job">
        {({ fault }) => (
          <>
            <View style={styles.hero}>
              <View style={styles.tick}>
                <Feather name="check" size={32} color={colors.onAccent} />
              </View>
              <Text accessibilityRole="header" style={styles.title}>
                Job closed
              </Text>
              <Text style={styles.note}>
                Fault marked as resolved. The customer has been notified.
              </Text>
            </View>

            <Panel style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
              <KeyRow label="Fault ID" mono>
                {fault.reference}
              </KeyRow>
              <KeyRow label="Category">{CATEGORY_LABEL[fault.category]}</KeyRow>
              <KeyRow label="Location">{locationLine(fault.serviceLocation)}</KeyRow>
              <KeyRow label="Outcome">{OUTCOME_LABEL[fault.outcome] ?? 'Resolved'}</KeyRow>
              <KeyRow label="Completed" last>
                {fmtTime(fault.resolvedAt)}
              </KeyRow>
            </Panel>

            <View style={{ gap: 12 }}>
              <Button
                label="Back to home"
                onPress={() => router.replace('/technician')}
                style={{ minHeight: 56 }}
              />
              <Button
                label="My jobs"
                tone="outline"
                onPress={() => router.replace('/technician/jobs')}
              />
            </View>
          </>
        )}
      </Async>
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
  title: { fontFamily: fonts.black, fontSize: 26, lineHeight: 30, color: colors.ink },
  note: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, textAlign: 'center' },
});
