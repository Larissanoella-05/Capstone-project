import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter } from '../../src/middleware/rateLimit.js';

/** Runs the middleware once and reports what it did. */
function hit(limiter, key = '1.1.1.1', body = {}) {
  const req = { ip: key, body };
  let error = null;
  let passed = false;
  limiter(req, {}, (next) => {
    if (next) error = next;
    else passed = true;
  });
  return { passed, error };
}

describe('createRateLimiter', () => {
  it('lets requests through until the limit, then answers 429', () => {
    const now = 0;
    const limiter = createRateLimiter({ max: 2, windowMs: 1000, now: () => now });
    assert.ok(hit(limiter).passed);
    assert.ok(hit(limiter).passed);
    const third = hit(limiter);
    assert.equal(third.passed, false);
    assert.equal(third.error.status, 429);
    assert.match(third.error.message, /too many/i);
  });

  it('can say what was limited, so a sign-up is not told it sent too many reports', () => {
    const limiter = createRateLimiter({
      max: 1,
      windowMs: 1000,
      now: () => 0,
      message: 'Too many sign-ups from this network.',
    });
    hit(limiter);
    assert.equal(hit(limiter).error.message, 'Too many sign-ups from this network.');
    assert.equal(hit(limiter).error.status, 429);
  });

  it('counts each address separately', () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 1000, now: () => 0 });
    assert.ok(hit(limiter, 'a').passed);
    assert.ok(hit(limiter, 'b').passed);
    assert.equal(hit(limiter, 'a').passed, false);
  });

  it('starts counting again once the window has passed', () => {
    let now = 0;
    const limiter = createRateLimiter({ max: 1, windowMs: 1000, now: () => now });
    assert.ok(hit(limiter).passed);
    assert.equal(hit(limiter).passed, false);
    now = 1001;
    assert.ok(hit(limiter).passed);
  });

  it('can count by a key taken from the request, such as the phone number', () => {
    const limiter = createRateLimiter({
      max: 1,
      windowMs: 1000,
      now: () => 0,
      keyOf: (req) => req.body.contactPhone,
    });
    assert.ok(hit(limiter, 'a', { contactPhone: '+250788000001' }).passed);
    assert.equal(hit(limiter, 'b', { contactPhone: '+250788000001' }).passed, false);
    assert.ok(hit(limiter, 'c', { contactPhone: '+250788000002' }).passed);
  });

  it('forgets old entries so memory does not grow without end', () => {
    let now = 0;
    const limiter = createRateLimiter({ max: 1, windowMs: 1000, now: () => now });
    for (let i = 0; i < 50; i += 1) hit(limiter, `ip-${i}`);
    now = 5000;
    hit(limiter, 'fresh');
    assert.ok(limiter.size() <= 1);
  });
});
