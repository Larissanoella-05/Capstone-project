import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Eyebrow, KeyRow, Panel, PanelHead } from '../../../src/components/Bits.js';
import { Screen } from '../../../src/components/Shell.js';
import { Async } from '../../../src/components/States.js';
import { useApi } from '../../../src/hooks/useApi.js';
import { CATEGORY_LABEL, STAGES, STATUS_LABEL, fmtTime, locationLine } from '../../../src/lib/format.js';
import { colors, fonts } from '../../../src/theme.js';

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
                <Feather name="check" size={26} color={colors.white} />
              </View>
              <Eyebrow style={{ marginTop: 16, color: colors.muted }}>Confirmation</Eyebrow>
              <Text accessibilityRole="header" style={styles.title}>Fault report submitted</Text>
            </View>

            <Panel style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
              <KeyRow label="Report ID" mono>{fault.reference}</KeyRow>
              <KeyRow label="Category">{CATEGORY_LABEL[fault.category]}</KeyRow>
              <KeyRow label="Location">{locationLine(fault.serviceLocation)}</KeyRow>
              <KeyRow label="Reported">{fmtTime(fault.reportedAt)}</KeyRow>
              <KeyRow label="Status" last>{STATUS_LABEL[fault.status]}</KeyRow>
            </Panel>

            <Text style={styles.note}>
              A service coordinator will now assign a technician. The technician is sent to your registered service location, so you do not need to call to give directions.
            </Text>

            <Panel>
              <PanelHead>What happens next</PanelHead>
              <View style={styles.grid}>
                {STAGES.map((stage, index) => (
                  <View key={stage} style={[styles.stage, { backgroundColor: stage === fault.status ? colors.volt : colors.white }]}>
                    <Text style={styles.stageNo}>{String(index + 1).padStart(2, '0')}</Text>
                    <Text style={styles.stageLabel}>{STATUS_LABEL[stage]}</Text>
                  </View>
                ))}
              </View>
            </Panel>

            <View style={{ gap: 12 }}>
              <Button label="View Fault" onPress={() => router.replace(`/customer/faults/${fault.id}`)} style={{ minHeight: 56 }} />
              <Button label="Back to dashboard" tone="outline" onPress={() => router.replace('/customer')} />
            </View>
          </>
        )}
      </Async>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderBottomWidth: 1, borderBottomColor: colors.ink, paddingBottom: 16 },
  tick: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ok },
  title: { marginTop: 8, fontFamily: fonts.black, fontSize: 30, lineHeight: 30, letterSpacing: -0.6, textTransform: 'uppercase', color: colors.ink },
  note: { borderWidth: 1, borderColor: colors.ink, backgroundColor: colors.paper, padding: 16, fontFamily: fonts.regular, fontSize: 14, color: colors.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: colors.line, gap: 1 },
  stage: { width: '49.8%', flexGrow: 1, padding: 12 },
  stageNo: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted },
  stageLabel: { marginTop: 4, fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
});
