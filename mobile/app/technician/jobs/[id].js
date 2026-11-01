import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Button, Eyebrow, Panel, PanelHead } from '../../../src/components/Bits.js';
import MapView from '../../../src/components/MapView.js';
import { PriorityPill, StatusPill } from '../../../src/components/Pills.js';
import { Screen } from '../../../src/components/Shell.js';
import { Async, FormError } from '../../../src/components/States.js';
import { useToast } from '../../../src/context/ToastContext.js';
import { useTracking } from '../../../src/context/TrackingContext.js';
import { openLink } from '../../../src/lib/links.js';
import { useApi } from '../../../src/hooks/useApi.js';
import { api } from '../../../src/lib/api.js';
import {
  CATEGORY_LABEL,
  OUTCOME_LABEL,
  STAGES,
  STATUS_LABEL,
  STATUS_TIME_FIELD,
  fmtDateTime,
  fmtKm,
  fmtTime,
  locationLine,
} from '../../../src/lib/format.js';
import { TRACKED_STATUSES } from '../../../src/lib/location.js';
import { faultMapParts } from '../../../src/lib/mapParts.js';
import { colors, fonts } from '../../../src/theme.js';

// What the main button does at each stage.
const NEXT_ACTION = {
  ASSIGNED: {
    status: 'ON_THE_WAY',
    label: 'Start Response: On the Way',
    done: 'Status updated: On the Way.',
  },
  ON_THE_WAY: { status: 'ARRIVED', label: 'Mark as Arrived', done: 'Status updated: Arrived.' },
  ARRIVED: { status: 'WORKING', label: 'Start Work', done: 'Status updated: Working.' },
};

