import { useLocalSearchParams } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useToast } from '../../../src/context/ToastContext.js';
import { openLink } from '../../../src/lib/links.js';
import { Button, Cell, Eyebrow, Panel, PanelHead, Timeline } from '../../../src/components/Bits.js';
import MapView from '../../../src/components/MapView.js';
import { Screen } from '../../../src/components/Shell.js';
import { Async } from '../../../src/components/States.js';
import { useApi } from '../../../src/hooks/useApi.js';
import {
  CATEGORY_LABEL,
  CUSTOMER_HEADLINE,
  OUTCOME_LABEL,
  STATUS_LABEL,
  firstNames,
  fmtDateTime,
  fmtKm,
  locationLine,
  timeAgo,
} from '../../../src/lib/format.js';
import { faultMapParts } from '../../../src/lib/mapParts.js';
import { colors, fonts } from '../../../src/theme.js';

export default function Tracking() {
  const { id } = useLocalSearchParams();
  const toast = useToast();
  // Polling keeps the status, the technician position and the timeline current.
  const state = useApi(`/faults/${id}`, { interval: 4000 });

  return (
    <Screen>
      <Async state={state} label="Loading fault">
        {({ fault }) => {
          const { markers, lines } = faultMapParts(fault);
          const technician = fault.technician;
          const approaching = fault.status === 'ON_THE_WAY' || fault.status === 'ASSIGNED';
          const onSite = fault.status === 'ARRIVED' || fault.status === 'WORKING';
          const canCall = technician?.phone && fault.status !== 'RESOLVED' && fault.status !== 'CANCELLED';
          return (
            <>
              <View style={styles.hero}>
                <Eyebrow style={{ color: colors.muted }}>
                  Fault #{fault.reference} · {CATEGORY_LABEL[fault.category]}
                </Eyebrow>
                <Text accessibilityRole="header" style={styles.title}>{CUSTOMER_HEADLINE[fault.status]}</Text>
              </View>

              <Panel>
                <MapView markers={markers} lines={lines} height={260} />
                <View style={styles.cells}>
                  <Cell label="Technician" style={styles.half}>{technician?.name ?? 'Not assigned yet'}</Cell>
                  <Cell label="Status" style={[styles.half, styles.leftRule]}>{STATUS_LABEL[fault.status]}</Cell>
                  <Cell label="Distance" style={[styles.half, styles.topRule]}>
                    {approaching ? fmtKm(technician?.distanceKm) : onSite ? 'On site' : '—'}
                  </Cell>
                  <Cell label="Last updated" style={[styles.half, styles.leftRule, styles.topRule]}>{timeAgo(fault.updatedAt)}</Cell>
                </View>
                {canCall ? (
                  <View style={styles.callRow}>
                    <Button
                      label={`Call ${firstNames(technician.name)}`}
                      tone="outline"
                      icon="phone"
                      onPress={async () => {
                        if (!(await openLink(`tel:${technician.phone.replace(/\s/g, '')}`))) toast('This phone cannot make calls.', 'error');
                      }}
                    />
                  </View>
                ) : null}
              </Panel>

              <Panel>
                <PanelHead>Response timeline</PanelHead>
                <Timeline fault={fault} audience="customer" />
              </Panel>

              {fault.status === 'RESOLVED' ? (
                <Panel>
                  <PanelHead style={{ backgroundColor: colors.ok }}>Resolution</PanelHead>
                  <View style={styles.body}>
                    <Text style={styles.outcome}>{OUTCOME_LABEL[fault.outcome] ?? 'Resolved'}</Text>
                    <Text style={styles.text}>{fault.resolutionNote}</Text>
                    <Text style={styles.completed}>Completed {fmtDateTime(fault.resolvedAt)}</Text>
                  </View>
                </Panel>
              ) : null}

              <Panel>
                <PanelHead>Your report</PanelHead>
                <View style={styles.body}>
                  <View>
                    <Eyebrow style={{ color: colors.muted }}>Service location</Eyebrow>
                    <Text style={styles.value}>
                      {locationLine(fault.serviceLocation)} · Meter {fault.serviceLocation.meterNumber}
                    </Text>
                  </View>
                  <View>
                    <Eyebrow style={{ color: colors.muted }}>Reported</Eyebrow>
                    <Text style={styles.value}>{fmtDateTime(fault.reportedAt)}</Text>
                  </View>
                  <View>
                    <Eyebrow style={{ color: colors.muted }}>Description</Eyebrow>
                    <Text style={styles.text}>{fault.description || 'No description given.'}</Text>
                  </View>
                  {fault.photo ? (
                    <Image source={{ uri: fault.photo }} accessibilityLabel="Photo attached to the report" resizeMode="cover" style={styles.photo} />
                  ) : null}
                </View>
              </Panel>
            </>
          );
        }}
      </Async>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderBottomWidth: 1, borderBottomColor: colors.ink, paddingBottom: 16 },
  title: { marginTop: 8, fontFamily: fonts.black, fontSize: 30, lineHeight: 30, letterSpacing: -0.6, textTransform: 'uppercase', color: colors.ink },
  cells: { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderTopColor: colors.ink },
  half: { width: '50%' },
  leftRule: { borderLeftWidth: 1, borderLeftColor: colors.ink },
  topRule: { borderTopWidth: 1, borderTopColor: colors.ink },
  callRow: { borderTopWidth: 1, borderTopColor: colors.ink, padding: 12 },
  body: { padding: 16, gap: 12 },
  outcome: { fontFamily: fonts.black, fontSize: 16, textTransform: 'uppercase', color: colors.ink },
  text: { marginTop: 4, fontFamily: fonts.regular, fontSize: 14, color: colors.ink },
  completed: { fontFamily: fonts.mono, fontSize: 12, color: colors.muted },
  value: { marginTop: 4, fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  photo: { width: '100%', height: 240, borderWidth: 1, borderColor: colors.line },
});
