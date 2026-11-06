import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  TRACKING_LINK_DAYS,
  isTrackingTokenShape,
  newTrackingToken,
  trackingLinkExpired,
} from '../../src/domain/trackingLink.js';

const DAY = 24 * 60 * 60 * 1000;
const now = new Date('2026-11-20T12:00:00Z');

describe('trackingLinkExpired', () => {
  it('lasts 7 days after the report is closed', () => {
    assert.equal(TRACKING_LINK_DAYS, 7);
  });

  it('never expires while the report is open', () => {
    const fault = { status: 'ASSIGNED', resolvedAt: null, cancelledAt: null };
    assert.equal(trackingLinkExpired(fault, now), false);
  });

  it('still works six days after the report was resolved', () => {
    const fault = {
      status: 'RESOLVED',
      resolvedAt: new Date(now.getTime() - 6 * DAY),
      cancelledAt: null,
    };
    assert.equal(trackingLinkExpired(fault, now), false);
  });

  it('stops working eight days after the report was resolved', () => {
    const fault = {
      status: 'RESOLVED',
      resolvedAt: new Date(now.getTime() - 8 * DAY),
      cancelledAt: null,
    };
    assert.equal(trackingLinkExpired(fault, now), true);
  });

  it('counts from the cancellation time for a cancelled report', () => {
    const fault = {
      status: 'CANCELLED',
      resolvedAt: null,
      cancelledAt: new Date(now.getTime() - 8 * DAY),
    };
    assert.equal(trackingLinkExpired(fault, now), true);
  });

  it('does not expire a closed report that has no closing time recorded', () => {
    assert.equal(
      trackingLinkExpired({ status: 'RESOLVED', resolvedAt: null, cancelledAt: null }, now),
      false
    );
  });
});

describe('tracking tokens', () => {
  it('are 32 URL-safe characters and different every time', () => {
    const first = newTrackingToken();
    const second = newTrackingToken();
    assert.match(first, /^[A-Za-z0-9_-]{32}$/);
    assert.notEqual(first, second);
  });

  it('are recognised by shape before the database is asked', () => {
    assert.equal(isTrackingTokenShape(newTrackingToken()), true);
    for (const bad of [
      '',
      'abc',
      'x'.repeat(31),
      'x'.repeat(33),
      `${'x'.repeat(31)}!`,
      undefined,
    ]) {
      assert.equal(isTrackingTokenShape(bad), false, String(bad));
    }
  });
});
