import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar, FaultIcon, Panel } from '../../src/components/Bits.js';
import { PriorityPill, StatusPill } from '../../src/components/Pills.js';
import { Screen } from '../../src/components/Shell.js';
import { Async, EmptyState } from '../../src/components/States.js';
import { useAuth } from '../../src/context/AuthContext.js';
import { useApi } from '../../src/hooks/useApi.js';
import {
  CATEGORY_LABEL,
  firstNames,
  greeting,
  isOpen,
  locationLine,
  timeAgo,
} from '../../src/lib/format.js';
import { pickActiveJob } from '../../src/lib/jobs.js';
import { colors, fonts } from '../../src/theme.js';

const isToday = (value) => value && new Date(value).toDateString() === new Date().toDateString();

export default function TechnicianDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const state = useApi('/faults', { interval: 5000 });

  const faults = state.data?.faults ?? [];
  const active = pickActiveJob(faults);
  const pending = faults.filter((fault) => isOpen(fault) && fault.id !== active?.id);
  const completedToday = faults.filter(
    (fault) => fault.status === 'RESOLVED' && isToday(fault.resolvedAt)
  );
  const assignedToday = faults.filter((fault) => isToday(fault.assignedAt));
  const open = (id) => router.push(`/technician/jobs/${id}`);

  return (
    <Screen>
      <View style={styles.greetingRow}>
        <View>
          <Text style={styles.greeting}>{greeting()},</Text>
          <Text accessibilityRole="header" style={styles.name}>
            {firstNames(user.name)}
          </Text>
        </View>
        <Avatar name={user.name} />
      </View>

      <Async state={state} label="Loading your jobs">
        {() => (
          <>
            <View style={styles.stats}>
              {[
                ["Today's assignments", assignedToday.length],
                ['Pending', faults.filter(isOpen).length],
                ['Completed today', completedToday.length],
              ].map(([label, value]) => (
                <Panel key={label} style={styles.stat}>
                  <Text style={styles.statLabel}>{label}</Text>
                  <Text style={styles.statValue}>{value}</Text>
                </Panel>
              ))}
            </View>

            {active ? (
              <Panel accessibilityLabel="Next job">
                <View style={styles.activeHead}>
                  <Text style={styles.activeHeadTitle}>Next job</Text>
                  <Text style={styles.activeHeadNote}>Assigned {timeAgo(active.assignedAt)}</Text>
                </View>
                <View style={styles.activeBody}>
                  <Text style={styles.ref}>Fault #{active.reference}</Text>
                  <Text style={styles.activeTitle}>{CATEGORY_LABEL[active.category]}</Text>
                  <Text style={styles.activeLocation}>{locationLine(active.serviceLocation)}</Text>
                  {active.serviceLocation.landmark ? (
                    <Text style={styles.text}>{active.serviceLocation.landmark}</Text>
                  ) : null}
                  <View style={styles.pills}>
                    <PriorityPill priority={active.priority} />
                    <StatusPill status={active.status} />
                  </View>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open job"
                  onPress={() => open(active.id)}
                  style={({ pressed }) => [styles.openBar, pressed && { opacity: 0.85 }]}
                >
                  <Text style={styles.openText}>Open job</Text>
                  <Feather name="chevron-right" size={20} color={colors.onAccent} />
                </Pressable>
              </Panel>
            ) : (
              <EmptyState title="No active job">
                New jobs assigned by the service coordinator appear here automatically.
              </EmptyState>
            )}

            {pending.length > 0 ? (
              <View style={{ gap: 12 }}>
                <Text style={styles.sectionTitle}>Waiting</Text>
                {pending.map((fault) => (
                  <Pressable key={fault.id} accessibilityRole="link" onPress={() => open(fault.id)}>
                    <Panel style={styles.row}>
                      <FaultIcon category={fault.category} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowTitle}>{CATEGORY_LABEL[fault.category]}</Text>
                        <Text numberOfLines={1} style={styles.ref}>
                          #{fault.reference} · {locationLine(fault.serviceLocation)}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <StatusPill status={fault.status} />
                        <PriorityPill priority={fault.priority} />
                      </View>
                    </Panel>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </>
        )}
      </Async>
    </Screen>
  );
}

const styles = StyleSheet.create({
  greetingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  name: { fontFamily: fonts.black, fontSize: 26, lineHeight: 30, color: colors.ink },
  stats: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, minHeight: 96, justifyContent: 'space-between', padding: 12 },
  statLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
  statValue: { fontFamily: fonts.black, fontSize: 30, lineHeight: 32, color: colors.ink },
  activeHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  activeHeadTitle: { fontFamily: fonts.heading, fontSize: 14, color: colors.white },
  activeHeadNote: { fontFamily: fonts.regular, fontSize: 12, color: colors.white, opacity: 0.75 },
  activeBody: { padding: 16, gap: 4 },
  activeTitle: { fontFamily: fonts.black, fontSize: 24, lineHeight: 28, color: colors.ink },
  activeLocation: { marginTop: 8, fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  pills: { marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  openBar: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
  },
  openText: { fontFamily: fonts.bold, fontSize: 15, color: colors.onAccent },
  ref: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  text: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  sectionTitle: { fontFamily: fonts.black, fontSize: 16, color: colors.ink },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowTitle: { fontFamily: fonts.black, fontSize: 15, color: colors.ink },
});
