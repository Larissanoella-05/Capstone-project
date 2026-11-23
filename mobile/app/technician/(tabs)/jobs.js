import { useT } from '../../../src/context/LanguageContext.js';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Chip, FaultIcon, PageHeading, Panel } from '../../../src/components/Bits.js';
import { PriorityPill, StatusPill } from '../../../src/components/Pills.js';
import { Screen } from '../../../src/components/Shell.js';
import { Async, EmptyState } from '../../../src/components/States.js';
import { useApi } from '../../../src/hooks/useApi.js';
import { CATEGORY_LABEL, fmtDateTime, isOpen, locationLine } from '../../../src/lib/format.js';
import { colors, fonts } from '../../../src/theme.js';

const FILTERS = [
  { key: 'ALL', label: 'All', test: () => true },
  { key: 'OPEN', label: 'Open', test: isOpen },
  { key: 'DONE', label: 'Done', test: (fault) => !isOpen(fault) },
];

export default function Jobs() {
  const t = useT();
  const router = useRouter();
  const state = useApi('/faults', { interval: 5000 });
  const [tab, setTab] = useState('OPEN');

  const faults = state.data?.faults ?? [];
  const visible = faults.filter(FILTERS.find((item) => item.key === tab).test);

  return (
    <Screen>
      <PageHeading
        eyebrow={state.data ? t('{count} jobs in total', { count: faults.length }) : 'Jobs'}
        title="My jobs"
      />

      <Async state={state} label="Loading your jobs">
        {() => (
          <>
            <View accessibilityRole="radiogroup" style={styles.filters}>
              {FILTERS.map((item) => (
                <Chip
                  key={item.key}
                  label={`${t(item.label)} ${faults.filter(item.test).length}`}
                  active={tab === item.key}
                  onPress={() => setTab(item.key)}
                />
              ))}
            </View>

            {visible.length === 0 ? (
              <EmptyState title={tab === 'DONE' ? t('No completed jobs yet') : t('No jobs here')}>
                {tab === 'DONE'
                  ? t('Jobs you resolve are kept here.')
                  : t('New jobs assigned by the service coordinator appear here automatically.')}
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
                        <FaultIcon category={fault.category} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.title}>{t(CATEGORY_LABEL[fault.category])}</Text>
                          <Text numberOfLines={1} style={styles.ref}>
                            #{fault.reference} · {locationLine(fault.serviceLocation)}
                          </Text>
                        </View>
                        <StatusPill status={fault.status} />
                      </View>
                      <View style={styles.bottom}>
                        <PriorityPill priority={fault.priority} withLabel />
                        <Text style={styles.ref}>
                          {isOpen(fault)
                            ? t('Reported {when}', { when: fmtDateTime(fault.reportedAt, t) })
                            : t('Closed {when}', {
                                when: fmtDateTime(fault.resolvedAt ?? fault.cancelledAt, t),
                              })}
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
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  ref: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  title: { fontFamily: fonts.black, fontSize: 16, color: colors.ink },
});
