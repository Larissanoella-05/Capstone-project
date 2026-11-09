import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Backdrop from '../src/components/Backdrop.js';
import { Eyebrow } from '../src/components/Bits.js';
import { Brand } from '../src/components/Brand.js';
import MapView from '../src/components/MapView.js';
import { FormError } from '../src/components/States.js';
import { useAuth } from '../src/context/AuthContext.js';
import { accuracyText, pointFromPosition } from '../src/lib/guestReport.js';
import { buildRegisterPayload, validateRegisterForm } from '../src/lib/registration.js';
import { colors, fonts, radius } from '../src/theme.js';

// The API names its fields as the request body does; the screen keys the location by one name.
const API_FIELD = { latitude: 'location', longitude: 'location' };
const FIELD_KEYS = ['name', 'phone', 'email', 'password', 'meterNumber', 'cell', 'location'];

// The free Render server sleeps when idle and takes up to a minute to wake.
const SLOW_AFTER_MS = 5000;

function TextField({ label, hint, error, ...input }) {
  return (
    <View style={{ gap: 8 }}>
      <Eyebrow>{hint ? `${label} (${hint})` : label}</Eyebrow>
      <TextInput
        accessibilityLabel={label}
        autoCorrect={false}
        style={[styles.field, error && styles.fieldInvalid]}
        {...input}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export default function Register() {
  const { register } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [meterNumber, setMeterNumber] = useState('');
  const [cell, setCell] = useState('');
  const [village, setVillage] = useState('');
  const [landmark, setLandmark] = useState('');
  const [point, setPoint] = useState(null); // { latitude, longitude, accuracyM }
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [slow, setSlow] = useState(false);

  const markers = useMemo(
    () =>
      point
        ? [{ id: 'home-point', lat: point.latitude, lng: point.longitude, kind: 'unassigned' }]
        : [],
    [point]
  );

  function clearError(key) {
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function findMe() {
    setLocationNote('');
    setLocating(true);
    try {
      let permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted) permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocationNote('Location is off for this app. Allow it in Settings, then try again.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setPoint(pointFromPosition(position));
      clearError('location');
    } catch (error) {
      console.warn('[location] could not read the position:', error.message);
      setLocationNote(
        'Your phone could not find its position. Check that GPS is on and try again.'
      );
    } finally {
      setLocating(false);
    }
  }

  async function onSubmit() {
    const form = { name, phone, email, password, meterNumber, cell, village, landmark, point };
    const nextErrors = validateRegisterForm(form);
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    const timer = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    try {
      // On success the root layout's guards move the new customer to their own tab tree.
      await register(buildRegisterPayload(form));
    } catch (error) {
      // A taken phone or email is shown on its own field; anything else above the button.
      const field = error.details?.[0]?.field;
      const key = API_FIELD[field] ?? field;
      if (FIELD_KEYS.includes(key)) setErrors({ [key]: error.message });
      else setFormError(error.message);
      setSubmitting(false);
    } finally {
      clearTimeout(timer);
      setSlow(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.paper }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Backdrop pylons />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            style={styles.back}
          >
            <Feather name="arrow-left" size={22} color={colors.ink} />
          </Pressable>
          <Brand />
        </View>

        <View style={[styles.form, { paddingBottom: insets.bottom + 32 }]}>
          <View>
            <Eyebrow>Customer</Eyebrow>
            <Text accessibilityRole="header" style={styles.formTitle}>
              Create your account
            </Text>
          </View>

          <TextField
            label="Full name"
            value={name}
            onChangeText={(text) => {
              setName(text);
              clearError('name');
            }}
            autoComplete="name"
            error={errors.name}
          />

          <View style={{ gap: 8 }}>
            <TextField
              label="Phone number"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                clearError('phone');
              }}
              keyboardType="phone-pad"
              autoComplete="tel"
              placeholder="078 123 4567"
              error={errors.phone}
            />
            {errors.phone ? null : (
              <Text style={styles.hint}>
                You can sign in with it, and it is where we text updates.
              </Text>
            )}
          </View>

          <TextField
            label="Email"
            hint="optional"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              clearError('email');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
          />

          <View style={{ gap: 8 }}>
            <Eyebrow>Password</Eyebrow>
            <View>
              <TextInput
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  clearError('password');
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="new-password"
                accessibilityLabel="Password"
                style={[styles.field, styles.passwordField, errors.password && styles.fieldInvalid]}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                onPress={() => setShowPassword((shown) => !shown)}
                style={styles.showPassword}
              >
                <Text style={styles.showPasswordText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>
            {errors.password ? (
              <Text style={styles.fieldError}>{errors.password}</Text>
            ) : (
              <Text style={styles.hint}>At least 8 characters.</Text>
            )}
          </View>

          <View style={styles.meter}>
            <View style={styles.meterHead}>
              <Feather name="map-pin" size={18} color={colors.accent} />
              <Text style={styles.meterTitle}>Your meter</Text>
            </View>

            <View style={{ gap: 8 }}>
              <TextField
                label="Meter number"
                value={meterNumber}
                onChangeText={(text) => {
                  setMeterNumber(text);
                  clearError('meterNumber');
                }}
                keyboardType="number-pad"
                autoComplete="off"
                error={errors.meterNumber}
              />
              {errors.meterNumber ? null : (
                <Text style={styles.hint}>
                  Printed on your meter and on your token receipt. Shared meter? Enter your
                  landlord's meter number.
                </Text>
              )}
            </View>

            <TextField
              label="Cell"
              value={cell}
              onChangeText={(text) => {
                setCell(text);
                clearError('cell');
              }}
              autoComplete="off"
              error={errors.cell}
            />
            <TextField
              label="Village"
              hint="optional"
              value={village}
              onChangeText={setVillage}
              autoComplete="off"
            />
            <TextField
              label="Landmark"
              hint="optional"
              value={landmark}
              onChangeText={setLandmark}
              placeholder="For example: near the blue gate"
              autoComplete="off"
            />

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
                  ? 'Finding your location…'
                  : point
                    ? 'Update my location'
                    : 'Use my location'}
              </Text>
            </Pressable>
            {errors.location ? (
              <Text accessibilityRole="alert" style={styles.fieldError}>
                {errors.location}
              </Text>
            ) : null}
            {point ? (
              <View accessibilityLiveRegion="polite" style={{ gap: 2 }}>
                <Text style={styles.found}>Location found</Text>
                <Text style={styles.hint}>{accuracyText(point.accuracyM)}</Text>
              </View>
            ) : null}
            {locationNote ? (
              <Text accessibilityRole="alert" style={styles.fieldError}>
                {locationNote}
              </Text>
            ) : null}
            {point ? (
              <MapView
                markers={markers}
                interactive={false}
                height={160}
                label="Map showing the location your phone found"
              />
            ) : null}
          </View>

          <FormError>{formError}</FormError>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: submitting }}
            disabled={submitting}
            onPress={onSubmit}
            style={({ pressed }) => [styles.submit, (submitting || pressed) && { opacity: 0.75 }]}
          >
            <Text style={styles.submitText}>
              {submitting ? 'Creating your account…' : 'Create account'}
            </Text>
          </Pressable>

          {slow ? (
            <Text accessibilityLiveRegion="polite" style={styles.hint}>
              Waking the server, this can take up to a minute…
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="link"
            onPress={() => router.replace('/login')}
            style={styles.signIn}
          >
            <Text style={styles.hint}>
              Already registered? <Text style={styles.link}>Sign in</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
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
  form: { padding: 24, gap: 20 },
  formTitle: {
    marginTop: 8,
    fontFamily: fonts.black,
    fontSize: 34,
    lineHeight: 38,
    color: colors.ink,
  },
  hint: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
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
  fieldInvalid: { borderColor: colors.danger },
  fieldError: { fontFamily: fonts.semibold, fontSize: 14, color: colors.danger },
  passwordField: { paddingRight: 64 },
  showPassword: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  showPasswordText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.muted },
  meter: {
    gap: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius,
    backgroundColor: colors.white,
  },
  meterHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meterTitle: { fontFamily: fonts.black, fontSize: 18, color: colors.ink },
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
  submit: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius,
    backgroundColor: colors.accent,
  },
  submitText: { fontFamily: fonts.bold, fontSize: 16, color: colors.onAccent },
  signIn: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  link: { fontFamily: fonts.semibold, color: colors.accent },
});
