// Chip colours for statuses, priorities and availability.

/** Each tone is a background and a text colour. */
const GREEN = { bg: '#e3f3e8', fg: '#17623a' };
const BLUE = { bg: '#dcebff', fg: '#10345f' };
const AMBER = { bg: '#fff0c2', fg: '#6b4a00' };
const NEUTRAL = { bg: '#ece9e0', fg: '#3b3b38' };
const RED_SOFT = { bg: '#ffe0dc', fg: '#8a1c12' };
const ACCENT = { bg: '#e30613', fg: '#ffffff' };

export const STATUS_TONE = {
  REPORTED: NEUTRAL,
  ASSIGNED: AMBER,
  ON_THE_WAY: BLUE,
  ARRIVED: BLUE,
  WORKING: BLUE,
  RESOLVED: GREEN,
  CANCELLED: RED_SOFT,
};

/** A reported fault as the coordinator sees it: nobody is assigned yet. */
export const UNASSIGNED_TONE = ACCENT;

export const PRIORITY_TONE = {
  CRITICAL: ACCENT,
  HIGH: RED_SOFT,
  MEDIUM: AMBER,
  LOW: NEUTRAL,
};

export const AVAILABILITY_TONE = {
  AVAILABLE: GREEN,
  ON_JOB: AMBER,
  OFF_DUTY: NEUTRAL,
};
