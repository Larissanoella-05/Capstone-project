/** The five steps the stepper and the vertical timeline show. The API's WORKING stage folds into ARRIVED. */
export const STEPPER_STEPS = ['REPORTED', 'ASSIGNED', 'ON_THE_WAY', 'ARRIVED', 'RESOLVED'];

/**
 * `current` is the step index, or -1 for a cancelled or unknown status.
 * @param {string} status
 */
export function stepperState(status) {
  const step = status === 'WORKING' ? 'ARRIVED' : status;
  const current = STEPPER_STEPS.indexOf(step);
  return { current, resolved: status === 'RESOLVED' };
}
