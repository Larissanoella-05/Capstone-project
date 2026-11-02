import { PRIORITY_LABEL, STATUS_LABEL } from '../lib/format.js';

const TONE = {
  yellow: 'bg-yellow text-ink border-yellow',
  green: 'bg-green text-white border-green',
  red: 'bg-red text-white border-red',
  ink: 'bg-ink text-white border-ink',
  grey: 'bg-line text-ink border-line',
  outline: 'bg-white text-ink border-ink',
  redOutline: 'bg-white text-red border-red',
};

/** The small rounded-rectangle tag used for statuses, priorities and availability. */
export function StatusTag({ tone = 'outline', children }) {
  return <span className={`pill ${TONE[tone]}`}>{children}</span>;
}

const STATUS_TONE = {
  REPORTED: 'outline',
  ASSIGNED: 'yellow',
  ON_THE_WAY: 'yellow',
  ARRIVED: 'ink',
  WORKING: 'yellow',
  RESOLVED: 'green',
  CANCELLED: 'redOutline',
};

/**
 * `audience="coordinator"` shows a reported fault as "Unassigned" in red,
 * which is what it means to the person who has to assign it.
 */
export function StatusPill({ status, audience }) {
  const unassigned = status === 'REPORTED' && audience === 'coordinator';
  const label = unassigned ? 'Unassigned' : (STATUS_LABEL[status] ?? status);
  return (
    <StatusTag tone={unassigned ? 'red' : (STATUS_TONE[status] ?? 'outline')}>{label}</StatusTag>
  );
}

const PRIORITY_TONE = {
  CRITICAL: 'red',
  HIGH: 'ink',
  MEDIUM: 'yellow',
  LOW: 'grey',
};

export function PriorityPill({ priority, withLabel = false }) {
  return (
    <StatusTag tone={PRIORITY_TONE[priority] ?? 'outline'}>
      {withLabel ? 'Priority: ' : ''}
      {PRIORITY_LABEL[priority] ?? priority}
    </StatusTag>
  );
}

const AVAILABILITY = {
  AVAILABLE: { label: 'Available', tone: 'green' },
  ON_JOB: { label: 'On a job', tone: 'ink' },
  OFF_DUTY: { label: 'Off duty', tone: 'grey' },
};

export function AvailabilityPill({ availability }) {
  const item = AVAILABILITY[availability] ?? AVAILABILITY.OFF_DUTY;
  return <StatusTag tone={item.tone}>{item.label}</StatusTag>;
}
