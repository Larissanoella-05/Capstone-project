import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isLate, waitingMinutes, waitingText, workQueue } from './workQueue.js';

const NOW = new Date('2026-11-06T10:00:00Z').getTime();
const at = (minutesAgo) => new Date(NOW - minutesAgo * 60000).toISOString();
const fault = (id, status, minutesAgo) => ({ id, status, reportedAt: at(minutesAgo) });

describe('waitingMinutes', () => {
  it('counts whole minutes for a report nobody has picked up', () => {
    assert.equal(waitingMinutes(fault(1, 'REPORTED', 12), NOW), 12);
    assert.equal(waitingMinutes({ status: 'REPORTED', reportedAt: at(0.5) }, NOW), 0);
  });

  it('is null once a technician is assigned', () => {
    for (const status of ['ASSIGNED', 'ON_THE_WAY', 'WORKING', 'RESOLVED']) {
      assert.equal(waitingMinutes(fault(1, status, 30), NOW), null);
    }
  });

  it('never goes negative when the clocks differ a little', () => {
    assert.equal(waitingMinutes({ status: 'REPORTED', reportedAt: at(-2) }, NOW), 0);
  });
});

describe('waitingText', () => {
  it('writes minutes, then hours and minutes', () => {
    assert.equal(waitingText(0), '0 min');
    assert.equal(waitingText(59), '59 min');
    assert.equal(waitingText(60), '1 h');
    assert.equal(waitingText(125), '2 h 5 min');
  });
});

describe('isLate', () => {
  it('is late from 15 minutes, and never for an assigned report', () => {
    assert.equal(isLate(14), false);
    assert.equal(isLate(15), true);
    assert.equal(isLate(null), false);
  });
});

describe('workQueue', () => {
  it('puts unassigned reports first, longest-waiting first, then the rest newest first', () => {
    const queue = workQueue([
      fault(1, 'ASSIGNED', 50),
      fault(2, 'REPORTED', 5),
      fault(3, 'WORKING', 10),
      fault(4, 'REPORTED', 40),
    ]);
    assert.deepEqual(
      queue.map((item) => item.id),
      [4, 2, 3, 1]
    );
  });

  it('does not change the list it was given', () => {
    const list = [fault(1, 'REPORTED', 5), fault(2, 'REPORTED', 9)];
    workQueue(list);
    assert.deepEqual(
      list.map((item) => item.id),
      [1, 2]
    );
  });
});
