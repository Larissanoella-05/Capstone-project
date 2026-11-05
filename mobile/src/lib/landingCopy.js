// Landing copy with no links, shared with the Android app; router links stay in landingContent.js.

export const HOTLINE = '2727';
const HOTLINE_HREF = `tel:${HOTLINE}`;

export const HERO = {
  headline: ['Umuriro', 'restores'],
  accentWord: 'power',
  tagline: 'Report a fault. Get a technician. Track it until the lights are back.',
  report: 'Report a fault',
  coordinator: 'Open coordinator view',
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

export const ROLES_COPY = {
  eyebrow: 'One app, three views',
  title: 'Built around the people who restore power',
  items: [
    {
      title: 'Customer',
      body: 'Report and track a fault',
      go: 'Open customer view',
      image: 'poles',
    },
    {
      title: 'Service coordinator',
      body: 'Assign technicians and monitor',
      go: 'Open coordinator view',
      image: 'panel',
      highlight: true,
    },
    {
      title: 'Technician',
      body: 'See jobs and update status',
      go: 'Open technician view',
      image: 'tower',
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

export const CTA = {
  title: ['Secure reliable power for', 'your home and business!'],
  body: 'No more guessing when the lights will return. Sign in to report a fault and follow the repair until power is back.',
  signIn: 'Sign in to report',
  call: `Call ${HOTLINE}`,
};

/** The footer text that is the same on the web and in the Android app. */
export const FOOTER_COPY = {
  blurb:
    'We believe in a world powered by safe, reliable electricity. Umuriro is dedicated to getting faults reported, assigned and fixed faster.',
  contactTitle: 'Electricity provider (REG)',
  contact: [
    { label: `Toll free: ${HOTLINE}`, href: HOTLINE_HREF },
    { label: 'info@reg.rw', href: 'mailto:info@reg.rw' },
    { label: 'KN82 ST3, Nyarugenge, Kigali' },
  ],
  copyright: '© 2026 Umuriro. All Rights Reserved.',
  legal: 'Privacy Policy | Terms of Service',
};
