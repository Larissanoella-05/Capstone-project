import { useT } from '../../../src/context/LanguageContext.js';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Chip, FaultIcon, PageHeading, Panel } from '../../../src/components/Bits.js';
import { StatusPill } from '../../../src/components/Pills.js';
import { Screen } from '../../../src/components/Shell.js';
import { Async, EmptyState } from '../../../src/components/States.js';
import { useApi } from '../../../src/hooks/useApi.js';
import { CATEGORY_LABEL, fmtDateTime, isOpen, locationLine } from '../../../src/lib/format.js';
import { colors, fonts } from '../../../src/theme.js';

const FILTERS = [
  { key: 'ALL', label: 'All', test: () => true },
  { key: 'OPEN', label: 'Open', test: isOpen },
  { key: 'CLOSED', label: 'Resolved', test: (fault) => !isOpen(fault) },
];

export default function Reports() {
  const t = useT();
  const router = useRouter();
  const state = useApi('/faults', { interval: 5000 });
  const [filter, setFilter] = useState('ALL');
  const faults = state.data?.faults ?? [];
  const visible = faults.filter(FILTERS.find((item) => item.key === filter).test);

  return (
    <Screen>
      <PageHeading
        eyebrow={
          state.data
            ? t(faults.length === 1 ? '{count} report' : '{count} reports', {
                count: faults.length,
              })
            : 'History'
        }
        title="My reports"
      />

      <Async state={state} label="Loading your reports">
        {() => (
          <>
            <View accessibilityRole="radiogroup" style={styles.filters}>
              {FILTERS.map((item) => (
                <Chip
                  key={item.key}
                  label={`${t(item.label)} ${faults.filter(item.test).length}`}
                  active={filter === item.key}
                  onPress={() => setFilter(item.key)}
                />
              ))}
            </View>

            {visible.length === 0 ? (
              <EmptyState
                title={faults.length ? t('Nothing in this list') : t('No reports yet')}
                action={
                  <Button
                    label="Report a fault"
                    onPress={() => router.navigate('/customer/report')}
                  />
                }
              >
                {faults.length
                  ? t('Choose another filter to see your other reports.')
                  : t('When you report a fault it is listed here.')}
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
                        <FaultIcon category={fault.category} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.category}>{t(CATEGORY_LABEL[fault.category])}</Text>
                          <Text style={styles.ref}>
                            #{fault.reference} · {locationLine(fault.serviceLocation)}
                          </Text>
                        </View>
                        <StatusPill status={fault.status} />
                      </View>
                      <View style={styles.cardBottom}>
                        <Text style={styles.meta}>{fmtDateTime(fault.reportedAt, t)}</Text>
                        <Text style={styles.meta}>
                          <Text style={{ color: colors.muted }}>{t('Technician')} </Text>
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
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  ref: { marginTop: 2, fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  category: { fontFamily: fonts.black, fontSize: 16, color: colors.ink },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.ink },
});
