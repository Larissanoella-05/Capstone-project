// Copy and link data for the public landing page. Kept out of the components so a test can scan it.
import { loginLink, TARGETS } from './landingLinks.js';
import { CTA, FAQ, HERO, HOTLINE, ROLES_COPY, STEP_CARDS } from './landingCopy.js';

export { CTA, FAQ, HERO, HOTLINE, STEP_CARDS };
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

const ROLE_LINKS = {
  Customer: loginLink(TARGETS.customerReport),
  'Service coordinator': loginLink(TARGETS.coordinator),
  Technician: loginLink(TARGETS.technician),
};

export const ROLES = {
  ...ROLES_COPY,
  items: ROLES_COPY.items.map((item) => ({ ...item, link: ROLE_LINKS[item.title] })),
};
