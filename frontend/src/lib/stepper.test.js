import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { STAGES } from './format.js';
import { STEPPER_STEPS, stepperState } from './stepper.js';

describe('STEPPER_STEPS', () => {
  it('has the five steps of the design, in order', () => {
    assert.deepEqual(STEPPER_STEPS, ['REPORTED', 'ASSIGNED', 'ON_THE_WAY', 'ARRIVED', 'RESOLVED']);
  });

  it('only uses statuses the API can stamp', () => {
    for (const step of STEPPER_STEPS) assert.ok(STAGES.includes(step), step);
  });
});

describe('stepperState', () => {
  it('marks earlier steps done and the matching step current', () => {
    assert.deepEqual(stepperState('ON_THE_WAY'), { current: 2, resolved: false });
  });

  it('counts working as part of the arrived step', () => {
    assert.deepEqual(stepperState('WORKING'), { current: 3, resolved: false });
  });

  it('marks every step done once resolved', () => {
    assert.deepEqual(stepperState('RESOLVED'), { current: 4, resolved: true });
  });

  it('has no current step for a cancelled or unknown status', () => {
    assert.deepEqual(stepperState('CANCELLED'), { current: -1, resolved: false });
    assert.deepEqual(stepperState('SOMETHING_ELSE'), { current: -1, resolved: false });
  });
});
