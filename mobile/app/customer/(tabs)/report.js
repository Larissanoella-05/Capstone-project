import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button, Eyebrow, KeyRow, Panel } from '../../../src/components/Bits.js';
import { Screen } from '../../../src/components/Shell.js';
import { FormError } from '../../../src/components/States.js';
import { useAuth } from '../../../src/context/AuthContext.js';
import { useApi } from '../../../src/hooks/useApi.js';
import { api } from '../../../src/lib/api.js';
import { CATEGORIES, CATEGORY_LABEL, locationLine } from '../../../src/lib/format.js';
import { pickAndPreparePhoto } from '../../../src/lib/photo.js';
import { STEP_NAMES, validateStep } from '../../../src/lib/reportSteps.js';
import { colors, fonts, radius } from '../../../src/theme.js';

export default function ReportFault() {
  const { user } = useAuth();
  const router = useRouter();
  const locations = useApi('/service-locations');

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [contactPhone, setContactPhone] = useState(user.phone ?? '');
  const [photo, setPhoto] = useState(null); // { name, uri, dataUrl }
  const [photoBusy, setPhotoBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const location = locations.data?.serviceLocations?.[0];
  const form = { category, description, contactPhone, hasLocation: Boolean(location) };

  async function choosePhoto(source) {
    setPhotoBusy(true);
    try {
      const picked = await pickAndPreparePhoto(source);
      if (picked) {
        setPhoto(picked);
        setErrors((current) => ({ ...current, photo: undefined }));
      }
    } catch (error) {
      setErrors((current) => ({ ...current, photo: error.message }));
    } finally {
      setPhotoBusy(false);
    }
  }

  function goBack() {
    setErrors({});
    setFormError('');
    if (step === 1) router.navigate('/customer');
    else setStep(step - 1);
  }

  async function send() {
    const nextErrors = validateStep(3, form);
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) {
      setStep(nextErrors.category ? 1 : 2);
      return;
    }

    setSubmitting(true);
    try {
      const { fault } = await api('/faults', {
        method: 'POST',
        body: {
          category,
          description: description.trim(),
          contactPhone: contactPhone.trim(),
          serviceLocationId: location?.id,
          photo: photo?.dataUrl,
        },
      });
      router.replace(`/customer/submitted/${fault.id}`);
      // Tab screens stay mounted, so the next visit would show this report and a disabled button.
      setStep(1);
      setCategory('');
      setDescription('');
      setPhoto(null);
      setErrors({});
      setSubmitting(false);
    } catch (error) {
      setFormError(error.message);
      setSubmitting(false);
    }
  }

  function onContinue() {
    if (step === 3) {
      send();
      return;
    }
    const nextErrors = validateStep(step, form);
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length === 0) setStep(step + 1);
  }

  const footer = (
    <Button
      label={step === 3 ? (submitting ? 'Sending…' : 'Send report') : 'Continue'}
      onPress={onContinue}
      disabled={submitting || photoBusy || (step > 1 && !location)}
      style={{ minHeight: 54 }}
    />
  );

  return (
    <Screen footer={footer}>
      <View style={styles.headRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={step === 1 ? 'Back to home' : 'Back to the previous step'}
          onPress={goBack}
          style={styles.back}
        >
          <Feather name="chevron-left" size={22} color={colors.ink} />
        </Pressable>
        <View>
          <Text accessibilityRole="header" style={styles.title}>
            Report a fault
          </Text>
          <Text style={styles.stepNote}>
            Step {step} of {STEP_NAMES.length} · {STEP_NAMES[step - 1]}
          </Text>
        </View>
      </View>

      <View accessibilityElementsHidden style={styles.segments}>
        {STEP_NAMES.map((name, index) => (
          <View
            key={name}
            style={[styles.segment, index < step && { backgroundColor: colors.accent }]}
          />
        ))}
      </View>

      {step === 1 ? (
        <View style={{ gap: 12 }}>
          <Text style={styles.question}>What is the problem?</Text>
          <View accessibilityRole="radiogroup" style={{ gap: 10 }}>
            {CATEGORIES.map((item) => {
              const active = category === item.value;
              return (
                <Pressable
                  key={item.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    setCategory(item.value);
                    setErrors((current) => ({ ...current, category: undefined }));
                  }}
                  style={[styles.option, active && styles.optionActive]}
                >
                  <View style={[styles.radio, active && { borderColor: colors.accent }]}>
                    {active ? <View style={styles.radioDot} /> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionLabel}>{item.label}</Text>
                    <Text style={styles.optionHint}>{item.hint}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          {errors.category ? <Text style={styles.error}>{errors.category}</Text> : null}
        </View>
      ) : null}

      {step === 2 ? (
        <>
          <Panel style={styles.locationCard}>
            {locations.loading ? (
              <Eyebrow>Loading your service location…</Eyebrow>
            ) : location ? (
              <>
                <View style={styles.locationTop}>
                  <Eyebrow>Registered location · Meter {location.meterNumber}</Eyebrow>
                  <Text style={styles.auto}>Auto</Text>
                </View>
                <Text style={styles.locationLine}>{locationLine(location)}</Text>
                <Text style={styles.locationNote}>
                  Your registered service location is added to this report automatically.
                </Text>
              </>
            ) : (
              <Text style={[styles.error, { fontSize: 14 }]}>
                {locations.error?.message ||
                  'No registered service location was found for your account.'}
              </Text>
            )}
          </Panel>

          <View style={{ gap: 8 }}>
            <View style={styles.labelRow}>
              <Eyebrow>What happened?</Eyebrow>
              <Eyebrow>Optional</Eyebrow>
            </View>
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholder="For example: electricity went off suddenly, the neighbours still have power."
              placeholderTextColor={colors.ash}
              accessibilityLabel="Description"
              style={[styles.field, styles.multiline, errors.description && styles.fieldInvalid]}
            />
            {errors.description ? <Text style={styles.error}>{errors.description}</Text> : null}
          </View>

          <View style={{ gap: 8 }}>
            <View style={styles.labelRow}>
              <Eyebrow>Photo</Eyebrow>
              <Eyebrow>Optional</Eyebrow>
            </View>
            {photo ? (
              <View style={styles.photoRow}>
                <Image
                  source={{ uri: photo.uri }}
                  accessibilityLabel="Selected fault photo"
                  style={styles.thumb}
                />
                <Text numberOfLines={1} style={styles.photoName}>
                  {photo.name}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove photo"
                  onPress={() => setPhoto(null)}
                  style={styles.remove}
                >
                  <Feather name="x" size={18} color={colors.ink} />
                </Pressable>
              </View>
            ) : photoBusy ? (
              <View style={styles.busy}>
                <ActivityIndicator color={colors.muted} />
                <Eyebrow>Preparing photo…</Eyebrow>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Button
                  label="Take photo"
                  tone="outline"
                  icon="camera"
                  onPress={() => choosePhoto('camera')}
                  style={styles.photoButton}
                />
                <Button
                  label="Choose photo"
                  tone="outline"
                  icon="image"
                  onPress={() => choosePhoto('library')}
                  style={styles.photoButton}
                />
              </View>
            )}
            {errors.photo ? <Text style={styles.error}>{errors.photo}</Text> : null}
          </View>

          <View style={{ gap: 8 }}>
            <Eyebrow>Contact phone</Eyebrow>
            <TextInput
              value={contactPhone}
              onChangeText={setContactPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              accessibilityLabel="Contact phone"
              style={[styles.field, errors.contactPhone && styles.fieldInvalid]}
            />
            {errors.contactPhone ? <Text style={styles.error}>{errors.contactPhone}</Text> : null}
          </View>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <Panel style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
            <KeyRow label="Type">{CATEGORY_LABEL[category]}</KeyRow>
            <KeyRow label="Location">
              {locationLine(location)} · Meter {location?.meterNumber}
            </KeyRow>
            <KeyRow label="Contact phone">{contactPhone.trim() || '—'}</KeyRow>
            <KeyRow label="Description" last={!photo}>
              {description.trim() || 'No description given.'}
            </KeyRow>
            {photo ? (
              <Image
                source={{ uri: photo.uri }}
                accessibilityLabel="Selected fault photo"
                style={styles.reviewPhoto}
              />
            ) : null}
          </Panel>

          <View style={styles.danger}>
            <Feather
              name="alert-triangle"
              size={18}
              color={colors.danger}
              style={{ marginTop: 2 }}
            />
            <Text style={styles.dangerText}>
              If you can see a fallen, sparking or exposed wire, stay away from it and call{' '}
              <Text style={{ fontFamily: fonts.bold }}>2727</Text> now. This report is for the pilot
              and is not an emergency line.
            </Text>
          </View>
        </>
      ) : null}

      <FormError>{formError}</FormError>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius,
    backgroundColor: colors.white,
  },
  title: { fontFamily: fonts.black, fontSize: 22, color: colors.ink },
  stepNote: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  segments: { flexDirection: 'row', gap: 6 },
  segment: { flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.line },
  question: { fontFamily: fonts.black, fontSize: 18, color: colors.ink },
  option: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius,
    backgroundColor: colors.white,
  },
  optionActive: { borderColor: colors.accent, backgroundColor: colors.tint },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.ash,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  optionLabel: { fontFamily: fonts.black, fontSize: 15, color: colors.ink },
  optionHint: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  field: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  multiline: { minHeight: 110 },
  fieldInvalid: { borderColor: colors.danger },
  error: { fontFamily: fonts.semibold, fontSize: 14, color: colors.danger },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius,
    backgroundColor: colors.white,
    padding: 8,
  },
  thumb: { width: 64, height: 64, borderRadius: radius },
  photoName: { flex: 1, fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  remove: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius,
  },
  busy: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius,
    backgroundColor: colors.white,
  },
  photoButton: { flex: 1, paddingHorizontal: 8, borderStyle: 'dashed' },
  locationCard: { padding: 16, gap: 4 },
  locationTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  auto: {
    overflow: 'hidden',
    borderRadius: radius,
    backgroundColor: colors.tint,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.accent,
  },
  locationLine: { fontFamily: fonts.black, fontSize: 16, color: colors.ink },
  locationNote: { marginTop: 4, fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  reviewPhoto: { width: 96, height: 96, marginVertical: 10, borderRadius: radius },
  danger: {
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius,
    backgroundColor: colors.white,
    padding: 16,
  },
  dangerText: { flex: 1, fontFamily: fonts.regular, fontSize: 13, color: colors.ink },
});
