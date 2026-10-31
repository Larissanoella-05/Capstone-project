import { PRIORITY_LABEL, STATUS_LABEL } from '../lib/format.js';

const STATUS_STYLE = {
  REPORTED: 'bg-danger text-white border-danger',
  ASSIGNED: 'bg-ink text-white border-ink',
  ON_THE_WAY: 'bg-volt text-ink border-ink',
  ARRIVED: 'bg-white text-ink border-ink',
  WORKING: 'bg-warn text-white border-warn',
  RESOLVED: 'bg-ok text-white border-ok',
  CANCELLED: 'bg-white text-muted border-line',
};

/**
 * `audience="coordinator"` shows a reported fault as "Unassigned",
 * which is what it means to the person who has to assign it.
 */
export function StatusPill({ status, audience }) {
  const label =
    status === 'REPORTED' && audience === 'coordinator'
      ? 'Unassigned'
      : (STATUS_LABEL[status] ?? status);
  return <span className={`pill ${STATUS_STYLE[status] ?? ''}`}>{label}</span>;
}

const PRIORITY_STYLE = {
  CRITICAL: 'bg-danger text-white border-danger',
  HIGH: 'bg-warn text-white border-warn',
  MEDIUM: 'bg-white text-ink border-ink',
  LOW: 'bg-white text-muted border-line',
};

export function PriorityPill({ priority, withLabel = false }) {
  return (
    <span className={`pill ${PRIORITY_STYLE[priority] ?? ''}`}>
      {withLabel ? 'Priority: ' : ''}
      {PRIORITY_LABEL[priority] ?? priority}
    </span>
  );
}

const AVAILABILITY = {
  AVAILABLE: { label: 'Available', style: 'bg-ok text-white border-ok' },
  ON_JOB: { label: 'On a job', style: 'bg-ink text-white border-ink' },
  OFF_DUTY: { label: 'Off duty', style: 'bg-white text-muted border-line' },
};

export function AvailabilityPill({ availability }) {
  const item = AVAILABILITY[availability] ?? AVAILABILITY.OFF_DUTY;
  return <span className={`pill ${item.style}`}>{item.label}</span>;
}
