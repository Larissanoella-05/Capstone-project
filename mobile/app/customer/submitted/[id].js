import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button, KeyRow, Panel, PanelHead, Timeline } from '../../../src/components/Bits.js';
import { StatusPill } from '../../../src/components/Pills.js';
import { Screen } from '../../../src/components/Shell.js';
import { Async } from '../../../src/components/States.js';
import { useApi } from '../../../src/hooks/useApi.js';
import { CATEGORY_LABEL, fmtTime, locationLine } from '../../../src/lib/format.js';
import { colors, fonts, radius } from '../../../src/theme.js';

export default function Submitted() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const state = useApi(`/faults/${id}`);

  return (
    <Screen>
      <Async state={state} label="Loading your report">
        {({ fault }) => (
          <>
            <View style={styles.hero}>
              <View style={styles.tick}>
                <Feather name="check" size={32} color={colors.onAccent} />
              </View>
              <Text accessibilityRole="header" style={styles.title}>
                Fault report submitted
              </Text>
              <Text style={styles.reference}>Reference #{fault.reference}</Text>
            </View>

            <Panel style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
              <KeyRow label="Report ID" mono>
                {fault.reference}
              </KeyRow>
              <KeyRow label="Category">{CATEGORY_LABEL[fault.category]}</KeyRow>
              <KeyRow label="Location">{locationLine(fault.serviceLocation)}</KeyRow>
              <KeyRow label="Reported">{fmtTime(fault.reportedAt)}</KeyRow>
              <KeyRow label="Status" last>
                <StatusPill status={fault.status} />
              </KeyRow>
            </Panel>

            <Text style={styles.note}>
              A service coordinator will now assign a technician. The technician is sent to your
              registered service location, so you do not need to call to give directions.
            </Text>

            <Panel>
              <PanelHead>What happens next</PanelHead>
              <Timeline fault={fault} audience="customer" />
            </Panel>

            <View style={{ gap: 12 }}>
              <Button
                label="Track this fault"
                onPress={() => router.replace(`/customer/faults/${fault.id}`)}
                style={{ minHeight: 56 }}
              />
              <Button
                label="Back to home"
                tone="outline"
                onPress={() => router.replace('/customer')}
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
