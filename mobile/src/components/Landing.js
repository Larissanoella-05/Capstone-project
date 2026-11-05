import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { HOME_BY_ROLE, useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { coverFrame } from '../lib/focalImage.js';
import Backdrop from './Backdrop.js';
import { Brand } from './Brand.js';
import { FAQ, FOOTER_COPY, HERO, HOTLINE, ROLES_COPY, STEP_CARDS } from '../lib/landingCopy.js';
import { openLink } from '../lib/links.js';
import { colors, fonts, radius, shadow } from '../theme.js';

// Pixel size of each file and the point of the picture to keep in view: the web's `background-position`.
const PHOTOS = {
  silhouette: {
    source: require('../../assets/landing/silhouette.jpg'),
    width: 1920,
    height: 1280,
    focus: { x: 0.5, y: 0.4 },
  },
  poles: {
    source: require('../../assets/landing/poles.jpg'),
    width: 1920,
    height: 1116,
    focus: { x: 0.4, y: 0.4 },
  },
  panel: {
    source: require('../../assets/landing/panel.jpg'),
    width: 1100,
    height: 1650,
    focus: { x: 0.5, y: 0.38 },
  },
  tower: {
    source: require('../../assets/landing/tower.jpg'),
    width: 1920,
    height: 1280,
    focus: { x: 0.35, y: 0.4 },
  },
};

// Coordinators only have the web dashboard, so their card says so instead of leading to a sign-in.
const COORDINATOR_NOTE = 'On the web dashboard';
const HEADER_HEIGHT = 64;
// Tall enough for the headline and button, short enough that the 3:2 photo is not cropped to a sliver.
const HERO_HEIGHT = 500;

/** Replaces the deprecated ImageBackground; it waits for the box to be measured, so a photo never flashes at the wrong crop. */
function Photo({ photo, style, children }) {
  const [box, setBox] = useState(null);
  const frame = box ? coverFrame(photo, box, photo.focus) : null;
  return (
    <View
      style={[style, { overflow: 'hidden' }]}
      onLayout={({ nativeEvent: { layout } }) =>
        setBox({ width: layout.width, height: layout.height })
      }
    >
      {frame ? (
        <Image
          source={photo.source}
          accessibilityIgnoresInvertColors
          style={{ position: 'absolute', ...frame }}
        />
      ) : null}
      {children}
    </View>
  );
}

/** A signed-in user can open it from the header, and then its buttons lead to their own dashboard. */
export default function Landing() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const scroll = useRef(null);
  const [offsets, setOffsets] = useState({});

  // Signed in, the app is already open underneath this screen: go back to it instead of stacking a copy.
  const signIn = () => (user ? router.navigate(HOME_BY_ROLE[user.role]) : router.push('/login'));
  const reportLabel = user ? 'Open my app' : HERO.report;
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
      <ScrollView
        ref={scroll}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        contentContainerStyle={{ paddingBottom: insets.bottom }}
      >
        <Photo
          photo={PHOTOS.silhouette}
          style={[
            styles.hero,
            { paddingTop: HEADER_HEIGHT + insets.top, minHeight: HERO_HEIGHT + insets.top },
          ]}
        >
          <View style={styles.shade} />
          {/* Like the web: the bar sits on the photo and scrolls away with it. */}
          <View
            style={[styles.header, { paddingTop: insets.top, height: HEADER_HEIGHT + insets.top }]}
          >
            <Brand onDark />
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
                accessibilityLabel={reportLabel}
                onPress={signIn}
                style={({ pressed }) => [styles.reportButton, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.reportText}>{reportLabel}</Text>
                <Feather name="arrow-up-right" size={14} color={colors.onAccent} />
              </Pressable>
            </View>
          </View>
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
              <Text style={styles.reportText}>{user ? 'Open my app' : 'Sign in'}</Text>
            </Pressable>
          </View>
        </Photo>

        <View onLayout={measureLight} style={styles.light}>
          <Backdrop />
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
                  <Photo photo={PHOTOS[item.image]} style={styles.rolePhoto} />
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
          <Brand iconSize={24} />
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
  page: { flex: 1, backgroundColor: colors.paper },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
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
  shade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(8,6,6,0.5)' },
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
  light: { backgroundColor: colors.paper, padding: 16, paddingTop: 24, overflow: 'hidden' },
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
  // The photo sits above the text; 4:3 keeps most of the landscape photos in view (the panel photo is portrait).
  role: {
    overflow: 'hidden',
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  roleOn: { borderWidth: 2, borderColor: colors.accent },
  rolePhoto: { width: '100%', aspectRatio: 4 / 3 },
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
  // The footer colours are the web's `.lp-footer`: the paper background, ink headings, grey links.
  footer: { gap: 24, padding: 24, paddingTop: 32, backgroundColor: colors.paper },
  footerBlurb: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, color: '#5b5b66' },
  footerHeading: { fontFamily: fonts.heading, fontSize: 15, color: colors.ink, marginBottom: 4 },
  footerLink: { minHeight: 36, justifyContent: 'center' },
  footerText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, color: '#5b5b66' },
  footerBase: {
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: '#dcdce6',
    paddingTop: 16,
  },
  footerSmall: { fontFamily: fonts.regular, fontSize: 12, color: '#777777' },
});