export default function JobDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const toast = useToast();
  const { status: tracking } = useTracking();
  const state = useApi(`/faults/${id}`, { interval: 5000 });
  const [busy, setBusy] = useState(false);

  const open = async (url, failure) => {
    if (!(await openLink(url))) toast(failure, 'error');
  };
  const [actionError, setActionError] = useState('');

  async function advance(fault, next) {
    setBusy(true);
    setActionError('');
    try {
      await api(`/faults/${fault.id}/status`, { method: 'PATCH', body: { status: next.status } });
      await state.reload();
      toast(next.done);
    } catch (error) {
      setActionError(error.message);
      if (error.status === 409) state.reload(); // someone else changed it: show the real status
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Async state={state} label="Loading job">
        {({ fault }) => {
          const location = fault.serviceLocation;
          const { markers, lines } = faultMapParts(fault);
          const next = NEXT_ACTION[fault.status];
          const stageIndex = STAGES.indexOf(fault.status);
          const approaching = ['ASSIGNED', 'ON_THE_WAY'].includes(fault.status);
          const sharing = TRACKED_STATUSES.includes(fault.status);
          const customerPhone = fault.contactPhone || fault.customer.phone;

          return (
            <>
              <View style={styles.hero}>
                <Eyebrow style={{ color: colors.muted }}>
                  Fault #{fault.reference} · Reported {fmtTime(fault.reportedAt)}
                </Eyebrow>
                <Text accessibilityRole="header" style={styles.title}>
                  {CATEGORY_LABEL[fault.category]}
                </Text>
                <View style={styles.pills}>
                  <PriorityPill priority={fault.priority} withLabel />
                  <StatusPill status={fault.status} />
                </View>
              </View>

              <Panel>
                <MapView markers={markers} lines={lines} height={240} />
                <View style={styles.block}>
                  <Eyebrow style={{ color: colors.muted }}>Service location</Eyebrow>
                  <Text style={styles.location}>{locationLine(location)}</Text>
                  <Text style={styles.text}>
                    {[location.village && `${location.village} village`, location.landmark]
                      .filter(Boolean)
                      .join('. ')}
                  </Text>
                  <Text style={[styles.mono, { marginTop: 8 }]}>
                    {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                    {approaching && Number.isFinite(fault.technician?.distanceKm)
                      ? ` · ${fmtKm(fault.technician.distanceKm)} away`
                      : ''}
                  </Text>
                </View>
                <View style={styles.blockPadded}>
                  <Button
                    label="Navigate to Location"
                    tone="outline"
                    icon="navigation"
                    onPress={() =>
                      open(
                        `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`,
                        'No app can open directions.'
                      )
                    }
                  />
                </View>
              </Panel>

              <Panel>
                <PanelHead>Response status</PanelHead>
                {STAGES.slice(1).map((stage, index) => {
                  const step = index + 1;
                  const time = fault[STATUS_TIME_FIELD[stage]];
                  const done = step < stageIndex || fault.status === 'RESOLVED';
                  const active = step === stageIndex && fault.status !== 'RESOLVED';
                  return (
                    <View
                      key={stage}
                      accessible
                      accessibilityState={{ selected: active }}
                      style={[
                        styles.stage,
                        index > 0 && styles.stageDivider,
                        active && { backgroundColor: colors.volt },
                      ]}
                    >
                      <View
                        style={[
                          styles.box,
                          done && { backgroundColor: colors.ink, borderColor: colors.ink },
                          active && { borderColor: colors.ink, backgroundColor: colors.white },
                        ]}
                      >
                        {done ? <Feather name="check" size={14} color={colors.white} /> : null}
                        {active ? <View style={styles.core} /> : null}
                      </View>
                      <Text
                        style={[
                          styles.stageLabel,
                          done || active ? { fontFamily: fonts.bold } : { color: colors.muted },
                        ]}
                      >
                        {STATUS_LABEL[stage]}
                      </Text>
                      <Text style={styles.mono}>
                        {active ? `Now · ${fmtTime(time)}` : fmtTime(time)}
                      </Text>
                    </View>
                  );
                })}

                {next || fault.status === 'WORKING' ? (
                  <View style={styles.actions}>
                    <FormError>{actionError}</FormError>
                    {next ? (
                      <Button
                        label={busy ? 'Updating…' : next.label}
                        disabled={busy}
                        onPress={() => advance(fault, next)}
                        style={{ minHeight: 56 }}
                      />
                    ) : (
                      <Button
                        label="Record Resolution"
                        onPress={() => router.push(`/technician/jobs/${fault.id}/resolve`)}
                        style={{ minHeight: 56 }}
                      />
                    )}
                  </View>
                ) : null}
              </Panel>

              {sharing ? <TrackingNotice status={tracking} /> : null}

              {fault.status === 'RESOLVED' ? (
                <Panel>
                  <PanelHead style={{ backgroundColor: colors.ok }}>Resolution recorded</PanelHead>
                  <View style={styles.body}>
                    <Text style={styles.outcome}>{OUTCOME_LABEL[fault.outcome]}</Text>
                    <Text style={styles.text}>{fault.resolutionNote}</Text>
                    {fault.workCompleted ? (
                      <Text style={styles.text}>
                        <Text style={{ fontFamily: fonts.bold }}>Work completed: </Text>
                        {fault.workCompleted}
                      </Text>
                    ) : null}
                    <Text style={[styles.mono, { color: colors.muted }]}>
                      Completed {fmtDateTime(fault.resolvedAt)}
                    </Text>
                  </View>
                </Panel>
              ) : null}

              <Panel>
                <PanelHead>Description</PanelHead>
                <View style={styles.body}>
                  <Text style={styles.text}>
                    {fault.description || 'The customer did not add a description.'}
                  </Text>
                  {fault.photo ? (
                    <Image
                      source={{ uri: fault.photo }}
                      accessibilityLabel="Photo attached by the customer"
                      resizeMode="cover"
                      style={styles.photo}
                    />
                  ) : null}
                </View>
              </Panel>

              <Panel>
                <PanelHead>Customer</PanelHead>
                <View
                  style={[
                    styles.body,
                    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.customer}>{fault.customer.name}</Text>
                    <Text style={styles.mono}>Meter {location.meterNumber}</Text>
                  </View>
                  {customerPhone ? (
                    <Button
                      label="Call"
                      tone="outline"
                      icon="phone"
                      onPress={() =>
                        open(
                          `tel:${customerPhone.replace(/\s/g, '')}`,
                          'This phone cannot make calls.'
                        )
                      }
                      style={{ minHeight: 44 }}
                    />
                  ) : null}
                </View>
              </Panel>

              <Button
                label="Back to my jobs"
                tone="outline"
                onPress={() => router.navigate('/technician/jobs')}
              />
            </>
          );
        }}
      </Async>
    </Screen>
  );
}

const TRACKING_NOTICE = {
  starting: ['loader', 'Starting location sharing…', false],
  sharing: ['map-pin', 'Sharing your location with the customer while this app is open.', false],
  denied: [
    'alert-triangle',
    'Location is off, so the customer cannot see you. Allow location for Umuriro in Settings.',
    true,
  ],
  error: ['alert-triangle', 'Could not read your location. Check that GPS is on.', true],
  idle: [
    'pause-circle',
    'Location sharing is paused. Keep this app open to share your position.',
    false,
  ],
};

/** Says what the tracker is really doing, including when permission was refused or GPS is off. */
function TrackingNotice({ status }) {
  const [icon, message, problem] = TRACKING_NOTICE[status] ?? TRACKING_NOTICE.idle;
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.sharing, problem && styles.sharingProblem]}
    >
      <Feather name={icon} size={18} color={problem ? colors.danger : colors.ink} />
      <Text style={[styles.sharingText, problem && { color: colors.danger }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sharingProblem: { backgroundColor: colors.white, borderColor: colors.danger },
  hero: { borderBottomWidth: 1, borderBottomColor: colors.ink, paddingBottom: 16 },
  title: {
    marginTop: 8,
    fontFamily: fonts.black,
    fontSize: 30,
    lineHeight: 30,
    letterSpacing: -0.6,
    textTransform: 'uppercase',
    color: colors.ink,
  },
  pills: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  block: { borderTopWidth: 1, borderTopColor: colors.ink, padding: 16 },
  blockPadded: { borderTopWidth: 1, borderTopColor: colors.ink, padding: 12 },
  location: {
    marginTop: 4,
    fontFamily: fonts.black,
    fontSize: 18,
    textTransform: 'uppercase',
    color: colors.ink,
  },
  text: { marginTop: 4, fontFamily: fonts.regular, fontSize: 14, color: colors.ink },
  mono: { fontFamily: fonts.mono, fontSize: 12, color: colors.ink },
  stage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  stageDivider: { borderTopWidth: 1, borderTopColor: colors.line },
  box: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  core: { width: 8, height: 8, backgroundColor: colors.ink },
  stageLabel: { flex: 1, fontFamily: fonts.regular, fontSize: 14, color: colors.ink },
  actions: { gap: 12, borderTopWidth: 1, borderTopColor: colors.ink, padding: 12 },
  sharing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.ink,
    backgroundColor: colors.voltSoft,
    padding: 12,
  },
  sharingText: { flex: 1, fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  body: { padding: 16, gap: 8 },
  outcome: { fontFamily: fonts.black, fontSize: 16, textTransform: 'uppercase', color: colors.ink },
  photo: { width: '100%', height: 240, borderWidth: 1, borderColor: colors.line },
  customer: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
});
