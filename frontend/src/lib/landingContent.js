// Copy and link data for the public landing page. Kept out of the components so a test can scan it.
import { loginLink, TARGETS } from './landingLinks.js';

export const HOTLINE = '2727';
export const HOTLINE_HREF = `tel:${HOTLINE}`;
export const HOTLINE_TEXT = `Real fault? Call ${HOTLINE}`;

/** In-page anchors (href) and the dashboards menu (link, goes to sign-in). */
export const NAV_ITEMS = [
  { label: 'Home', href: '#top' },
  { label: 'About', href: '#about' },
  { label: 'How it works', href: '#flow' },
  { label: 'Dashboards', href: '#roles', menu: true },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#cta' },
];

export const DASHBOARD_MENU = [
  { label: 'Customer · Report a fault', link: loginLink(TARGETS.customerReport) },
  { label: 'Coordinator · Assign & monitor', link: loginLink(TARGETS.coordinator) },
  { label: 'Technician · My jobs', link: loginLink(TARGETS.technician) },
];

export const REPORT_LINK = loginLink(TARGETS.customerReport);
export const COORDINATOR_LINK = loginLink(TARGETS.coordinator);

export const HERO = {
  headline: ['Umuriro', 'restores'],
  accentWord: 'power',
  tagline: 'Report a fault. Get a technician. Track it until the lights are back.',
};

export const STEP_CARDS = [
  { title: 'Report the fault in under a minute', icon: 'M13 3L5 14h6l-1 9 8-11h-6z' },
  {
    title: 'Coordinator assigns the nearest technician',
    icon: 'M13 4a4 4 0 100 8 4 4 0 000-8zM5 22c0-4 3.500-6 8-6s8 2 8 6',
    highlight: true,
  },
  { title: 'Track every step with live status', icon: 'M4 13h5l3-7 4 14 3-7h3' },
  { title: 'Closed with a record of the repair', icon: 'M5 13l5 5L21 7' },
];

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
  ].map((item) => ({ ...item, link: loginLink(TARGETS.customerReport) })),
};

export const ROLES = {
  eyebrow: 'One app, three views',
  title: 'Built around the people who restore power',
  items: [
    {
      title: 'Customer',
      body: 'Report and track a fault',
      go: 'Open customer view',
      image: 'poles',
      link: loginLink(TARGETS.customerReport),
    },
    {
      title: 'Service coordinator',
      body: 'Assign technicians and monitor',
      go: 'Open coordinator view',
      image: 'panel',
      highlight: true,
      link: loginLink(TARGETS.coordinator),
    },
    {
      title: 'Technician',
      body: 'See jobs and update status',
      go: 'Open technician view',
      image: 'tower',
      link: loginLink(TARGETS.technician),
    },
  ],
};

export const FAQ = {
  eyebrow: 'Umuriro FAQ',
  title: 'Frequently asked questions',
  items: [
    {
      q: 'How do I report a fault?',
      a: 'Sign in, open the report page, pick the type of fault, confirm your location and send. You get a reference you can use to follow progress.',
    },
    {
      q: 'Who gets my report?',
      a: 'Service coordinators see new reports and assign the most suitable technician.',
    },
    {
      q: 'Can I see where my technician is?',
      a: 'Yes. Your report has a status timeline (reported, assigned, on the way, arrived, working, resolved) and a map of the fault site and the assigned technician. In this pilot the technician position on the web map is simulated.',
    },
    {
      q: 'What if the fault is dangerous?',
      a: 'For fallen lines, sparks or fire, keep away and call 2727 first, then report it here so it is prioritised.',
    },
    {
      q: 'How do technicians get jobs?',
      a: 'Assigned jobs appear in the technician’s list with the location and fault details. They update the status as they work.',
    },
    {
      q: 'Does it work on my phone?',
      a: 'Yes. Customers and technicians can use the web app or the Android app; coordinators use the web dashboard.',
    },
    {
      q: 'Do I need an account?',
      a: 'Yes. Sign in with your account to report a fault, so the report is tied to you and you can follow it.',
    },
    {
      q: 'How do I know it is fixed?',
      a: 'The technician marks the job resolved and you get a notification in the app. The report stays in your list of reports.',
    },
  ],
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

export const CTA = {
  title: ['Secure reliable power for', 'your home and business!'],
  body: 'No more guessing when the lights will return. Sign in to report a fault and follow the repair until power is back.',
  signIn: 'Sign in to report',
  call: `Call ${HOTLINE}`,
};

export const FOOTER = {
  blurb:
    'We believe in a world powered by safe, reliable electricity. Umuriro is dedicated to getting faults reported, assigned and fixed faster.',
  quickLinks: [
    { label: 'Home', href: '#top' },
    { label: 'About Us', href: '#about' },
    { label: 'Services', href: '#services' },
    { label: 'Dashboards', href: '#roles' },
    { label: 'FAQ', href: '#faq' },
  ],
  services: [
    { label: 'Report a fault', link: loginLink(TARGETS.customerReport) },
    { label: 'Fault coordination', link: loginLink(TARGETS.coordinator) },
    { label: 'Technician jobs', link: loginLink(TARGETS.technician) },
    { label: 'Safety guidance', href: '#faq' },
  ],
  contactTitle: 'Electricity provider (REG)',
  contact: [
    { label: `Toll free: ${HOTLINE}`, href: HOTLINE_HREF },
    { label: 'info@reg.rw', href: 'mailto:info@reg.rw' },
    { label: 'KN82 ST3, Nyarugenge, Kigali' },
  ],
  // Only REG accounts confirmed on reg.rw belong here. None could be confirmed yet.
  socials: [],
  copyright: '© 2026 Umuriro. All Rights Reserved.',
  legal: 'Privacy Policy | Terms of Service',
};
