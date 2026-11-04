import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
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
import { Eyebrow } from '../src/components/Bits.js';
import { Brand } from '../src/components/Brand.js';
import { FormError } from '../src/components/States.js';
import { useAuth } from '../src/context/AuthContext.js';
import { isDemoLogin } from '../src/lib/demo.js';
import Backdrop from '../src/components/Backdrop.js';
import { colors, fonts, radius } from '../src/theme.js';

const DEMO = isDemoLogin(process.env.EXPO_PUBLIC_DEMO_LOGIN);
const DEMO_PASSWORD = 'demo1234';
const ROLES = [
  {
    key: 'CUSTOMER',
    label: 'Customer',
    icon: 'user',
    email: 'aline@demo.rw',
    person: 'Aline Mukamana',
    blurb: 'Report a fault and follow the response.',
  },
  {
    key: 'TECHNICIAN',
    label: 'Technician',
    icon: 'tool',
    email: 'jeanclaude@demo.rw',
    person: 'Jean Claude Habimana',
    blurb: 'See assigned jobs, navigate and update the status.',
  },
];

// The free Render server sleeps when idle and takes up to a minute to wake.
const SLOW_AFTER_MS = 5000;

export default function Login() {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [role, setRole] = useState(ROLES[0]);
  const [email, setEmail] = useState(DEMO ? ROLES[0].email : '');
  const [password, setPassword] = useState(DEMO ? DEMO_PASSWORD : '');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!submitting) {
      setSlow(false);
      return undefined;
    }
    const timer = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, [submitting]);

  function chooseRole(next) {
    setRole(next);
    // Only the demo build fills in the account; a real sign-in keeps what the person typed.
    if (DEMO) {
      setEmail(next.email);
      setPassword(DEMO_PASSWORD);
    }
    setErrors({});
    setFormError('');
  }

  async function onSubmit() {
    const nextErrors = {};
    if (!email.trim()) nextErrors.email = 'Enter your email address.';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim()))
      nextErrors.email = 'Enter a valid email address.';
    if (!password) nextErrors.password = 'Enter your password.';
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      // On success the root layout's guards move the user to their own tab tree.
      await login(email.trim(), password, role.key);
    } catch (error) {
      setFormError(error.message);
      setSubmitting(false);
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
            <Eyebrow>Sign in</Eyebrow>
            <Text accessibilityRole="header" style={styles.formTitle}>
              Login
            </Text>
          </View>

          <View style={{ gap: 8 }}>
            <Eyebrow>Signing in as</Eyebrow>
            <View accessibilityRole="radiogroup" style={styles.roles}>
              {ROLES.map((item) => {
                const active = item.key === role.key;
                return (
                  <Pressable
                    key={item.key}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    onPress={() => chooseRole(item)}
                    style={[styles.role, active && styles.roleActive]}
                  >
                    <Feather
                      name={item.icon}
                      size={20}
                      color={active ? colors.accent : colors.ink}
                    />
                    <Text style={styles.roleLabel}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.hint}>
              {DEMO ? `${role.blurb} Signing in as ${role.person}.` : role.blurb}
            </Text>
          </View>

          <View style={{ gap: 8 }}>
            <Eyebrow>Email</Eyebrow>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="username"
              autoCorrect={false}
              accessibilityLabel="Email"
              style={[styles.field, errors.email && styles.fieldInvalid]}
            />
            {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}
          </View>

          <View style={{ gap: 8 }}>
            <Eyebrow>Password</Eyebrow>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              accessibilityLabel="Password"
              onSubmitEditing={onSubmit}
              style={[styles.field, errors.password && styles.fieldInvalid]}
            />
            {errors.password ? (
              <Text style={styles.fieldError}>{errors.password}</Text>
            ) : DEMO ? (
              <Text style={styles.hint}>
                Prototype: every demo account uses the password{' '}
                <Text style={{ fontFamily: fonts.medium }}>demo1234</Text>.
              </Text>
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
            <Text style={styles.submitText}>{submitting ? 'Signing in…' : 'Sign in'}</Text>
          </Pressable>

          {slow ? (
            <Text accessibilityLiveRegion="polite" style={styles.hint}>
              Waking the server, this can take up to a minute…
            </Text>
          ) : null}
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
  roles: { flexDirection: 'row', gap: 8 },
  role: {
    flex: 1,
    minHeight: 64,
    padding: 12,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius,
    backgroundColor: colors.white,
  },
  roleActive: { borderColor: colors.accent, backgroundColor: colors.tint },
  roleLabel: {
    fontFamily: fonts.black,
    fontSize: 14,
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
  submit: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius,
    backgroundColor: colors.accent,
  },
  submitText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.onAccent,
  },
});
