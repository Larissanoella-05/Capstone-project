import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TechnicianRanker } from '../../src/domain/TechnicianRanker.js';

const ranker = new TechnicianRanker();
const tech = (id, name, availability, distanceKm, jobs = 0) => ({
  id,
  name,
  availability,
  distanceKm,
  activeJobs: Array.from({ length: jobs }, (_, i) => ({ id: i })),
});

describe('TechnicianRanker', () => {
  it('puts available technicians before closer busy or off-duty ones', () => {
    const ranked = ranker.rank([
      tech(1, 'Busy Close', 'ON_JOB', 0.5, 1),
      tech(2, 'Off Closest', 'OFF_DUTY', 0.1),
      tech(3, 'Free Far', 'AVAILABLE', 3.2),
      tech(4, 'Free Near', 'AVAILABLE', 1.1),
    ]);
    assert.deepEqual(
      ranked.map((t) => t.id),
      [4, 3, 1, 2]
    );
  });

  it('marks exactly one recommended technician: the nearest available', () => {
    const ranked = ranker.rank([
      tech(1, 'A', 'AVAILABLE', 2),
      tech(2, 'B', 'AVAILABLE', 1),
      tech(3, 'C', 'ON_JOB', 0.2, 1),
    ]);
    assert.deepEqual(
      ranked.filter((t) => t.recommended).map((t) => t.id),
      [2]
    );
  });

  it('recommends nobody when no one is available', () => {
    const ranked = ranker.rank([tech(1, 'A', 'ON_JOB', 1, 1), tech(2, 'B', 'OFF_DUTY', 0.5)]);
    assert.equal(
      ranked.some((t) => t.recommended),
      false
    );
  });

  it('places technicians with no recorded position after those with one', () => {
    const ranked = ranker.rank([
      tech(1, 'Unknown', 'AVAILABLE', null),
      tech(2, 'Known', 'AVAILABLE', 9.9),
    ]);
    assert.deepEqual(
      ranked.map((t) => t.id),
      [2, 1]
    );
  });

  it('breaks equal distance by workload, then by name', () => {
    const ranked = ranker.rank([
      tech(1, 'Zed', 'ON_JOB', 1, 2),
      tech(2, 'Amy', 'ON_JOB', 1, 1),
      tech(3, 'Bob', 'ON_JOB', 1, 1),
    ]);
    assert.deepEqual(
      ranked.map((t) => t.name),
      ['Amy', 'Bob', 'Zed']
    );
  });

  it('sorts by name only, and recommends nobody, when there is no target fault', () => {
    const ranked = ranker.rank(
      [tech(1, 'Zed', 'AVAILABLE', null), tech(2, 'Amy', 'OFF_DUTY', null)],
      { hasTarget: false }
    );
    assert.deepEqual(
      ranked.map((t) => t.name),
      ['Amy', 'Zed']
    );
    assert.equal(
      ranked.some((t) => t.recommended),
      false
    );
  });

  it('does not modify the input array and handles an empty list', () => {
    const input = [tech(1, 'B', 'ON_JOB', 1), tech(2, 'A', 'AVAILABLE', 2)];
    ranker.rank(input);
    assert.deepEqual(
      input.map((t) => t.id),
      [1, 2]
    );
    assert.deepEqual(ranker.rank([]), []);
  });
});
