import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  LOAD_REFERENCE_PREFIX,
  buildLoadFaults,
  historyFor,
  seededRandom,
} from '../performance/loadData.js';
import { parseCount } from '../performance/seedLoadData.js';

const now = new Date('2026-11-01T12:00:00Z');
const options = {
  count: 500,
  customers: [
    { id: 1, serviceLocationId: 11 },
    { id: 2, serviceLocationId: 12 },
  ],
  technicianIds: [5, 6, 7],
  coordinatorId: 9,
  now,
};

describe('seededRandom', () => {
  it('gives the same sequence for the same seed and a different one for another seed', () => {
    const a = seededRandom(1);
    const b = seededRandom(1);
    const c = seededRandom(2);
    const first = [a(), a(), a()];
    assert.deepEqual(first, [b(), b(), b()]);
    assert.notDeepEqual(first, [c(), c(), c()]);
  });

  it('stays within [0, 1)', () => {
    const random = seededRandom(42);
    for (let i = 0; i < 1000; i += 1) {
      const value = random();
      assert.ok(value >= 0 && value < 1);
    }
  });
});

describe('buildLoadFaults', () => {
  const faults = buildLoadFaults(options);

  it('builds the number asked for, with unique references that carry the load-test prefix', () => {
    assert.equal(faults.length, 500);
    assert.equal(new Set(faults.map((f) => f.reference)).size, 500);
    assert.ok(faults.every((f) => f.reference.startsWith(LOAD_REFERENCE_PREFIX)));
  });

  it('is repeatable: the same inputs give the same faults', () => {
    assert.deepEqual(buildLoadFaults(options), faults);
  });

  it("spreads faults over the customers and uses each customer's own service location", () => {
    for (const fault of faults) {
      const customer = options.customers.find((c) => c.id === fault.customerId);
      assert.equal(fault.serviceLocationId, customer?.serviceLocationId);
    }
    assert.equal(new Set(faults.map((f) => f.customerId)).size, 2);
  });

  it('covers every status, mostly resolved', () => {
    const statuses = new Set(faults.map((f) => String(f.status)));
    for (const status of [
      'RESOLVED',
      'CANCELLED',
      'REPORTED',
      'ASSIGNED',
      'ON_THE_WAY',
      'ARRIVED',
      'WORKING',
    ]) {
      assert.ok(statuses.has(status), status);
    }
    assert.ok(faults.filter((f) => f.status === 'RESOLVED').length > faults.length / 2);
  });

  it("keeps each fault's times in order and never in the future", () => {
    for (const fault of faults) {
      const times = [
        fault.reportedAt,
        fault.assignedAt,
        fault.onTheWayAt,
        fault.arrivedAt,
        fault.workingAt,
        fault.resolvedAt,
      ].filter((time) => time !== null);
      for (let i = 1; i < times.length; i += 1) {
        assert.ok(times[i] >= times[i - 1], fault.reference);
      }
      assert.ok(
        times.every((time) => time <= now),
        fault.reference
      );
    }
  });

  it('only fills the fields that match the status', () => {
    for (const fault of faults) {
      assert.equal(fault.resolvedAt !== null, fault.status === 'RESOLVED', fault.reference);
      assert.equal(fault.outcome !== null, fault.status === 'RESOLVED', fault.reference);
      assert.equal(fault.cancelledAt !== null, fault.status === 'CANCELLED', fault.reference);
      assert.equal(fault.arrivalDistanceM !== null, fault.arrivedAt !== null, fault.reference);
      if (fault.status === 'REPORTED') assert.equal(fault.technicianId, null, fault.reference);
      if (['ON_THE_WAY', 'ARRIVED', 'WORKING', 'RESOLVED'].includes(fault.status)) {
        assert.ok(options.technicianIds.includes(fault.technicianId), fault.reference);
        assert.equal(fault.assignedById, 9, fault.reference);
      }
    }
  });

  it('refuses to build with no customers or no technicians', () => {
    assert.throws(() => buildLoadFaults({ ...options, customers: [] }), /customer/i);
    assert.throws(() => buildLoadFaults({ ...options, technicianIds: [] }), /technician/i);
  });
});

describe('historyFor', () => {
  const sample = buildLoadFaults({ ...options, count: 200 });

  it('has one row per stage the fault reached, at the time it reached it', () => {
    const fault = sample.find((f) => f.status === 'RESOLVED');
    assert.ok(fault);
    const rows = historyFor(fault, 77);
    assert.deepEqual(
      rows.map((row) => row.status),
      ['REPORTED', 'ASSIGNED', 'ON_THE_WAY', 'ARRIVED', 'WORKING', 'RESOLVED']
    );
    assert.ok(rows.every((row) => row.faultId === 77));
    assert.equal(rows.at(-1)?.createdAt, fault.resolvedAt);
  });

  it('ends a cancelled fault with CANCELLED', () => {
    const fault = sample.find((f) => f.status === 'CANCELLED');
    assert.ok(fault);
    assert.equal(historyFor(fault, 1).at(-1)?.status, 'CANCELLED');
  });
});

describe('parseCount', () => {
  it('defaults to 2,000', () => {
    assert.equal(parseCount(undefined), 2000);
  });

  it('accepts a whole number up to 20,000', () => {
    assert.equal(parseCount('5000'), 5000);
    assert.equal(parseCount('20000'), 20000);
  });

  it('rejects zero, negatives, fractions, text and anything over 20,000', () => {
    for (const bad of ['0', '-5', '1.5', 'many', '20001']) {
      assert.throws(() => parseCount(bad), /whole number/, bad);
    }
  });
});
