// Unit tests for the shared labels and formatting helpers. Run with: npm test
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CATEGORY_LABEL,
  STAGES,
  STATUS_LABEL,
  firstNames,
  fmtKm,
  fmtMinutes,
  isOpen,
  locationLine,
  minutesBetween,
  timeAgo,
} from './format.js';

describe('format helpers', () => {
  it('has a label for every stage and category', () => {
    for (const stage of [...STAGES, 'CANCELLED']) assert.ok(STATUS_LABEL[stage], stage);
    for (const category of [
      'POWER_OUTAGE',
      'LOW_VOLTAGE',
      'DAMAGED_CONNECTION',
      'METER_ISSUE',
      'OTHER',
    ]) {
      assert.ok(CATEGORY_LABEL[category], category);
    }
  });

  it('treats resolved and cancelled faults as closed', () => {
    assert.equal(isOpen({ status: 'WORKING' }), true);
    assert.equal(isOpen({ status: 'RESOLVED' }), false);
    assert.equal(isOpen({ status: 'CANCELLED' }), false);
  });

  it('formats distances and durations, with a dash for missing values', () => {
    assert.equal(fmtKm(1.25), '1.3 km');
    assert.equal(fmtKm(0), '0.0 km');
    assert.equal(fmtKm(null), '—');
    assert.equal(fmtMinutes(12), '12 min');
    assert.equal(fmtMinutes(undefined), '—');
  });

  it('computes whole minutes between two times and never goes negative', () => {
    assert.equal(minutesBetween('2026-10-20T10:00:00Z', '2026-10-20T10:31:00Z'), 31);
    assert.equal(minutesBetween('2026-10-20T10:31:00Z', '2026-10-20T10:00:00Z'), 0);
    assert.equal(minutesBetween(null, '2026-10-20T10:00:00Z'), null);
  });

  it('describes recent times in words', () => {
    const ago = (seconds) => new Date(Date.now() - seconds * 1000).toISOString();
    assert.equal(timeAgo(ago(10)), 'just now');
    assert.equal(timeAgo(ago(5 * 60)), '5 min ago');
    assert.equal(timeAgo(ago(60 * 60)), '1 hour ago');
    assert.equal(timeAgo(ago(3 * 24 * 60 * 60)), '3 days ago');
    assert.equal(timeAgo(null), '—');
  });

  it('keeps compound first names such as "Jean Claude"', () => {
    assert.equal(firstNames('Jean Claude Habimana'), 'Jean Claude');
    assert.equal(firstNames('Patrick Nshimiyimana'), 'Patrick');
  });

  it('builds a readable location line', () => {
    assert.equal(locationLine({ cell: 'Kibenga', sector: 'Ndera' }), 'Kibenga Cell, Ndera Sector');
    assert.equal(locationLine(null), '—');
  });
});
