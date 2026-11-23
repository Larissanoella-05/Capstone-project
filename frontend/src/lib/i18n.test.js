import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  isLanguage,
  languageToSync,
  parseLanguage,
  translate,
} from './i18n.js';
import { RW } from './messages.rw.js';
import * as format from './format.js';
import { nextStepFor } from './progress.js';
import * as landing from './landingContent.js';
import * as landingCopy from './landingCopy.js';
import { textsIn } from './i18n.js';
import { STEP_NAMES } from './reportSteps.js';

const read = (relative) => readFileSync(new URL(relative, import.meta.url), 'utf8');
const placeholders = (text) => (text.match(/\{\w+\}/g) ?? []).sort();

// Screens already translated. A screen is added here when it starts calling t(), so a new English
// text without a Kinyarwanda entry fails this test instead of reaching the demo.
const WEB_SCREENS = [
  'components/Bits.jsx',
  'components/Brand.jsx',
  'components/LanguageSwitch.jsx',
  'components/PublicShell.jsx',
  'components/States.jsx',
  'components/TrackingView.jsx',
  'pages/Login.jsx',
  'pages/public/GuestReport.jsx',
  'pages/public/GuestSubmitted.jsx',
  'pages/public/GuestTracking.jsx',
  'pages/Register.jsx',
  'pages/Notifications.jsx',
  'pages/customer/Dashboard.jsx',
  'pages/customer/Reports.jsx',
  'pages/customer/ReportFault.jsx',
  'pages/customer/Submitted.jsx',
  'pages/technician/Dashboard.jsx',
  'pages/technician/Jobs.jsx',
  'pages/technician/JobDetails.jsx',
  'pages/technician/JobClosed.jsx',
  'pages/technician/ResolveJob.jsx',
  'pages/landing/About.jsx',
  'pages/landing/Cta.jsx',
  'pages/landing/Hero.jsx',
  'pages/landing/LandingFooter.jsx',
  'pages/landing/LandingHeader.jsx',
  'components/BottomNav.jsx',
  'components/Pills.jsx',
  'components/Sidebar.jsx',
  'lib/registration.js',
  'lib/reportSteps.js',
  'lib/guestReport.js',
  'lib/format.js',
  'lib/progress.js',
];
const MOBILE_SCREENS = [
  'src/components/Bits.js',
  'src/components/Brand.js',
  'src/components/LanguageSwitch.js',
  'src/components/Shell.js',
  'src/components/States.js',
  'src/components/TrackingView.js',
  'app/login.js',
  'app/guest/report.js',
  'app/guest/sent/[token].js',
  'app/guest/track/[token].js',
  'app/register.js',
  'app/customer/(tabs)/index.js',
  'app/customer/(tabs)/report.js',
  'app/customer/(tabs)/reports.js',
  'app/customer/submitted/[id].js',
  'app/technician/(tabs)/index.js',
  'app/technician/(tabs)/jobs.js',
  'app/technician/jobs/[id].js',
  'app/technician/jobs/[id]/resolve.js',
  'app/technician/jobs/[id]/closed.js',
  'src/components/Landing.js',
  'src/components/NotificationsList.js',
  'src/components/Pills.js',
  'src/components/tabOptions.js',
];

