import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Eyebrow, KeyRow, Panel, PanelHead, StageBar } from '../../src/components/Bits.js';
import MapView from '../../src/components/MapView.js';
import { StatusPill } from '../../src/components/Pills.js';
import { Screen } from '../../src/components/Shell.js';
import { Async, EmptyState } from '../../src/components/States.js';
import { useAuth } from '../../src/context/AuthContext.js';
import { useApi } from '../../src/hooks/useApi.js';
import { CATEGORY_LABEL, CUSTOMER_HEADLINE, firstNames, greeting, isOpen, locationLine, timeAgo } from '../../src/lib/format.js';
import { faultMapParts } from '../../src/lib/mapParts.js';
import { colors, fonts } from '../../src/theme.js';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const state = useApi('/faults', { interval: 5000 });

  const faults = state.data?.faults ?? [];
  const current = faults.find(isOpen);
  const recent = faults.filter((fault) => fault.id !== current?.id).slice(0, 3);

  return (
    <Screen>
      <View style={styles.hero}>
        <Eyebrow style={{ color: colors.muted }}>
          {greeting()}, {firstNames(user.name)}
        </Eyebrow>
        <Text accessibilityRole="header" style={styles.title}>
          {current ? 'Your fault is being handled' : 'Is your electricity not working?'}
        </Text>
        <Button label="Report a Fault" icon="zap" onPress={() => router.navigate('/customer/report')} style={{ alignSelf: 'flex-start' }} />
      </View>

      <Async state={state} label="Loading your faults">
        {() => (
          <>
            {current ? (
              <CurrentFault fault={current} onTrack={() => router.push(`/customer/faults/${current.id}`)} />
            ) : (
              <EmptyState title="No open fault">
                You have no fault in progress. If your power, voltage, connection or meter has a problem, report it and a technician will be sent to your registered service location.
              </EmptyState>
            )}

            <Panel>
              <View style={styles.panelHeadRow}>
                <Text style={styles.panelHeadLabel}>Recent reports</Text>
                <Pressable accessibilityRole="link" onPress={() => router.navigate('/customer/reports')}>
                  <Text style={styles.link}>View all</Text>
                </Pressable>
              </View>
              {recent.length === 0 ? (
                <Text style={styles.empty}>Your earlier reports will be listed here.</Text>
              ) : (
                recent.map((fault, index) => (
                  <Pressable
                    key={fault.id}
                    accessibilityRole="link"
                    onPress={() => router.push(`/customer/faults/${fault.id}`)}
                    style={({ pressed }) => [styles.recent, index > 0 && styles.recentDivider, pressed && { backgroundColor: colors.paper }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ref}>#{fault.reference}</Text>
                      <Text style={styles.category}>{CATEGORY_LABEL[fault.category]}</Text>
                    </View>
                    <StatusPill status={fault.status} />
                  </Pressable>
                ))
              )}
            </Panel>
          </>
        )}
      </Async>
    </Screen>
  );
}

function CurrentFault({ fault, onTrack }) {
  const { markers, lines } = faultMapParts(fault);
  return (
    <Panel accessibilityLabel={`Current fault ${fault.reference}`}>
      <View style={styles.statusBlock}>
        <Eyebrow>Current status · Fault #{fault.reference}</Eyebrow>
        <Text style={styles.headline}>{CUSTOMER_HEADLINE[fault.status]}</Text>
        <Text style={styles.updated}>Last updated {timeAgo(fault.updatedAt)}</Text>
      </View>
      <View style={styles.details}>
        <KeyRow label="Report ID" mono>#{fault.reference}</KeyRow>
        <KeyRow label="Fault category">{CATEGORY_LABEL[fault.category]}</KeyRow>
        <KeyRow label="Technician">{fault.technician?.name ?? 'Not assigned yet'}</KeyRow>
        <KeyRow label="Location" last>{locationLine(fault.serviceLocation)}</KeyRow>
        <View style={{ marginTop: 16 }}>
          <StageBar status={fault.status} />
        </View>
        <Button label="Track response" tone="ink" onPress={onTrack} style={{ marginTop: 16 }} />
      </View>
      <View style={{ borderTopWidth: 1, borderTopColor: colors.ink }}>
        <MapView markers={markers} lines={lines} interactive={false} height={190} />
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 12, borderBottomWidth: 1, borderBottomColor: colors.ink, paddingBottom: 16 },
  title: { fontFamily: fonts.black, fontSize: 30, lineHeight: 30, letterSpacing: -0.6, textTransform: 'uppercase', color: colors.ink },
  statusBlock: { backgroundColor: colors.volt, borderBottomWidth: 1, borderBottomColor: colors.ink, padding: 20 },
  headline: { marginTop: 8, fontFamily: fonts.black, fontSize: 32, lineHeight: 32, textTransform: 'uppercase', color: colors.ink },
  updated: { marginTop: 12, fontFamily: fonts.mono, fontSize: 12, color: colors.ink },
  details: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  panelHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.ink, paddingHorizontal: 16, paddingVertical: 10 },
  panelHeadLabel: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 0.9, textTransform: 'uppercase', color: colors.white },
  link: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 0.9, textTransform: 'uppercase', color: colors.volt },
  empty: { padding: 16, fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  recent: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  recentDivider: { borderTopWidth: 1, borderTopColor: colors.line },
  ref: { fontFamily: fonts.mono, fontSize: 12, color: colors.ink },
  category: { marginTop: 2, fontFamily: fonts.black, fontSize: 16, textTransform: 'uppercase', color: colors.ink },
});
