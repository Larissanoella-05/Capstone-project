import { isOpen } from './format.js';

const IN_PROGRESS = ['ON_THE_WAY', 'ARRIVED', 'WORKING'];

/** The job the technician should be looking at: one already started, otherwise the oldest assignment. */
export function pickActiveJob(faults) {
  const open = faults.filter(isOpen);
  return (
    open.find((fault) => IN_PROGRESS.includes(fault.status)) ??
    [...open].sort((a, b) => new Date(a.assignedAt) - new Date(b.assignedAt))[0] ??
    null
  );
}
