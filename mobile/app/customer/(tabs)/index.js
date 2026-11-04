import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Button,
  Eyebrow,
  FaultIcon,
  KeyRow,
  Panel,
  StageBar,
} from '../../../src/components/Bits.js';
import MapView from '../../../src/components/MapView.js';
import { StatusPill } from '../../../src/components/Pills.js';
import { Screen } from '../../../src/components/Shell.js';
import { Async, EmptyState } from '../../../src/components/States.js';
import { useAuth } from '../../../src/context/AuthContext.js';
import { useToast } from '../../../src/context/ToastContext.js';
import { useApi } from '../../../src/hooks/useApi.js';
import {
  CATEGORY_LABEL,
  CUSTOMER_HEADLINE,
  firstNames,
  greeting,
  isOpen,
  locationLine,
  timeAgo,
} from '../../../src/lib/format.js';
import { openLink } from '../../../src/lib/links.js';
import { faultMapParts } from '../../../src/lib/mapParts.js';
import { colors, fonts, radius, shadow } from '../../../src/theme.js';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const state = useApi('/faults', { interval: 5000 });

  const faults = state.data?.faults ?? [];
  const current = faults.find(isOpen);
  const recent = faults.filter((fault) => fault.id !== current?.id).slice(0, 3);

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.greeting}>
          {greeting()}, {firstNames(user.name)}
        </Text>
        <Text accessibilityRole="header" style={styles.title}>
          {current ? 'Your fault is being handled' : 'Is your electricity not working?'}
        </Text>
      </View>

      <Async state={state} label="Loading your faults">
        {() => (
          <>
            {current ? (
              <CurrentFault
                fault={current}
                onTrack={() => router.push(`/customer/faults/${current.id}`)}
              />
            ) : (
              <EmptyState title="No open fault">
                Nothing in progress. If your power is out or something is wrong at the meter, report
                it and we will send a technician.
              </EmptyState>
            )}

            <View style={styles.tiles}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.navigate('/customer/report')}
                style={[styles.tile, styles.tileAccent]}
              >
                <Feather name="zap" size={26} color={colors.onAccent} />
                <Text style={[styles.tileTitle, { color: colors.onAccent }]}>Report a fault</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Real emergency? Call 2727"
                onPress={async () => {
                  if (!(await openLink('tel:2727')))
                    toast('This phone cannot make calls.', 'error');
                }}
                style={[styles.tile, styles.tileWhite]}
              >
                <Feather name="phone" size={26} color={colors.accent} />
                <View>
                  <Text style={styles.tileTitle}>Real emergency?</Text>
                  <Text style={styles.tileNote}>Call 2727</Text>
                </View>
              </Pressable>
            </View>

            <View style={{ gap: 12 }}>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Recent reports</Text>
                <Pressable
                  accessibilityRole="link"
                  hitSlop={12}
                  onPress={() => router.navigate('/customer/reports')}
                >
                  <Text style={styles.link}>View all</Text>
                </Pressable>
              </View>
              {recent.length === 0 ? (
                <Text style={styles.empty}>No reports yet.</Text>
              ) : (
                recent.map((fault) => (
                  <Pressable
                    key={fault.id}
                    accessibilityRole="link"
                    onPress={() => router.push(`/customer/faults/${fault.id}`)}
                  >
                    <Panel style={styles.recent}>
                      <FaultIcon category={fault.category} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.category}>{CATEGORY_LABEL[fault.category]}</Text>
                        <Text style={styles.ref}>
                          #{fault.reference} · {timeAgo(fault.reportedAt)}
                        </Text>
                      </View>
                      <StatusPill status={fault.status} />
                    </Panel>
                  </Pressable>
                ))
              )}
            </View>
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
        <Eyebrow style={{ color: colors.onAccent, opacity: 0.85 }}>
          Current status · Fault #{fault.reference}
        </Eyebrow>
        <Text style={styles.headline}>{CUSTOMER_HEADLINE[fault.status]}</Text>
        <Text style={styles.updated}>Last updated {timeAgo(fault.updatedAt)}</Text>
      </View>
      <View style={styles.details}>
        <KeyRow label="Report ID" mono>
          #{fault.reference}
        </KeyRow>
        <KeyRow label="Fault category">{CATEGORY_LABEL[fault.category]}</KeyRow>
        <KeyRow label="Technician">{fault.technician?.name ?? 'Not assigned yet'}</KeyRow>
        <KeyRow label="Location" last>
          {locationLine(fault.serviceLocation)}
        </KeyRow>
        <View style={{ marginTop: 16 }}>
          <StageBar status={fault.status} />
        </View>
        <Button label="Track live" tone="ink" onPress={onTrack} style={{ marginTop: 16 }} />
      </View>
      <View style={{ borderTopWidth: 1, borderTopColor: colors.line }}>
        <MapView markers={markers} lines={lines} interactive={false} height={190} />
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 6 },
  greeting: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  title: { fontFamily: fonts.black, fontSize: 26, lineHeight: 30, color: colors.ink },
  statusBlock: {
    backgroundColor: colors.accent,
    borderTopLeftRadius: radius - 1,
    borderTopRightRadius: radius - 1,
    padding: 20,
    gap: 6,
  },
  headline: { fontFamily: fonts.black, fontSize: 26, lineHeight: 30, color: colors.onAccent },
  updated: { fontFamily: fonts.regular, fontSize: 12, color: colors.onAccent, opacity: 0.85 },
  details: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  tiles: { flexDirection: 'row', gap: 12 },
  tile: {
    flex: 1,
    minHeight: 112,
    justifyContent: 'space-between',
    borderRadius: radius,
    padding: 16,
    ...shadow,
  },
  tileAccent: { backgroundColor: colors.accent },
  tileWhite: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  tileTitle: { fontFamily: fonts.black, fontSize: 16, color: colors.ink },
  tileNote: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontFamily: fonts.black, fontSize: 16, color: colors.ink },
  link: { fontFamily: fonts.bold, fontSize: 14, color: colors.accent },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  recent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ref: { marginTop: 2, fontFamily: fonts.regular, fontSize: 11, color: colors.muted },
  category: { fontFamily: fonts.black, fontSize: 15, color: colors.ink },
});
