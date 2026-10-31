import { pickActiveJob } from './jobs.js';

const job = (id, status, assignedAt) => ({ id, status, assignedAt });

describe('pickActiveJob', () => {
  it('returns null when there are no jobs or none are open', () => {
    expect(pickActiveJob([])).toBeNull();
    expect(pickActiveJob([job(1, 'RESOLVED', '2026-10-28T08:00:00Z')])).toBeNull();
  });

  it('prefers a job already in progress over an older assignment', () => {
    const picked = pickActiveJob([
      job(1, 'ASSIGNED', '2026-10-28T07:00:00Z'),
      job(2, 'WORKING', '2026-10-28T09:00:00Z'),
    ]);
    expect(picked.id).toBe(2);
  });

  it('otherwise picks the oldest assignment', () => {
    const picked = pickActiveJob([
      job(1, 'ASSIGNED', '2026-10-28T09:00:00Z'),
      job(2, 'ASSIGNED', '2026-10-28T07:00:00Z'),
    ]);
    expect(picked.id).toBe(2);
  });

  it('ignores resolved and cancelled jobs', () => {
    const picked = pickActiveJob([
      job(1, 'CANCELLED', '2026-10-28T06:00:00Z'),
      job(2, 'ASSIGNED', '2026-10-28T09:00:00Z'),
    ]);
    expect(picked.id).toBe(2);
  });
});
