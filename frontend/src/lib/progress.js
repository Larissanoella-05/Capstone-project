/** One plain sentence about what happens after each status, for the customer. */
const NEXT_STEP = {
  REPORTED: 'A coordinator will assign a technician to your report.',
  ASSIGNED: 'The technician will set off soon. You get an alert when they do.',
  ON_THE_WAY: 'The technician is travelling to your location. Follow them on the map.',
  ARRIVED: 'The technician is at your location and will start work.',
  WORKING: 'The technician is working on the fault. You get an alert when it is fixed.',
  RESOLVED: 'Nothing more to do. If the power is still off, report it again.',
  CANCELLED: 'This report was cancelled. If you still have a problem, report it again.',
};

/** What happens next for a fault in this status, or an empty string for an unknown status. */
export const nextStepFor = (status) => NEXT_STEP[status] ?? '';

/**
 * "Checked 2:05 PM" for the last time a screen asked the server, or an empty string before the first answer.
 * @param {number | null | undefined} fetchedAt a Date.now() value
 */
export function checkedLabel(fetchedAt) {
  if (!fetchedAt) return '';
  const time = new Date(fetchedAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `Checked ${time}`;
}
