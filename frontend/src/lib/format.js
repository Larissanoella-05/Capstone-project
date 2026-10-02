// Labels and formatting shared by every screen, so the three roles always use the same words.

export const STAGES = ['REPORTED', 'ASSIGNED', 'ON_THE_WAY', 'ARRIVED', 'WORKING', 'RESOLVED'];
export const OPEN_STATUSES = ['REPORTED', 'ASSIGNED', 'ON_THE_WAY', 'ARRIVED', 'WORKING'];

export const STATUS_LABEL = {
  REPORTED: 'Reported',
  ASSIGNED: 'Assigned',
  ON_THE_WAY: 'On the Way',
  ARRIVED: 'Arrived',
  WORKING: 'Working',
  RESOLVED: 'Resolved',
  CANCELLED: 'Cancelled',
};

export const STATUS_TIME_FIELD = {
  REPORTED: 'reportedAt',
  ASSIGNED: 'assignedAt',
  ON_THE_WAY: 'onTheWayAt',
  ARRIVED: 'arrivedAt',
  WORKING: 'workingAt',
  RESOLVED: 'resolvedAt',
};

/** What the customer reads at the top of their screen for each status. */
export const CUSTOMER_HEADLINE = {
  REPORTED: 'Waiting for a technician',
  ASSIGNED: 'Technician assigned',
  ON_THE_WAY: 'Technician on the way',
  ARRIVED: 'Technician has arrived',
  WORKING: 'Technician is working',
  RESOLVED: 'Fault resolved',
  CANCELLED: 'Report cancelled',
};

export const CUSTOMER_TIMELINE_LABEL = {
  REPORTED: 'Fault Reported',
  ASSIGNED: 'Technician Assigned',
  ON_THE_WAY: 'Technician On the Way',
  ARRIVED: 'Technician Arrived',
  WORKING: 'Work in Progress',
  RESOLVED: 'Fault Resolved',
};

export const CATEGORIES = [
  { value: 'POWER_OUTAGE', label: 'Power outage', hint: 'No electricity at the premises' },
  { value: 'LOW_VOLTAGE', label: 'Low voltage', hint: 'Dim lights, appliances not running properly' },
  { value: 'DAMAGED_CONNECTION', label: 'Damaged connection', hint: 'Fallen, sparking or exposed service wire' },
  { value: 'METER_ISSUE', label: 'Meter issue', hint: 'Meter blank, not loading or showing an error' },
  { value: 'OTHER', label: 'Other', hint: 'Anything not listed above' },
];
export const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
export const PRIORITY_LABEL = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', CRITICAL: 'Critical' };

export const OUTCOMES = [
  { value: 'SUPPLY_RESTORED', label: 'Supply restored' },
  { value: 'TEMPORARY_REPAIR', label: 'Temporary repair made' },
  { value: 'NO_FAULT_FOUND', label: 'No fault found' },
  { value: 'REFERRED', label: 'Referred for further work' },
];
export const OUTCOME_LABEL = Object.fromEntries(OUTCOMES.map((o) => [o.value, o.label]));

export const isOpen = (fault) => OPEN_STATUSES.includes(fault.status);

export function locationLine(location) {
  if (!location) return '—';
  return `${location.cell} Cell, ${location.sector} Sector`;
}

export function fmtTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function fmtDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return `Today, ${fmtTime(date)}`;
  const day = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${day}, ${fmtTime(date)}`;
}

export function fmtDate(value = new Date()) {
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function timeAgo(value) {
  if (!value) return '—';
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}

export function minutesBetween(from, to) {
  if (!from || !to) return null;
  return Math.max(0, Math.round((new Date(to) - new Date(from)) / 60000));
}

export const fmtMinutes = (value) => (value === null || value === undefined ? '—' : `${value} min`);
export const fmtKm = (value) => (value === null || value === undefined ? '—' : `${value.toFixed(1)} km`);
export const firstNames = (name = '') => name.split(' ').slice(0, name.startsWith('Jean') ? 2 : 1).join(' ');

export function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
