import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Eyebrow, PageHeading, Panel, PanelHead } from '../../src/components/Bits.js';
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
      <PageHeading eyebrow={`${greeting()}, ${firstNames(user.name)}`} title="Your jobs" />

      <Async state={state} label="Loading your jobs">
        {() => (
          <>
            {active ? (
              <Panel accessibilityLabel="Active job">
                <View style={styles.activeHead}>
                  <Eyebrow>Active job</Eyebrow>
                  <Text style={styles.mono}>Assigned {timeAgo(active.assignedAt)}</Text>
                </View>
                <View style={styles.activeBody}>
                  <Text style={styles.mono}>Fault #{active.reference}</Text>
                  <Text style={styles.activeTitle}>{CATEGORY_LABEL[active.category]}</Text>
                  <Text style={styles.activeLocation}>{locationLine(active.serviceLocation)}</Text>
                  {active.serviceLocation.landmark ? (
                    <Text style={styles.text}>{active.serviceLocation.landmark}</Text>
                  ) : null}
                </View>
                <View style={styles.pair}>
                  <View style={styles.pairCell}>
                    <Eyebrow style={{ color: colors.muted }}>Priority</Eyebrow>
                    <View style={{ marginTop: 6 }}>
                      <PriorityPill priority={active.priority} />
                    </View>
                  </View>
                  <View
                    style={[styles.pairCell, { borderLeftWidth: 1, borderLeftColor: colors.ink }]}
                  >
                    <Eyebrow style={{ color: colors.muted }}>Status</Eyebrow>
                    <View style={{ marginTop: 6 }}>
                      <StatusPill status={active.status} />
                    </View>
                  </View>
                </View>
                <View style={{ borderTopWidth: 1, borderTopColor: colors.ink, padding: 12 }}>
                  <Button
                    label="View Job"
                    tone="ink"
                    onPress={() => open(active.id)}
                    style={{ minHeight: 56 }}
                  />
                </View>
              </Panel>
            ) : (
              <EmptyState title="No active job">
                New jobs assigned by the service coordinator appear here automatically.
              </EmptyState>
            )}

            <View style={styles.stats}>
              {[
                ["Today's assignments", assignedToday.length],
                ['Pending jobs', faults.filter(isOpen).length],
                ['Completed today', completedToday.length],
              ].map(([label, value]) => (
                <View key={label} style={styles.stat}>
                  <Eyebrow style={{ color: colors.muted }}>{label}</Eyebrow>
                  <Text style={styles.statValue}>{value}</Text>
                </View>
              ))}
            </View>

            {pending.length > 0 ? (
              <Panel>
                <PanelHead>Pending jobs</PanelHead>
                {pending.map((fault, index) => (
                  <Pressable
                    key={fault.id}
                    accessibilityRole="link"
                    onPress={() => open(fault.id)}
                    style={({ pressed }) => [
                      styles.row,
                      index > 0 && styles.rowDivider,
                      pressed && { backgroundColor: colors.paper },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.mono}>#{fault.reference}</Text>
                      <Text style={styles.rowTitle}>{CATEGORY_LABEL[fault.category]}</Text>
                      <Text style={styles.text}>{locationLine(fault.serviceLocation)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 8 }}>
                      <StatusPill status={fault.status} />
                      <Text style={styles.mono}>
                        Priority: {fault.priority[0] + fault.priority.slice(1).toLowerCase()}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </Panel>
            ) : null}
          </>
        )}
      </Async>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mono: { fontFamily: fonts.mono, fontSize: 12, color: colors.ink },
  text: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink },
  activeHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink,
    backgroundColor: colors.volt,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  activeBody: { padding: 16, gap: 4 },
  activeTitle: {
    fontFamily: fonts.black,
    fontSize: 28,
    lineHeight: 30,
    textTransform: 'uppercase',
    color: colors.ink,
  },
  activeLocation: { marginTop: 8, fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  pair: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.ink },
  pairCell: { flex: 1, padding: 12 },
  stats: {
    flexDirection: 'row',
    gap: 1,
    borderWidth: 1,
    borderColor: colors.ink,
    backgroundColor: colors.ink,
  },
  stat: {
    flex: 1,
    minHeight: 96,
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: 12,
  },
  statValue: { fontFamily: fonts.black, fontSize: 30, lineHeight: 30, color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.ink },
  rowTitle: {
    marginTop: 4,
    fontFamily: fonts.black,
    fontSize: 18,
    textTransform: 'uppercase',
    color: colors.ink,
  },
});
