import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PRIORITIES, STATUS_LABEL } from './format.js';
import { AVAILABILITY_TONE, PRIORITY_TONE, STATUS_TONE, UNASSIGNED_TONE } from './statusTone.js';

const HEX = /^#[0-9a-f]{6}$/i;

function assertTone(tone, name) {
  assert.ok(tone, `${name} has no tone`);
  assert.match(tone.bg, HEX, `${name} bg`);
  assert.match(tone.fg, HEX, `${name} fg`);
}

describe('statusTone', () => {
  it('has a tone for every status', () => {
    assert.deepEqual(Object.keys(STATUS_TONE).sort(), Object.keys(STATUS_LABEL).sort());
    for (const status of Object.keys(STATUS_LABEL)) assertTone(STATUS_TONE[status], status);
  });

  it('has a tone for every priority', () => {
    assert.deepEqual(Object.keys(PRIORITY_TONE).sort(), [...PRIORITIES].sort());
    for (const priority of PRIORITIES) assertTone(PRIORITY_TONE[priority], priority);
  });

  it('has a tone for every availability and for an unassigned fault', () => {
    for (const key of ['AVAILABLE', 'ON_JOB', 'OFF_DUTY']) assertTone(AVAILABILITY_TONE[key], key);
    assertTone(UNASSIGNED_TONE, 'unassigned');
  });

  it('uses the artifact colours for the four phone chips', () => {
    assert.deepEqual(STATUS_TONE.RESOLVED, { bg: '#e3f3e8', fg: '#17623a' });
    assert.deepEqual(STATUS_TONE.ON_THE_WAY, { bg: '#dcebff', fg: '#10345f' });
    assert.deepEqual(STATUS_TONE.ASSIGNED, { bg: '#fff0c2', fg: '#6b4a00' });
    assert.deepEqual(STATUS_TONE.REPORTED, { bg: '#ece9e0', fg: '#3b3b38' });
  });
});
