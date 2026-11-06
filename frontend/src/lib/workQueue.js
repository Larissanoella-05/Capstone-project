/** Minutes after which a report nobody has picked up is shown as late. */
export const LATE_AFTER_MINUTES = 15;

/** Whole minutes a report has been waiting for a technician, or null once one is assigned. */
export function waitingMinutes(fault, now) {
  if (fault.status !== 'REPORTED') return null;
  return Math.max(0, Math.floor((now - new Date(fault.reportedAt).getTime()) / 60000));
}

/** "12 min", "2 h 5 min" */
export function waitingText(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export const isLate = (minutes) => minutes !== null && minutes >= LATE_AFTER_MINUTES;

/** What the coordinator should do first: unassigned reports, longest-waiting first, then the rest, newest first. */
export function workQueue(faults) {
  const time = (fault) => new Date(fault.reportedAt).getTime();
  const unassigned = faults.filter((fault) => fault.status === 'REPORTED');
  const rest = faults.filter((fault) => fault.status !== 'REPORTED');
  return [
    ...unassigned.sort((a, b) => time(a) - time(b)),
    ...rest.sort((a, b) => time(b) - time(a)),
  ];
}
