import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Eyebrow, PageHeading, Panel } from '../../src/components/Bits.js';
import { PriorityPill, StatusPill } from '../../src/components/Pills.js';
import { Screen } from '../../src/components/Shell.js';
import { Async, EmptyState } from '../../src/components/States.js';
import { useApi } from '../../src/hooks/useApi.js';
import { CATEGORY_LABEL, fmtDateTime, isOpen, locationLine } from '../../src/lib/format.js';
import { colors, fonts } from '../../src/theme.js';

export default function Jobs() {
  const router = useRouter();
  const state = useApi('/faults', { interval: 5000 });
  const [tab, setTab] = useState('OPEN');

  const faults = state.data?.faults ?? [];
  const open = faults.filter(isOpen);
  const completed = faults.filter((fault) => !isOpen(fault));
  const visible = tab === 'OPEN' ? open : completed;

  return (
    <Screen>
      <PageHeading
        eyebrow={state.data ? `${faults.length} jobs in total` : 'Jobs'}
        title="My jobs"
      />

      <Async state={state} label="Loading your jobs">
        {() => (
          <>
            <View accessibilityRole="radiogroup" style={styles.filters}>
              {[
                ['OPEN', `Assigned ${open.length}`],
                ['DONE', `Completed ${completed.length}`],
              ].map(([key, label], index) => (
                <Pressable
                  key={key}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: tab === key }}
                  onPress={() => setTab(key)}
                  style={[
                    styles.filter,
                    index > 0 && styles.divider,
                    { backgroundColor: tab === key ? colors.ink : colors.white },
                  ]}
                >
                  <Eyebrow style={{ color: tab === key ? colors.white : colors.ink }}>
                    {label}
                  </Eyebrow>
                </Pressable>
              ))}
            </View>

            {visible.length === 0 ? (
              <EmptyState title={tab === 'OPEN' ? 'No assigned jobs' : 'No completed jobs yet'}>
                {tab === 'OPEN'
                  ? 'New jobs assigned by the service coordinator appear here automatically.'
                  : 'Jobs you resolve are kept here.'}
              </EmptyState>
            ) : (
              <View style={{ gap: 12 }}>
                {visible.map((fault) => (
                  <Pressable
                    key={fault.id}
                    accessibilityRole="link"
                    onPress={() => router.push(`/technician/jobs/${fault.id}`)}
                  >
                    <Panel>
                      <View style={styles.top}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.mono}>#{fault.reference}</Text>
                          <Text style={styles.title}>{CATEGORY_LABEL[fault.category]}</Text>
                          <Text style={styles.text}>{locationLine(fault.serviceLocation)}</Text>
                        </View>
                        <StatusPill status={fault.status} />
                      </View>
                      <View style={styles.bottom}>
                        <PriorityPill priority={fault.priority} withLabel />
                        <Text style={styles.mono}>
                          {tab === 'OPEN'
                            ? `Reported ${fmtDateTime(fault.reportedAt)}`
                            : `Resolved ${fmtDateTime(fault.resolvedAt ?? fault.cancelledAt)}`}
                        </Text>
                      </View>
                    </Panel>
                  </Pressable>
                ))}
              </View>
            )}

            {tab === 'OPEN' && visible.length > 0 ? (
              <Text style={[styles.text, { color: colors.muted }]}>
                New jobs assigned by the service coordinator appear here automatically.
              </Text>
            ) : null}
          </>
        )}
      </Async>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', borderWidth: 1, borderColor: colors.ink },
  filter: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center' },
  divider: { borderLeftWidth: 1, borderLeftColor: colors.ink },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16 },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  mono: { fontFamily: fonts.mono, fontSize: 12, color: colors.ink },
  title: {
    marginTop: 4,
    fontFamily: fonts.black,
    fontSize: 18,
    textTransform: 'uppercase',
    color: colors.ink,
  },
  text: { marginTop: 4, fontFamily: fonts.regular, fontSize: 14, color: colors.ink },
});