// Messages the shared helpers build in English and the screens pass through t().
const HELPER_MESSAGES = [
  'Choose the type of fault.',
  'Enter a Rwandan mobile number such as 078 123 4567.',
  'Shorten the place to 300 characters or fewer.',
  'Tell us where the fault is: use your location or describe the place.',
  'A meter number has 11 or 13 digits. Leave it empty if you do not know it.',
  'Shorten the description to 1000 characters or fewer.',
  'Enter your email or phone number.',
  'Enter a valid email address.',
  'Location is blocked for this site. Allow it in your browser settings, or describe the place below.',
  'Your phone could not find its position. Try again outside, or describe the place below.',
  'Finding your location took too long. Try again, or describe the place below.',
  'Your location could not be used. Describe the place below.',
  'Location is off for this app. Allow it in Settings, then try again.',
  'Your phone could not find its position. Check that GPS is on and try again.',
  '{minutes} min ago',
  '{hours} hour ago',
  '{hours} hours ago',
  '{days} day ago',
  '{days} days ago',
  'Loading',
  'Loading your jobs',
  'Loading job',
  'Status updated: On the Way.',
  'Status updated: Arrived.',
  'Status updated: Working.',
  'Start: on my way',
  'I have arrived',
  'Start work',
  'Location updated.',
  'Location updated from this device.',
  'Starting location sharing…',
  'Sharing your location with the customer while this app is open.',
  'Location is off, so the customer cannot see you. Allow location for Umuriro in Settings.',
  'Could not read your location. Check that GPS is on.',
  'Location sharing is paused. Keep this app open to share your position.',
  'No app can open directions.',
  'Guest reporter',
  'Updating…',
  'Record resolution',
  'Navigate',
  'Call customer',
  'Call',
  'Back to my jobs',
  'My jobs',
  'Done',
  'Fault ID',
  'Outcome',
  'Completed',
  'Arrival',
  'Resolution description',
  'Work completed',
  'Clarification contacts',
  'Mark as resolved',
  'Saving…',
  'Job details',
  'Close job',
  'Unread',
  'Fault category',
  'optional',
  'Hide password',
  '078 123 4567',
  'Current fault {reference}',
  'Real emergency? Call 2727',
  'Umuriro, go to your home screen',
  'Open my app',
  'Quick Links',
  'Home',
  'Report',
  'Reports',
  'Alerts',
  'Jobs',
  'Main',
  'Signed in as',
  'Sign out',
  'Priority',
  'Available',
  'On a job',
  'Off duty',
  'Unassigned',
  'Good morning',
  'Good afternoon',
  'Good evening',
  'All',
  'Open',
  'Loading your faults',
  'Loading your reports',
  'Loading your report',
  'Loading notifications',
  '{count} report',
  '{count} reports',
  '{count} unread',
  'Report ID',
  'Category',
  'Location',
  'Status',
  'Type',
  'Contact phone',
  'Details',
  'Review',
  'Your fault is being handled',
  'My reports',
  'History',
  'Enter your full name.',
  'Enter a phone number such as +250 788 300 114.',
  'Your registered service location has not loaded yet.',
  'Use at least 8 characters for your password.',
  'A meter number has 11 or 13 digits.',
  'Enter your cell.',
  'Press "Use my location" so we can find your home on the map.',
  'Updates about your faults will appear here.',
  'Updates about your faults appear here.',
  'Loading fault',
  'Resolved',
];

// Addresses and names that read the same in both languages.
const NOT_TRANSLATED = new Set([
  'info@reg.rw',
  'KN82 ST3, Nyarugenge, Kigali',
  'Umuriro',
  'UMURIRO',
]);

/** Every text passed to t('...') as a plain string. */
function usedTexts(source) {
  const call = /\bt\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;
  return [...source.matchAll(call)].map((match) =>
    match[2].replace(/\\'/g, "'").replace(/\\"/g, '"')
  );
}

describe('translate', () => {
  it('gives the Kinyarwanda text, and the English text when there is none', () => {
    assert.equal(translate('rw', 'Language'), RW.Language);
    assert.equal(translate('rw', 'A text nobody translated'), 'A text nobody translated');
    assert.equal(translate('en', 'Language'), 'Language');
  });

  it('fills {placeholders} and leaves an unknown one visible', () => {
    assert.equal(translate('en', 'Step {n} of {total}', { n: 2, total: 3 }), 'Step 2 of 3');
    assert.equal(translate('en', 'Hello {name}', {}), 'Hello {name}');
  });
});

describe('languages', () => {
  it('knows English and Kinyarwanda and falls back to English', () => {
    assert.deepEqual(
      LANGUAGES.map((language) => language.code),
      ['en', 'rw']
    );
    assert.equal(DEFAULT_LANGUAGE, 'en');
    assert.equal(isLanguage('rw'), true);
    assert.equal(isLanguage('fr'), false);
    assert.equal(parseLanguage('rw'), 'rw');
    for (const value of ['fr', '', null, undefined, 42]) assert.equal(parseLanguage(value), 'en');
  });
});

