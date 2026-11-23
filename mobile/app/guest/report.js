import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button, Eyebrow, Panel } from '../../src/components/Bits.js';
import MapView from '../../src/components/MapView.js';
import { Screen } from '../../src/components/Shell.js';
import { FormError } from '../../src/components/States.js';
import { useT } from '../../src/context/LanguageContext.js';

import { useFindMe } from '../../src/hooks/useFindMe.js';
import { api } from '../../src/lib/api.js';
import { CATEGORIES } from '../../src/lib/format.js';
import { accuracyText, buildGuestPayload, validateGuestForm } from '../../src/lib/guestReport.js';
import { loadSavedReports, saveReport } from '../../src/lib/guestStore.js';
import { pickAndPreparePhoto } from '../../src/lib/photo.js';
import { colors, fonts, radius } from '../../src/theme.js';

// The free Render server sleeps when idle and takes up to a minute to wake.
const SLOW_AFTER_MS = 5000;

function Label({ children, optional }) {
  const t = useT();
  return (
    <View style={styles.labelRow}>
      <Eyebrow>{children}</Eyebrow>
      {optional ? <Eyebrow>{t('Optional')}</Eyebrow> : null}
    </View>
  );
}

export default function GuestReport() {
  const router = useRouter();
  const t = useT();

  const [category, setCategory] = useState('');
  const [placeText, setPlaceText] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [claimedMeter, setClaimedMeter] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null); // { name, uri, dataUrl }
  const [photoBusy, setPhotoBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [slow, setSlow] = useState(false);
  const [saved, setSaved] = useState([]);

  const clearError = useCallback(
    (key) => setErrors((current) => ({ ...current, [key]: undefined })),
    []
  );
  const clearLocationError = useCallback(() => clearError('location'), [clearError]);
  const { point, locating, note: locationNote, findMe } = useFindMe(clearLocationError);

  const markers = useMemo(
    () =>
      point
        ? [{ id: 'reported-point', lat: point.latitude, lng: point.longitude, kind: 'unassigned' }]
        : [],
    [point]
  );

  useEffect(() => {
    loadSavedReports().then(setSaved);
  }, []);

  useEffect(() => {
    if (!submitting) {
      setSlow(false);
      return undefined;
    }
    const timer = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, [submitting]);

  async function choosePhoto(source) {
    setPhotoBusy(true);
    try {
      const picked = await pickAndPreparePhoto(source);
      if (picked) {
        setPhoto(picked);
        clearError('photo');
      }
    } catch (error) {
      setErrors((current) => ({ ...current, photo: t(error.message) }));
    } finally {
      setPhotoBusy(false);
    }
  }

  async function send() {
    const form = { category, contactPhone, point, placeText, claimedMeter, description, photo };
    const nextErrors = Object.fromEntries(
      Object.entries(validateGuestForm(form)).map(([key, message]) => [key, t(message)])
    );
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const { fault } = await api('/public/faults', {
        method: 'POST',
        body: buildGuestPayload(form),
      });
      await saveReport({ token: fault.trackingToken, reference: fault.reference });
      router.replace({
        pathname: '/guest/sent/[token]',
        params: { token: fault.trackingToken, reference: fault.reference },
      });
    } catch (error) {
      setFormError(
        `${t('Your report was not sent. What you typed is still here.')} ${error.message}`
      );
      setSubmitting(false);
    }
  }

  const footer = (
    <View style={{ gap: 8 }}>
      <Button
        label={submitting ? t('Sending…') : t('Send report')}
        onPress={send}
        disabled={submitting || photoBusy}
        style={{ minHeight: 54 }}
      />
      {slow ? (
        <Text accessibilityLiveRegion="polite" style={styles.hint}>
          {t('Waking the server, this can take up to a minute…')}
        </Text>
      ) : null}
    </View>
  );

  return (
    <Screen footer={footer} insetBottom>
      <View>
        <Text accessibilityRole="header" style={styles.title}>
          {t('Report a fault')}
        </Text>
        <Text style={styles.hint}>{t('No account needed. It takes about a minute.')}</Text>
      </View>

      <View style={styles.danger}>
        <Feather name="alert-triangle" size={18} color={colors.danger} style={{ marginTop: 2 }} />
        <Text style={styles.dangerText}>
          {t('If you can see a fallen, sparking or exposed wire, stay away from it and call')}{' '}
          <Text style={{ fontFamily: fonts.bold }}>2727</Text>{' '}
          {t('now. This report is for the pilot and is not an emergency line.')}
        </Text>
      </View>

      <View style={{ gap: 12 }}>
        <Text style={styles.question}>{t('What is the problem?')}</Text>
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
                  clearError('category');
                }}
                style={[styles.option, active && styles.optionActive]}
              >
                <View style={[styles.radio, active && { borderColor: colors.accent }]}>
                  {active ? <View style={styles.radioDot} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionLabel}>{t(item.label)}</Text>
                  <Text style={styles.optionHint}>{t(item.hint)}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        {errors.category ? <Text style={styles.error}>{errors.category}</Text> : null}
      </View>

      <Panel style={styles.where}>
        <View style={styles.whereHead}>
          <Feather name="map-pin" size={18} color={colors.accent} />
          <Text style={styles.whereTitle}>{t('Where is the fault?')}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: locating }}
          disabled={locating}
          onPress={findMe}
          style={({ pressed }) => [styles.locate, (locating || pressed) && { opacity: 0.75 }]}
        >
          <Feather name="crosshair" size={18} color={colors.onAccent} />
          <Text style={styles.locateText}>
            {locating
              ? t('Finding your location…')
              : point
                ? t('Update my location')
                : t('Use my location')}
          </Text>
        </Pressable>
        {point ? (
          <View accessibilityLiveRegion="polite" style={{ gap: 2 }}>
            <Text style={styles.found}>{t('Location found')}</Text>
            <Text style={styles.hint}>{accuracyText(point.accuracyM, t)}</Text>
            <Text style={styles.hint}>
              {t('If the fault is somewhere else, describe where below.')}
            </Text>
          </View>
        ) : null}
        {locationNote ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {t(locationNote)}
          </Text>
        ) : null}
        {point ? (
          <MapView
            markers={markers}
            interactive={false}
            height={160}
            label={t('Map showing the location your phone found')}
          />
        ) : null}
        <View style={{ gap: 8 }}>
          <Label optional={Boolean(point)}>{t('Describe the place')}</Label>
          <TextInput
            value={placeText}
            onChangeText={(text) => {
              setPlaceText(text);
              clearError('location');
            }}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
            placeholder={t('For example: near the blue gate, Kibenga cell')}
            placeholderTextColor={colors.ash}
            accessibilityLabel={t('Describe the place')}
            style={[styles.field, styles.placeField, errors.location && styles.fieldInvalid]}
          />
          {errors.location ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {errors.location}
            </Text>
          ) : (
            <Text style={styles.hint}>{t('Village, cell, a landmark, or the house number.')}</Text>
          )}
        </View>
      </Panel>

      <View style={{ gap: 8 }}>
        <Label>{t('Your phone number')}</Label>
        <TextInput
          value={contactPhone}
          onChangeText={(text) => {
            setContactPhone(text);
            clearError('contactPhone');
          }}
          keyboardType="phone-pad"
          autoComplete="tel"
          placeholder="078 123 4567"
          placeholderTextColor={colors.ash}
          accessibilityLabel={t('Your phone number')}
          style={[styles.field, errors.contactPhone && styles.fieldInvalid]}
        />
        {errors.contactPhone ? (
          <Text style={styles.error}>{errors.contactPhone}</Text>
        ) : (
          <Text style={styles.hint}>
            {t(
              'We use it to text you updates about this fault only, and so the technician can call you.'
            )}
          </Text>
        )}
      </View>

      <View style={{ gap: 8 }}>
        <Label optional>{t('What happened?')}</Label>
        <TextInput
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholder={t('Describe the problem')}
          placeholderTextColor={colors.ash}
          accessibilityLabel={t('What happened?')}
          style={[styles.field, styles.multiline, errors.description && styles.fieldInvalid]}
        />
        {errors.description ? <Text style={styles.error}>{errors.description}</Text> : null}
      </View>

      <View style={{ gap: 8 }}>
        <Label optional>{t('Meter number')}</Label>
        <TextInput
          value={claimedMeter}
          onChangeText={(text) => {
            setClaimedMeter(text);
            clearError('claimedMeter');
          }}
          keyboardType="number-pad"
          autoComplete="off"
          accessibilityLabel={t('Meter number')}
          style={[styles.field, errors.claimedMeter && styles.fieldInvalid]}
        />
        {errors.claimedMeter ? (
          <Text style={styles.error}>{errors.claimedMeter}</Text>
        ) : (
          <Text style={styles.hint}>
            {t(
              'Printed on your meter and on your token receipt. It helps us match your report; it is not checked.'
            )}
          </Text>
        )}
      </View>

      <View style={{ gap: 8 }}>
        <Label optional>{t('Photo')}</Label>
        {photo ? (
          <View style={styles.photoRow}>
            <Image
              source={{ uri: photo.uri }}
              accessibilityLabel={t('Selected fault photo')}
              style={styles.thumb}
            />
            <Text numberOfLines={1} style={styles.photoName}>
              {photo.name}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Remove photo')}
              onPress={() => setPhoto(null)}
              style={styles.remove}
            >
              <Feather name="x" size={18} color={colors.ink} />
            </Pressable>
          </View>
        ) : photoBusy ? (
          <View style={styles.busy}>
            <ActivityIndicator color={colors.muted} />
            <Eyebrow>{t('Preparing photo…')}</Eyebrow>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button
              label={t('Take photo')}
              tone="outline"
              icon="camera"
              onPress={() => choosePhoto('camera')}
              style={styles.photoButton}
            />
            <Button
              label={t('Choose photo')}
              tone="outline"
              icon="image"
              onPress={() => choosePhoto('library')}
              style={styles.photoButton}
            />
          </View>
        )}
        {errors.photo ? <Text style={styles.error}>{errors.photo}</Text> : null}
      </View>

      <FormError>{formError}</FormError>

      {saved.length > 0 ? (
        <View style={{ gap: 8 }}>
          <Text style={styles.savedTitle}>{t('Reports from this phone')}</Text>
          <Panel>
            {saved.map((item, index) => (
              <Pressable
                key={item.token}
                accessibilityRole="link"
                accessibilityLabel={t('Track report {reference}', { reference: item.reference })}
                onPress={() =>
                  router.push({ pathname: '/guest/track/[token]', params: { token: item.token } })
                }
                style={[styles.savedRow, index > 0 && styles.savedRule]}
              >
                <Text style={styles.savedRef}>#{item.reference}</Text>
                <Text style={styles.savedTrack}>{t('Track')}</Text>
              </Pressable>
            ))}
          </Panel>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.black, fontSize: 26, color: colors.ink },
  hint: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
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
  placeField: { minHeight: 72 },
  multiline: { minHeight: 110 },
  fieldInvalid: { borderColor: colors.danger },
  error: { fontFamily: fonts.semibold, fontSize: 14, color: colors.danger },
  where: { padding: 16, gap: 14 },
  whereHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  whereTitle: { fontFamily: fonts.black, fontSize: 18, color: colors.ink },
  locate: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius,
    backgroundColor: colors.accent,
  },
  locateText: { fontFamily: fonts.bold, fontSize: 15, color: colors.onAccent },
  found: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
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
  savedTitle: { fontFamily: fonts.black, fontSize: 16, color: colors.ink },
  savedRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  savedRule: { borderTopWidth: 1, borderTopColor: colors.line },
  savedRef: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  savedTrack: { fontFamily: fonts.semibold, fontSize: 14, color: colors.accent },
});
