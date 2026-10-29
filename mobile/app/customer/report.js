import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, Eyebrow, PageHeading } from '../../src/components/Bits.js';
import { Screen } from '../../src/components/Shell.js';
import { FormError } from '../../src/components/States.js';
import { useAuth } from '../../src/context/AuthContext.js';
import { useApi } from '../../src/hooks/useApi.js';
import { api } from '../../src/lib/api.js';
import { CATEGORIES, locationLine } from '../../src/lib/format.js';
import { pickAndPreparePhoto } from '../../src/lib/photo.js';
import { colors, fonts } from '../../src/theme.js';

export default function ReportFault() {
  const { user } = useAuth();
  const router = useRouter();
  const locations = useApi('/service-locations');

  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [contactPhone, setContactPhone] = useState(user.phone ?? '');
  const [photo, setPhoto] = useState(null); // { name, uri, dataUrl }
  const [photoBusy, setPhotoBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const location = locations.data?.serviceLocations?.[0];

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

  async function onSubmit() {
    const nextErrors = {};
    if (!category) nextErrors.category = 'Choose a fault category.';
    if (description.length > 1000) nextErrors.description = 'Keep the description under 1000 characters.';
    if (contactPhone && !/^[+\d][\d\s-]{7,}$/.test(contactPhone.trim())) {
      nextErrors.contactPhone = 'Enter a phone number such as +250 788 300 114.';
    }
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) {
      setFormError('Check the highlighted fields and try again.');
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

  return (
    <Screen>
      <PageHeading eyebrow="New report" title="Report a fault">
        <Text style={styles.sub}>Tell us what is wrong. It takes less than a minute.</Text>
      </PageHeading>

      <View style={{ gap: 8 }}>
        <Eyebrow>01 · Fault category</Eyebrow>
        <View accessibilityRole="radiogroup" style={[styles.group, { borderColor: errors.category ? colors.danger : colors.ink }]}>
          {CATEGORIES.map((item, index) => {
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
                style={[styles.option, index < CATEGORIES.length - 1 && styles.optionDivider, { backgroundColor: active ? colors.volt : colors.white }]}
              >
                <View style={[styles.radio, active && styles.radioOn]}>{active ? <View style={styles.radioDot} /> : null}</View>
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

      <View style={{ gap: 8 }}>
        <View style={styles.labelRow}>
          <Eyebrow>02 · Description</Eyebrow>
          <Eyebrow style={{ color: colors.muted }}>Optional</Eyebrow>
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
          <Eyebrow>03 · Photo</Eyebrow>
          <Eyebrow style={{ color: colors.muted }}>Optional</Eyebrow>
        </View>
        {photo ? (
          <View style={styles.photoRow}>
            <Image source={{ uri: photo.uri }} accessibilityLabel="Selected fault photo" style={styles.thumb} />
            <Text numberOfLines={1} style={styles.photoName}>{photo.name}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Remove photo" onPress={() => setPhoto(null)} style={styles.remove}>
              <Feather name="x" size={18} color={colors.ink} />
            </Pressable>
          </View>
        ) : photoBusy ? (
          <View style={styles.busy}>
            <ActivityIndicator color={colors.muted} />
            <Eyebrow style={{ color: colors.muted }}>Preparing photo…</Eyebrow>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button label="Take photo" tone="outline" icon="camera" onPress={() => choosePhoto('camera')} style={styles.photoButton} />
            <Button label="Choose photo" tone="outline" icon="image" onPress={() => choosePhoto('library')} style={styles.photoButton} />
          </View>
        )}
        {errors.photo ? <Text style={styles.error}>{errors.photo}</Text> : null}
      </View>

      <View style={{ gap: 8 }}>
        <Eyebrow>04 · Contact phone</Eyebrow>
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

      <View style={styles.locationCard}>
        {locations.loading ? (
          <Eyebrow style={{ color: colors.muted }}>Loading your service location…</Eyebrow>
        ) : location ? (
          <>
            <Eyebrow style={{ color: colors.muted }}>Service location · Meter {location.meterNumber}</Eyebrow>
            <Text style={styles.locationLine}>{locationLine(location)}</Text>
            <Text style={styles.locationNote}>Your registered service location will automatically be associated with this report.</Text>
          </>
        ) : (
          <Text style={[styles.error, { fontSize: 14 }]}>
            {locations.error?.message || 'No registered service location was found for your account.'}
          </Text>
        )}
      </View>

      <FormError>{formError}</FormError>

      <Button label={submitting ? 'Submitting…' : 'Submit Fault'} onPress={onSubmit} disabled={submitting || photoBusy || !location} style={{ minHeight: 56 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: 12, fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  group: { borderWidth: 1 },
  option: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 10 },
  optionDivider: { borderBottomWidth: 1, borderBottomColor: colors.ink },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  radioOn: { backgroundColor: colors.white },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.ink },
  optionLabel: { fontFamily: fonts.black, fontSize: 16, textTransform: 'uppercase', color: colors.ink },
  optionHint: { fontFamily: fonts.regular, fontSize: 13, color: colors.ink },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  field: { minHeight: 48, borderWidth: 1, borderColor: colors.ink, paddingHorizontal: 12, paddingVertical: 10, fontFamily: fonts.regular, fontSize: 16, color: colors.ink, backgroundColor: colors.white },
  multiline: { minHeight: 110 },
  fieldInvalid: { borderColor: colors.danger },
  error: { fontFamily: fonts.semibold, fontSize: 14, color: colors.danger },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.ink, padding: 8 },
  thumb: { width: 64, height: 64, borderWidth: 1, borderColor: colors.line },
  photoName: { flex: 1, fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  remove: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.ink },
  busy: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, borderWidth: 1, borderColor: colors.line },
  photoButton: { flex: 1, paddingHorizontal: 8, borderStyle: 'dashed' },
  locationCard: { borderWidth: 1, borderColor: colors.ink, backgroundColor: colors.paper, padding: 16, gap: 4 },
  locationLine: { fontFamily: fonts.black, fontSize: 18, textTransform: 'uppercase', color: colors.ink },
  locationNote: { marginTop: 4, fontFamily: fonts.regular, fontSize: 14, color: colors.ink },
});