describe('languageToSync', () => {
  const user = { id: 7, language: 'en' };

  it('does nothing when nobody is signed in', () => {
    assert.deepEqual(languageToSync(null, 'rw', null), { key: null, send: false });
  });

  it('sends the language of this device when the account has another', () => {
    assert.deepEqual(languageToSync(user, 'rw', null), { key: '7:rw', send: true });
  });

  it('does not send when the account already has it, or when it was sent already', () => {
    assert.equal(languageToSync(user, 'en', null).send, false);
    assert.equal(languageToSync(user, 'rw', '7:rw').send, false);
  });

  it('sends again when the person changes the language or a different person signs in', () => {
    assert.equal(languageToSync({ id: 7, language: 'rw' }, 'en', '7:rw').send, true);
    assert.equal(languageToSync({ id: 8, language: 'en' }, 'rw', '7:rw').send, true);
  });
});

describe('format helpers', () => {
  it('translate their words when given a t and stay English without one', () => {
    const upper = (text, params) => translate('en', text, params).toUpperCase();
    const now = new Date(Date.now() - 5 * 60000).toISOString();
    assert.equal(format.timeAgo(now), '5 min ago');
    assert.equal(format.timeAgo(now, upper), '5 MIN AGO');
    assert.equal(format.timeAgo(new Date().toISOString()), 'just now');
  });
});

describe('messages.rw.js', () => {
  it('has a non-empty text with the same placeholders for every key', () => {
    for (const [english, kinyarwanda] of Object.entries(RW)) {
      assert.ok(kinyarwanda.trim(), `empty Kinyarwanda for "${english}"`);
      assert.deepEqual(placeholders(kinyarwanda), placeholders(english), english);
    }
  });

  it('covers every status, category, priority and outcome label and the helper messages', () => {
    const labels = [
      ...Object.values(format.STATUS_LABEL),
      ...Object.values(format.CUSTOMER_HEADLINE),
      ...Object.values(format.CUSTOMER_TIMELINE_LABEL),
      ...format.CATEGORIES.flatMap((item) => [item.label, item.hint]),
      ...Object.values(format.PRIORITY_LABEL),
      ...format.OUTCOMES.map((item) => item.label),
      ...HELPER_MESSAGES,
      ...[...format.STAGES, 'CANCELLED'].map(nextStepFor),
    ];
    const missing = [...new Set(labels)].filter((text) => !RW[text]);
    assert.deepEqual(missing, []);
  });

  it('covers every word of the landing page copy', () => {
    const data = [
      landing.HERO,
      landing.HERO_HEADLINE,
      landing.HOTLINE_TEXT,
      landing.NAV_ITEMS,
      landing.DASHBOARD_MENU,
      landing.ABOUT,
      landing.SERVICES,
      landing.SAFETY_TIPS,
      landing.FOOTER,
      landing.ROLES,
      landing.FAQ,
      landing.CTA,
      landingCopy.FAQ,
      landingCopy.HERO,
      landingCopy.STEP_CARDS,
      landingCopy.CTA,
      STEP_NAMES,
    ];
    const missing = [...new Set(data.flatMap(textsIn))].filter(
      (text) => /[A-Za-z]{3}/.test(text) && !RW[text] && !NOT_TRANSLATED.has(text)
    );
    assert.deepEqual(missing, []);
  });

  it('covers every text the translated web screens ask for', () => {
    const missing = WEB_SCREENS.flatMap((file) =>
      usedTexts(read(`../${file}`))
        .filter((text) => !RW[text])
        .map((text) => `${file}: ${text}`)
    );
    assert.deepEqual(missing, []);
  });

  it('covers every text the translated mobile screens ask for', () => {
    const missing = MOBILE_SCREENS.flatMap((file) =>
      usedTexts(read(`../../../mobile/${file}`))
        .filter((text) => !RW[text])
        .map((text) => `${file}: ${text}`)
    );
    assert.deepEqual(missing, []);
  });
});
