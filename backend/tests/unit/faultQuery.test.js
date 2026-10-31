import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildFaultFilter, scopeFor } from '../../src/services/faultQuery.js';
import { OPEN_STATUSES } from '../../src/utils/constants.js';

const customer = { role: 'CUSTOMER', customer: { id: 3 } };
const technician = { role: 'TECHNICIAN', technician: { id: 8 } };
const coordinator = { role: 'COORDINATOR' };

describe('scopeFor', () => {
  it('limits a customer to their own faults', () => {
    assert.deepEqual(scopeFor(customer), { customerId: 3 });
  });

  it('limits a technician to faults assigned to them', () => {
    assert.deepEqual(scopeFor(technician), { technicianId: 8 });
  });

  it('lets a coordinator see everything', () => {
    assert.deepEqual(scopeFor(coordinator), {});
  });
});

/** The `reportedAt` lower bound a date filter produces. */
const lowerBound = (date) =>
  /** @type {{ gte: Date }} */ (buildFaultFilter(coordinator, { date }).reportedAt).gte;

describe('buildFaultFilter', () => {
  it('applies the role scope even with no filters', () => {
    assert.deepEqual(buildFaultFilter(customer), { customerId: 3 });
  });

  it('maps OPEN to the open statuses and ALL to no status filter', () => {
    assert.deepEqual(buildFaultFilter(coordinator, { status: 'OPEN' }).status, {
      in: OPEN_STATUSES,
    });
    assert.equal('status' in buildFaultFilter(coordinator, { status: 'ALL' }), false);
  });

  it('filters by one exact status', () => {
    assert.equal(buildFaultFilter(coordinator, { status: 'RESOLVED' }).status, 'RESOLVED');
  });

  it('filters by priority unless it is ALL', () => {
    assert.equal(buildFaultFilter(coordinator, { priority: 'HIGH' }).priority, 'HIGH');
    assert.equal('priority' in buildFaultFilter(coordinator, { priority: 'ALL' }), false);
  });

  it('TODAY starts at midnight, WEEK starts seven days ago', () => {
    const today = lowerBound('TODAY');
    assert.equal(today.getHours(), 0);
    assert.equal(today.getMinutes(), 0);
    const week = lowerBound('WEEK');
    const days = (Date.now() - week.getTime()) / 86400000;
    assert.ok(days > 6.99 && days < 7.01, `got ${days}`);
  });

  it('searches reference, description, place, customer and technician names', () => {
    const { OR } = buildFaultFilter(coordinator, { search: 'kibenga' });
    assert.equal(OR.length, 6);
    assert.deepEqual(OR[0], { reference: { contains: 'kibenga', mode: 'insensitive' } });
  });

  it('also matches a category whose label contains the search text', () => {
    const { OR } = buildFaultFilter(coordinator, { search: 'power' });
    assert.deepEqual(OR.at(-1), { category: { in: ['POWER_OUTAGE'] } });
  });

  it('ignores a blank or non-text search', () => {
    assert.equal('OR' in buildFaultFilter(coordinator, { search: '   ' }), false);
    assert.equal('OR' in buildFaultFilter(coordinator, { search: 42 }), false);
  });

  it('keeps the role scope when other filters are added', () => {
    const where = buildFaultFilter(technician, { status: 'OPEN', priority: 'LOW' });
    assert.equal(where.technicianId, 8);
  });
});
