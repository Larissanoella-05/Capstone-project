// Copy and link data for the public landing page. Kept out of the components so a test can scan it.
import { guestReportLink, loginLink, registerLink, TARGETS } from './landingLinks.js';
import {
  CTA as CTA_COPY,
  FAQ as FAQ_COPY,
  FOOTER_COPY,
  HERO,
  HOTLINE,
  ROLES_COPY,
} from './landingCopy.js';

export { HERO, HOTLINE };

// The web app takes reports without an account. The Android app still asks for sign-in, so the shared
// landingCopy.js keeps that wording and these web answers replace it here.
const WEB_ANSWERS = {
  'How do I report a fault?':
    'Open the report page, pick the type of fault, share your location or describe the place, add your phone number and send. You get a reference and a link to follow progress.',
  'Do I need an account?':
    'No. You can report a fault and follow it with the link you are given. Sign in only if you have an account and want your reports kept in one list.',
  'How do I know it is fixed?':
    'Your tracking page changes to resolved and shows what the technician did. Customers with an account also get a notification in the app.',
};

export const FAQ = {
  ...FAQ_COPY,
  items: FAQ_COPY.items.map((item) =>
    WEB_ANSWERS[item.q] ? { ...item, a: WEB_ANSWERS[item.q] } : item
  ),
};

export const CTA = {
  ...CTA_COPY,
  body: 'No more guessing when the lights will return. Report a fault and follow the repair until power is back.',
  signIn: 'Report a fault',
  register: 'Create an account',
};

/** The web hero headline. The Android landing screen keeps its own wording in landingCopy.js. */
export const HERO_HEADLINE = 'Power out? Report it, and watch it get fixed.';
export const HOTLINE_HREF = `tel:${HOTLINE}`;
export const HOTLINE_TEXT = `Real fault? Call ${HOTLINE}`;

/** In-page anchors (href) and the dashboards menu (link, goes to sign-in). */
export const NAV_ITEMS = [
  { label: 'Home', href: '#top' },
  { label: 'About', href: '#about' },
  { label: 'How it works', href: '#about' },
  { label: 'Dashboards', href: '#roles', menu: true },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#cta' },
];

export const DASHBOARD_MENU = [
  { label: 'Customer · Report a fault', link: guestReportLink },
  { label: 'Coordinator · Assign & monitor', link: loginLink(TARGETS.coordinator) },
  { label: 'Technician · My jobs', link: loginLink(TARGETS.technician) },
];

export const REPORT_LINK = guestReportLink;
export const REGISTER_LINK = registerLink;
export const COORDINATOR_LINK = loginLink(TARGETS.coordinator);

export const ABOUT = {
  eyebrow: 'About Umuriro',
  title: ['Smart fault reporting', 'for a reliable grid'],
  body: 'Umuriro connects the three people who restore power: the customer who reports an outage, the coordinator who assigns the right technician, and the technician who fixes it. Every step is visible to everyone who needs to see it.',
  facts: [
    {
      title: 'Location-based',
      body: 'Faults are pinned to a place so coordinators see what is closest to a technician.',
      icon: 'M11 2a6 6 0 016 6c0 5-6 12-6 12S5 13 5 8a6 6 0 016-6zM11 6a2 2 0 100 4 2 2 0 000-4z',
    },
    {
      title: 'One shared status',
      body: 'Reported, assigned, on the way, arrived, working, resolved: the same for all roles.',
      icon: 'M3 11h4l3-7 4 14 3-7h2',
    },
  ],
  callLabel: 'Give us a call',
  imageLabel: 'Built for Rwanda',
};

export const SERVICES = {
  eyebrow: 'Our services',
  title: 'Fault services tailored for you',
  items: [
    {
      title: 'No power outage',
      body: 'A whole street or a single home without electricity.',
      image: 'bulb',
    },
    {
      title: 'Flickering and low voltage',
      body: 'Unstable supply that can damage your appliances.',
      image: 'poles',
    },
    {
      title: 'Fallen or damaged lines',
      body: 'Wires down, leaning poles and damaged insulators.',
      image: 'linemen',
    },
    {
      title: 'Meter and breaker problems',
      body: 'Tripping breakers, faulty meters and board issues.',
      image: 'multimeter',
    },
  ].map((item) => ({ ...item, link: guestReportLink })),
};

export const SAFETY_TIPS = {
  eyebrow: 'Updates and guides',
  title: 'Staying safe and informed',
  items: [
    {
      title: 'What to do during a power outage',
      body: 'Switch off and unplug sensitive appliances, keep the fridge closed, use a torch instead of candles, then report the fault.',
      image: 'socket',
    },
    {
      title: 'Keep away from fallen lines',
      body: 'Treat every fallen or sagging wire as live. Stay well back, keep others away and call 2727 before anything else.',
      image: 'silhouette',
      highlight: true,
    },
    {
      title: 'What to tell the technician',
      body: 'Give the exact place, what you saw or heard, and whether neighbours are also without power. It helps the repair go faster.',
      image: 'panel',
    },
  ],
};

export const FOOTER = {
  ...FOOTER_COPY,
  quickLinks: [
    { label: 'Home', href: '#top' },
    { label: 'About Us', href: '#about' },
    { label: 'Services', href: '#services' },
    { label: 'Dashboards', href: '#roles' },
    { label: 'FAQ', href: '#faq' },
  ],
  services: [
    { label: 'Report a fault', link: guestReportLink },
    { label: 'Fault coordination', link: loginLink(TARGETS.coordinator) },
    { label: 'Technician jobs', link: loginLink(TARGETS.technician) },
    { label: 'Safety guidance', href: '#faq' },
  ],
  // Only REG accounts confirmed on reg.rw belong here. None could be confirmed yet.
  socials: [],
};

const ROLE_LINKS = {
  Customer: loginLink(TARGETS.customerReport),
  'Service coordinator': loginLink(TARGETS.coordinator),
  Technician: loginLink(TARGETS.technician),
};

export const ROLES = {
  ...ROLES_COPY,
  items: ROLES_COPY.items.map((item) => ({ ...item, link: ROLE_LINKS[item.title] })),
};
