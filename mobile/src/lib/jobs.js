import { isOpen } from './format.js';
import { reporterName, reporterPhone } from './guestReport.js';

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

/** Who to show and call on a job. A guest report has no customer record and may have no service location. */
export function customerSummary(fault) {
  return {
    name: reporterName(fault),
    phone: reporterPhone(fault),
    meter: fault.serviceLocation?.meterNumber ?? null,
  };
}
