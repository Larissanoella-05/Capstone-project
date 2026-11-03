import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useToast } from '../context/ToastContext.js';
import { CTA, FAQ, HERO, HOTLINE, ROLES_COPY, STEP_CARDS } from '../lib/landingCopy.js';
import { openLink } from '../lib/links.js';
import { colors, fonts, radius, shadow } from '../theme.js';

const PHOTOS = {
  silhouette: require('../../assets/landing/silhouette.jpg'),
  poles: require('../../assets/landing/poles.jpg'),
  panel: require('../../assets/landing/panel.jpg'),
  tower: require('../../assets/landing/tower.jpg'),
};

// Coordinators only have the web dashboard, so their card says so instead of leading to a sign-in
// that this app cannot use.
const COORDINATOR_NOTE = 'On the web dashboard';
const HEADER_HEIGHT = 64;

/** A photo that fills its box, with the children on top (ImageBackground is deprecated). */
function Photo({ source, style, children }) {
  return (
    <View style={[style, { overflow: 'hidden' }]}>
      <Image source={source} resizeMode="cover" style={StyleSheet.absoluteFill} />
      {children}
    </View>
  );
}

/** The first screen for signed-out visitors: the web landing page, short and without the scroll animation. */
export default function Landing() {
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const signIn = () => router.push('/login');
  const call = async () => {
    if (!(await openLink(`tel:${HOTLINE}`))) toast('This phone cannot make calls.', 'error');
  };

  return (
    <View style={styles.page}>
      <View style={[styles.header, { paddingTop: insets.top, height: HEADER_HEIGHT + insets.top }]}>
        <View style={styles.brand}>
          <Feather name="zap" size={22} color={colors.accent} />
          <Text style={styles.brandText}>UMURIRO</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Call ${HOTLINE}`}
            hitSlop={8}
            onPress={call}
            style={styles.iconButton}
          >
            <Feather name="phone" size={20} color={colors.accent} />
          </Pressable>
          <ReportButton compact onPress={signIn} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        contentContainerStyle={{ paddingBottom: insets.bottom }}
      >
        <Photo
          source={PHOTOS.silhouette}
          style={[styles.hero, { minHeight: Math.max(520, height - HEADER_HEIGHT - insets.top) }]}
        >
          <View style={styles.shade} />
          <View style={styles.heroBody}>
            <Text accessibilityRole="header" style={styles.headline}>
              {HERO.headline.join('\n').toUpperCase()}
              {'\n'}
              <Text style={{ color: colors.accent }}>{HERO.accentWord.toUpperCase()}</Text>
            </Text>
            <Text style={styles.tagline}>{HERO.tagline}</Text>
            <View style={styles.heroButtons}>
              <ReportButton label={HERO.report} onPress={signIn} />
              <Pressable
                accessibilityRole="button"
                onPress={signIn}
                style={({ pressed }) => [styles.outlineButton, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.outlineText}>Sign in</Text>
              </Pressable>
            </View>
          </View>
        </Photo>

        <View style={styles.light}>
          <View style={styles.stepGrid}>
            {STEP_CARDS.map((card) => (
              <View key={card.title} style={[styles.step, card.highlight && styles.stepOn]}>
                <Svg width={40} height={40} viewBox="0 0 26 26" fill="none">
                  <Path
                    d={card.icon}
                    stroke={colors.accent}
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={styles.stepTitle}>{card.title}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.eyebrow}>{ROLES_COPY.eyebrow}</Text>
          <Text accessibilityRole="header" style={styles.h2}>
            {ROLES_COPY.title}
          </Text>
          <View style={{ gap: 12 }}>
            {ROLES_COPY.items.map((item) => {
              const mobile = item.title !== 'Service coordinator';
              return (
                <Pressable
                  key={item.title}
                  accessibilityRole={mobile ? 'button' : 'text'}
                  accessibilityLabel={`${item.title}. ${item.body}. ${mobile ? item.go : COORDINATOR_NOTE}`}
                  disabled={!mobile}
                  onPress={signIn}
                >
                  <Photo
                    source={PHOTOS[item.image]}
                    style={[styles.role, item.highlight && styles.roleOn]}
                  >
                    <View style={[styles.roleShade, { borderRadius: radius }]} />
                    <Text style={styles.roleTitle}>{item.title}</Text>
                    <Text style={styles.roleBody}>{item.body}</Text>
                    <Text style={styles.roleGo}>{mobile ? `${item.go} ↗` : COORDINATOR_NOTE}</Text>
                  </Photo>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.eyebrow, { marginTop: 32 }]}>{FAQ.eyebrow}</Text>
          <Text accessibilityRole="header" style={styles.h2}>
            {FAQ.title}
          </Text>
          <View style={styles.faq}>
            {FAQ.items.map((item, index) => (
              <FaqRow key={item.q} item={item} first={index === 0} />
            ))}
          </View>
        </View>

        <View style={styles.cta}>
          <Text accessibilityRole="header" style={styles.ctaTitle}>
            {CTA.title.join('\n')}
          </Text>
          <Text style={styles.ctaBody}>{CTA.body}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={signIn}
            style={({ pressed }) => [styles.whiteButton, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.whiteText}>{CTA.signIn}</Text>
            <Feather name="arrow-up-right" size={18} color={colors.accent} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={call}
            style={({ pressed }) => [styles.outlineButton, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.outlineText}>{CTA.call}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function ReportButton({ onPress, label = HERO.report, compact = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.reportButton,
        compact && styles.reportCompact,
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text style={[styles.reportText, compact && { fontSize: 13 }]}>{label}</Text>
      <Feather name="arrow-up-right" size={compact ? 14 : 16} color={colors.onAccent} />
    </Pressable>
  );
}

function FaqRow({ item, first }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={[styles.faqRow, !first && { borderTopWidth: 1, borderTopColor: colors.line }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((value) => !value)}
        style={styles.faqQuestion}
      >
        <Text style={styles.faqQ}>{item.q}</Text>
        <Feather name={open ? 'minus' : 'plus'} size={18} color={colors.accent} />
      </Pressable>
      {open ? <Text style={styles.faqA}>{item.a}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.ink },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#140b0c',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandText: { fontFamily: fonts.black, fontSize: 20, color: colors.white },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  reportButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 22,
    borderRadius: radius,
    backgroundColor: colors.accent,
  },
  reportCompact: { minHeight: 44, paddingHorizontal: 14 },
  reportText: { fontFamily: fonts.bold, fontSize: 15, color: colors.onAccent },
  hero: { justifyContent: 'center', backgroundColor: colors.ink },
  shade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  heroBody: { alignItems: 'center', gap: 20, paddingHorizontal: 24, paddingVertical: 48 },
  headline: {
    fontFamily: fonts.black,
    fontSize: 44,
    lineHeight: 48,
    textAlign: 'center',
    color: colors.white,
  },
  tagline: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 25,
    textAlign: 'center',
    color: colors.white,
  },
  heroButtons: { gap: 12, alignItems: 'center', alignSelf: 'stretch' },
  outlineButton: {
    minHeight: 48,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.white,
  },
  outlineText: { fontFamily: fonts.bold, fontSize: 15, color: colors.white },
  light: { backgroundColor: colors.paper, padding: 16, paddingTop: 24, gap: 12 },
  stepGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  step: {
    width: '48%',
    flexGrow: 1,
    gap: 12,
    padding: 16,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    ...shadow,
  },
  stepOn: { borderColor: colors.accent, backgroundColor: colors.tint },
  stepTitle: { fontFamily: fonts.black, fontSize: 15, lineHeight: 20, color: colors.ink },
  eyebrow: { fontFamily: fonts.bold, fontSize: 12, color: colors.accent },
  h2: { fontFamily: fonts.black, fontSize: 24, lineHeight: 30, color: colors.ink },
  role: { minHeight: 150, justifyContent: 'flex-end', gap: 4, padding: 16, borderRadius: radius },
  roleOn: { borderWidth: 2, borderColor: colors.accent },
  roleShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  roleTitle: { fontFamily: fonts.black, fontSize: 20, color: colors.white },
  roleBody: { fontFamily: fonts.regular, fontSize: 14, color: colors.white },
  roleGo: { marginTop: 6, fontFamily: fonts.bold, fontSize: 13, color: colors.white },
  faq: {
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  faqRow: { paddingHorizontal: 16 },
  faqQuestion: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  faqQ: { flex: 1, fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  faqA: {
    paddingBottom: 16,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
  },
  cta: { gap: 16, padding: 24, paddingVertical: 40, backgroundColor: colors.accent },
  ctaTitle: { fontFamily: fonts.black, fontSize: 28, lineHeight: 34, color: colors.white },
  ctaBody: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.white },
  whiteButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius,
    backgroundColor: colors.white,
  },
  whiteText: { fontFamily: fonts.bold, fontSize: 15, color: colors.accent },
});
