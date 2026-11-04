import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
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
import { FAQ, FOOTER_COPY, HERO, HOTLINE, ROLES_COPY, STEP_CARDS } from '../lib/landingCopy.js';
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
  const scroll = useRef(null);
  const [offsets, setOffsets] = useState({});

  const signIn = () => router.push('/login');
  const open = async (url, failure) => {
    if (!(await openLink(url))) toast(failure, 'error');
  };
  const call = () => open(`tel:${HOTLINE}`, 'This phone cannot make calls.');
  const goTo = (section) => scroll.current?.scrollTo({ y: offsets[section] ?? 0, animated: true });
  // Offsets are inside the light section, which starts below the hero.
  const measure = (section) => (event) => {
    const { y } = event.nativeEvent.layout;
    setOffsets((current) => ({ ...current, [section]: y }));
  };
  const measureLight = (event) => {
    const { y } = event.nativeEvent.layout;
    setOffsets((current) => ({ ...current, light: y }));
  };
  const goToSection = (section) => {
    if (section === 'top') goTo('top');
    else
      scroll.current?.scrollTo({
        y: (offsets.light ?? 0) + (offsets[section] ?? 0),
        animated: true,
      });
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={HERO.report}
            onPress={signIn}
            style={({ pressed }) => [styles.reportButton, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.reportText}>{HERO.report}</Text>
            <Feather name="arrow-up-right" size={14} color={colors.onAccent} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        ref={scroll}
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
            <Pressable
              accessibilityRole="button"
              onPress={signIn}
              style={({ pressed }) => [
                styles.reportButton,
                styles.heroButton,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.reportText}>Sign in</Text>
            </Pressable>
          </View>
        </Photo>

        <View onLayout={measureLight} style={styles.light}>
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

          <View onLayout={measure('roles')} style={{ gap: 12 }}>
            <Text style={styles.eyebrow}>{ROLES_COPY.eyebrow}</Text>
            <Text accessibilityRole="header" style={styles.h2}>
              {ROLES_COPY.title}
            </Text>
            {ROLES_COPY.items.map((item) => {
              const mobile = item.title !== 'Service coordinator';
              return (
                <Pressable
                  key={item.title}
                  accessibilityRole={mobile ? 'button' : 'text'}
                  accessibilityLabel={`${item.title}. ${item.body}. ${mobile ? item.go : COORDINATOR_NOTE}`}
                  disabled={!mobile}
                  onPress={signIn}
                  style={[styles.role, item.highlight && styles.roleOn]}
                >
                  <Image
                    source={PHOTOS[item.image]}
                    resizeMode="cover"
                    accessibilityIgnoresInvertColors
                    style={styles.rolePhoto}
                  />
                  <View style={styles.roleText}>
                    <Text style={styles.roleTitle}>{item.title}</Text>
                    <Text style={styles.roleBody}>{item.body}</Text>
                    <Text style={styles.roleGo}>{mobile ? `${item.go} ↗` : COORDINATOR_NOTE}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View onLayout={measure('faq')} style={{ marginTop: 20, gap: 12 }}>
            <Text style={styles.eyebrow}>{FAQ.eyebrow}</Text>
            <Text accessibilityRole="header" style={styles.h2}>
              {FAQ.title}
            </Text>
            <View style={styles.faq}>
              {FAQ.items.map((item, index) => (
                <FaqRow key={item.q} item={item} first={index === 0} />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.brand}>
            <Feather name="zap" size={24} color={colors.accent} />
            <Text style={styles.brandText}>UMURIRO</Text>
          </View>
          <Text style={styles.footerBlurb}>{FOOTER_COPY.blurb}</Text>

          <FooterColumn title="Quick Links">
            <FooterLink label="Home" onPress={() => goToSection('top')} />
            <FooterLink label="Dashboards" onPress={() => goToSection('roles')} />
            <FooterLink label="FAQ" onPress={() => goToSection('faq')} />
          </FooterColumn>

          <FooterColumn title="Services">
            <FooterLink label="Report a fault" onPress={signIn} />
            <FooterLink label="Technician jobs" onPress={signIn} />
            <FooterLink label="Safety guidance" onPress={() => goToSection('faq')} />
          </FooterColumn>

          <FooterColumn title={FOOTER_COPY.contactTitle}>
            {FOOTER_COPY.contact.map((line) =>
              line.href ? (
                <FooterLink
                  key={line.label}
                  label={line.label}
                  onPress={() => open(line.href, 'This phone cannot open that link.')}
                />
              ) : (
                <Text key={line.label} style={styles.footerText}>
                  {line.label}
                </Text>
              )
            )}
          </FooterColumn>

          <View style={styles.footerBase}>
            <Text style={styles.footerSmall}>{FOOTER_COPY.copyright}</Text>
            <Text style={styles.footerSmall}>{FOOTER_COPY.legal}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function FooterColumn({ title, children }) {
  return (
    <View style={{ gap: 4 }}>
      <Text accessibilityRole="header" style={styles.footerHeading}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function FooterLink({ label, onPress }) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      style={({ pressed }) => [styles.footerLink, pressed && { opacity: 0.7 }]}
    >
      <Text style={styles.footerText}>{label}</Text>
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
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: radius,
    backgroundColor: colors.accent,
  },
  heroButton: { minHeight: 52, alignSelf: 'stretch' },
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
  light: { backgroundColor: colors.paper, padding: 16, paddingTop: 24 },
  stepGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
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
  // The photo sits above the text and shows almost all of the picture (3:2 photos in a 16:10 frame).
  role: {
    overflow: 'hidden',
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  roleOn: { borderWidth: 2, borderColor: colors.accent },
  rolePhoto: { width: '100%', aspectRatio: 16 / 10 },
  roleText: { gap: 2, padding: 14 },
  roleTitle: { fontFamily: fonts.black, fontSize: 18, color: colors.ink },
  roleBody: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  roleGo: { marginTop: 6, fontFamily: fonts.bold, fontSize: 13, color: colors.accent },
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
  footer: { gap: 24, padding: 24, paddingTop: 32, backgroundColor: '#140b0c' },
  footerBlurb: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, color: '#c9c3c3' },
  footerHeading: { fontFamily: fonts.black, fontSize: 16, color: colors.white, marginBottom: 4 },
  footerLink: { minHeight: 36, justifyContent: 'center' },
  footerText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, color: '#c9c3c3' },
  footerBase: {
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: 16,
  },
  footerSmall: { fontFamily: fonts.regular, fontSize: 12, color: '#9a9494' },
});
