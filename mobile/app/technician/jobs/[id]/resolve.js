import { Feather } from '@expo/vector-icons';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, Eyebrow, KeyRow, Panel } from '../../../../src/components/Bits.js';
import { Screen } from '../../../../src/components/Shell.js';
import { Async, FormError } from '../../../../src/components/States.js';
import { useToast } from '../../../../src/context/ToastContext.js';
import { useApi } from '../../../../src/hooks/useApi.js';
import { api } from '../../../../src/lib/api.js';
import { CATEGORY_LABEL, OUTCOMES, fmtTime, locationLine } from '../../../../src/lib/format.js';
import { colors, fonts } from '../../../../src/theme.js';

export default function ResolveJob() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const toast = useToast();
  const state = useApi(`/faults/${id}`);

  const [outcome, setOutcome] = useState('SUPPLY_RESTORED');
  const [resolutionNote, setResolutionNote] = useState('');
  const [workCompleted, setWorkCompleted] = useState('');
  const [contacts, setContacts] = useState(0);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // This one screen is reused for every job id (tab screens stay mounted), so start clean for each job.
  useEffect(() => {
    setOutcome('SUPPLY_RESTORED');
    setResolutionNote('');
    setWorkCompleted('');
    setContacts(0);
    setErrors({});
    setFormError('');
    setSubmitting(false);
  }, [id]);

  async function onSubmit() {
    const nextErrors = {};
    if (resolutionNote.trim().length < 5) nextErrors.resolutionNote = 'Describe how the fault was resolved.';
    if (!workCompleted.trim()) nextErrors.workCompleted = 'List the work that was completed.';
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      await api(`/faults/${id}/status`, {
        method: 'PATCH',
        body: {
          status: 'RESOLVED',
          outcome,
          resolutionNote: resolutionNote.trim(),
          workCompleted: workCompleted.trim(),
          clarificationContacts: contacts,
        },
      });
      toast('Fault marked as resolved. The customer has been notified.');
      router.replace(`/technician/jobs/${id}`);
    } catch (error) {
      setFormError(error.message);
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <Async state={state} label="Loading job">
        {({ fault }) => {
          // The resolution form only makes sense once work has started (and not again after it is saved).
          if (fault.status !== 'WORKING') return <Redirect href={`/technician/jobs/${fault.id}`} />;
          return (
            <>
              <Pressable accessibilityRole="link" onPress={() => router.back()} style={styles.back}>
                <Feather name="arrow-left" size={14} color={colors.ink} />
                <Eyebrow>Job details</Eyebrow>
              </Pressable>

              <View style={styles.hero}>
                <Eyebrow style={{ color: colors.muted }}>Fault #{fault.reference}</Eyebrow>
                <Text accessibilityRole="header" style={styles.title}>Record resolution</Text>
              </View>

              <Panel style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
                <KeyRow label="Fault ID" mono>{fault.reference}</KeyRow>
                <KeyRow label="Category">{CATEGORY_LABEL[fault.category]}</KeyRow>
                <KeyRow label="Location">{locationLine(fault.serviceLocation)}</KeyRow>
                <KeyRow label="Arrival">{fmtTime(fault.arrivedAt)}</KeyRow>
                <KeyRow label="Completed" last>{fmtTime(new Date())} (now)</KeyRow>
              </Panel>

              <View style={{ gap: 8 }}>
                <Eyebrow>Outcome</Eyebrow>
                <View accessibilityRole="radiogroup" style={styles.group}>
                  {OUTCOMES.map((item, index) => {
                    const selected = outcome === item.value;
                    return (
                      <Pressable
                        key={item.value}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        onPress={() => setOutcome(item.value)}
                        style={[styles.option, index < OUTCOMES.length - 1 && styles.optionDivider, { backgroundColor: selected ? colors.volt : colors.white }]}
                      >
                        <View style={styles.radio}>{selected ? <View style={styles.radioDot} /> : null}</View>
                        <Text style={styles.optionLabel}>{item.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={{ gap: 8 }}>
                <Eyebrow>Resolution description</Eyebrow>
                <TextInput
                  value={resolutionNote}
                  onChangeText={(value) => {
                    setResolutionNote(value);
                    setErrors((current) => ({ ...current, resolutionNote: undefined }));
                  }}
                  multiline
                  textAlignVertical="top"
                  placeholder="What was wrong and how it was fixed."
                  placeholderTextColor={colors.ash}
                  accessibilityLabel="Resolution description"
                  style={[styles.field, errors.resolutionNote && styles.fieldInvalid]}
                />
                {errors.resolutionNote ? (
                  <Text style={styles.error}>{errors.resolutionNote}</Text>
                ) : (
                  <Text style={styles.hint}>An outcome note is required before a fault can be resolved.</Text>
                )}
              </View>

              <View style={{ gap: 8 }}>
                <Eyebrow>Work completed</Eyebrow>
                <TextInput
                  value={workCompleted}
                  onChangeText={(value) => {
                    setWorkCompleted(value);
                    setErrors((current) => ({ ...current, workCompleted: undefined }));
                  }}
                  multiline
                  textAlignVertical="top"
                  placeholder="For example: replaced service fuse, tightened terminals, tested supply at the meter."
                  placeholderTextColor={colors.ash}
                  accessibilityLabel="Work completed"
                  style={[styles.field, errors.workCompleted && styles.fieldInvalid]}
                />
                {errors.workCompleted ? <Text style={styles.error}>{errors.workCompleted}</Text> : null}
              </View>

              <View style={{ gap: 8 }}>
                <Eyebrow>Clarification contacts</Eyebrow>
                <View style={styles.stepper}>
                  <Pressable accessibilityRole="button" accessibilityLabel="One fewer" onPress={() => setContacts((n) => Math.max(0, n - 1))} style={[styles.step, { borderRightWidth: 1 }]}>
                    <Text style={styles.stepText}>−</Text>
                  </Pressable>
                  <Text accessibilityLabel={`${contacts} contacts`} style={styles.count}>{contacts}</Text>
                  <Pressable accessibilityRole="button" accessibilityLabel="One more" onPress={() => setContacts((n) => Math.min(50, n + 1))} style={[styles.step, { borderLeftWidth: 1 }]}>
                    <Text style={styles.stepText}>+</Text>
                  </Pressable>
                </View>
                <Text style={styles.hint}>How many times you had to call or message the customer to find the location.</Text>
              </View>

              <FormError>{formError}</FormError>

              <Button label={submitting ? 'Saving…' : 'Mark as Resolved'} disabled={submitting} onPress={onSubmit} style={{ minHeight: 56 }} />
              <Text style={styles.hint}>The customer will be notified and the fault closed. Status times cannot be edited afterwards.</Text>
            </>
          );
        }}
      </Async>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', minHeight: 36 },
  hero: { borderBottomWidth: 1, borderBottomColor: colors.ink, paddingBottom: 16 },
  title: { marginTop: 8, fontFamily: fonts.black, fontSize: 30, lineHeight: 30, letterSpacing: -0.6, textTransform: 'uppercase', color: colors.ink },
  group: { borderWidth: 1, borderColor: colors.ink },
  option: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 10 },
  optionDivider: { borderBottomWidth: 1, borderBottomColor: colors.ink },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.ink },
  optionLabel: { flex: 1, fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  field: { minHeight: 96, borderWidth: 1, borderColor: colors.ink, paddingHorizontal: 12, paddingVertical: 10, fontFamily: fonts.regular, fontSize: 16, color: colors.ink, backgroundColor: colors.white },
  fieldInvalid: { borderColor: colors.danger },
  error: { fontFamily: fonts.semibold, fontSize: 14, color: colors.danger },
  hint: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  stepper: { flexDirection: 'row', borderWidth: 1, borderColor: colors.ink },
  step: { width: 56, height: 48, alignItems: 'center', justifyContent: 'center', borderColor: colors.ink, backgroundColor: colors.white },
  stepText: { fontFamily: fonts.black, fontSize: 20, color: colors.ink },
  count: { flex: 1, textAlign: 'center', textAlignVertical: 'center', fontFamily: fonts.monoMedium, fontSize: 18, lineHeight: 48, color: colors.ink },
});
