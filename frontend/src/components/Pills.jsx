import { PRIORITY_LABEL, STATUS_LABEL } from '../lib/format.js';
import {
  AVAILABILITY_TONE,
  PRIORITY_TONE,
  STATUS_TONE,
  UNASSIGNED_TONE,
} from '../lib/statusTone.js';

const OUTLINE = { bg: '#ffffff', fg: '#0b0b0c' };

export function StatusTag({ tone = OUTLINE, children }) {
  return (
    <span className="pill" style={{ backgroundColor: tone.bg, color: tone.fg }}>
      {children}
    </span>
  );
}

/** `audience="coordinator"` shows a reported fault as "Unassigned" in the accent colour. */
export function StatusPill({ status, audience }) {
  const unassigned = status === 'REPORTED' && audience === 'coordinator';
  const label = unassigned ? 'Unassigned' : (STATUS_LABEL[status] ?? status);
  return (
    <StatusTag tone={unassigned ? UNASSIGNED_TONE : (STATUS_TONE[status] ?? OUTLINE)}>
      {label}
    </StatusTag>
  );
}

export function PriorityPill({ priority, withLabel = false }) {
  return (
    <StatusTag tone={PRIORITY_TONE[priority] ?? OUTLINE}>
      {withLabel ? 'Priority: ' : ''}
      {PRIORITY_LABEL[priority] ?? priority}
    </StatusTag>
  );
}

const AVAILABILITY_LABEL = {
  AVAILABLE: 'Available',
  ON_JOB: 'On a job',
  OFF_DUTY: 'Off duty',
};

export function AvailabilityPill({ availability }) {
  const key = AVAILABILITY_LABEL[availability] ? availability : 'OFF_DUTY';
  return <StatusTag tone={AVAILABILITY_TONE[key]}>{AVAILABILITY_LABEL[key]}</StatusTag>;
}

/** Marks a report that came in without an account. */
export function GuestTag() {
  return <StatusTag>Guest</StatusTag>;
}
