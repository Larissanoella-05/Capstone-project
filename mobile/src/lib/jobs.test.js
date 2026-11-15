import { customerSummary, pickActiveJob } from './jobs.js';

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

describe('customerSummary', () => {
  it('uses the registered customer, the contact phone and the meter number', () => {
    const fault = {
      customer: { name: 'Aline Uwase', phone: '+250781000001' },
      contactPhone: null,
      serviceLocation: { meterNumber: '01234567890' },
    };
    expect(customerSummary(fault)).toEqual({
      name: 'Aline Uwase',
      phone: '+250781000001',
      meter: '01234567890',
    });
  });

  it('does not throw for a guest report, which has no customer record', () => {
    const fault = {
      customer: null,
      contactPhone: '+250788000002',
      serviceLocation: { meterNumber: null },
    };
    expect(customerSummary(fault)).toEqual({
      name: 'Guest reporter',
      phone: '+250788000002',
      meter: null,
    });
  });

  it('copes with a guest report that has no phone and no service location', () => {
    expect(customerSummary({ customer: null, contactPhone: null, serviceLocation: null })).toEqual({
      name: 'Guest reporter',
      phone: '',
      meter: null,
    });
  });
});
