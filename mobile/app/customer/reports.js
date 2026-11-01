import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Eyebrow, PageHeading, Panel } from '../../src/components/Bits.js';
import { StatusPill } from '../../src/components/Pills.js';
import { Screen } from '../../src/components/Shell.js';
import { Async, EmptyState } from '../../src/components/States.js';
import { useApi } from '../../src/hooks/useApi.js';
import { CATEGORY_LABEL, fmtDateTime, isOpen, locationLine } from '../../src/lib/format.js';
import { colors, fonts } from '../../src/theme.js';

const FILTERS = [
  { key: 'ALL', label: 'All', test: () => true },
  { key: 'OPEN', label: 'Open', test: isOpen },
  { key: 'CLOSED', label: 'Closed', test: (fault) => !isOpen(fault) },
];

export default function Reports() {
  const router = useRouter();
  const state = useApi('/faults', { interval: 5000 });
  const [filter, setFilter] = useState('ALL');
  const faults = state.data?.faults ?? [];
  const visible = faults.filter(FILTERS.find((item) => item.key === filter).test);

  return (
    <Screen>
      <PageHeading
        eyebrow={
          state.data ? `${faults.length} ${faults.length === 1 ? 'report' : 'reports'}` : 'History'
        }
        title="My reports"
      />

      <Async state={state} label="Loading your reports">
        {() => (
          <>
            <View accessibilityRole="radiogroup" style={styles.filters}>
              {FILTERS.map((item, index) => {
                const active = filter === item.key;
                return (
                  <Pressable
                    key={item.key}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    onPress={() => setFilter(item.key)}
                    style={[
                      styles.filter,
                      index > 0 && styles.filterDivider,
                      { backgroundColor: active ? colors.ink : colors.white },
                    ]}
                  >
                    <Eyebrow style={{ color: active ? colors.white : colors.ink }}>
                      {item.label} {faults.filter(item.test).length}
                    </Eyebrow>
                  </Pressable>
                );
              })}
            </View>

            {visible.length === 0 ? (
              <EmptyState
                title={faults.length ? 'Nothing in this list' : 'No reports yet'}
                action={
                  <Button
                    label="Report a Fault"
                    onPress={() => router.navigate('/customer/report')}
                  />
                }
              >
                {faults.length
                  ? 'Choose another filter to see your other reports.'
                  : 'When you report a fault it is listed here.'}
              </EmptyState>
            ) : (
              <View style={{ gap: 12 }}>
                {visible.map((fault) => (
                  <Pressable
                    key={fault.id}
                    accessibilityRole="link"
                    onPress={() => router.push(`/customer/faults/${fault.id}`)}
                  >
                    <Panel>
                      <View style={styles.cardTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.ref}>#{fault.reference}</Text>
                          <Text style={styles.category}>{CATEGORY_LABEL[fault.category]}</Text>
                          <Text style={styles.location}>{locationLine(fault.serviceLocation)}</Text>
                        </View>
                        <StatusPill status={fault.status} />
                      </View>
                      <View style={styles.cardBottom}>
                        <Text style={styles.meta}>{fmtDateTime(fault.reportedAt)}</Text>
                        <Text style={styles.meta}>
                          <Text style={{ color: colors.muted }}>Technician </Text>
                          {fault.technician?.name ?? '—'}
                        </Text>
                      </View>
                    </Panel>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
      </Async>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', borderWidth: 1, borderColor: colors.ink },
  filter: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center' },
  filterDivider: { borderLeftWidth: 1, borderLeftColor: colors.ink },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16 },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  ref: { fontFamily: fonts.mono, fontSize: 12, color: colors.ink },
  category: {
    marginTop: 4,
    fontFamily: fonts.black,
    fontSize: 18,
    textTransform: 'uppercase',
    color: colors.ink,
  },
  location: { marginTop: 4, fontFamily: fonts.regular, fontSize: 14, color: colors.ink },
  meta: { fontFamily: fonts.mono, fontSize: 12, color: colors.ink },
});
