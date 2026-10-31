import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { distanceKm } from '../../src/utils/geo.js';
import { HttpError, badRequest, conflict, forbidden } from '../../src/utils/httpError.js';
import { validate } from '../../src/middleware/validate.js';
import { errorHandler } from '../../src/middleware/error.js';
import { createSchema, statusSchema, assignSchema } from '../../src/validators/fault.schemas.js';
import { locationSchema } from '../../src/validators/technician.schemas.js';
import { loginSchema } from '../../src/validators/auth.schemas.js';
import { customerMessageFor } from '../../src/services/notificationService.js';

/** Minimal Express response double that records status and JSON body. */
function fakeResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe('distanceKm (haversine)', () => {
  it('is zero for the same point', () => {
    assert.equal(
      distanceKm({ latitude: -1.95, longitude: 30.17 }, { latitude: -1.95, longitude: 30.17 }),
      0
    );
  });

  it('matches a known distance: Kigali centre to Ndera ≈ 11 km', () => {
    const km = distanceKm(
      { latitude: -1.9441, longitude: 30.0619 },
      { latitude: -1.9503, longitude: 30.1731 }
    );
    assert.ok(km > 11 && km < 13, `got ${km}`);
  });

  it('is symmetric and rounded to one decimal', () => {
    const a = { latitude: -1.9532, longitude: 30.1668 };
    const b = { latitude: -1.9446, longitude: 30.1572 };
    assert.equal(distanceKm(a, b), distanceKm(b, a));
    assert.equal(distanceKm(a, b), Math.round(distanceKm(a, b) * 10) / 10);
  });

  it('returns null when a point is missing', () => {
    assert.equal(distanceKm(null, { latitude: 0, longitude: 0 }), null);
  });
});

describe('request validation schemas', () => {
  it('accepts a minimal fault report and turns empty strings into undefined', () => {
    const parsed = createSchema.parse({ category: 'POWER_OUTAGE', description: '' });
    assert.equal(parsed.description, undefined);
  });

  it('rejects an unknown category, a non-image photo and a 1001-character description', () => {
    assert.equal(createSchema.safeParse({ category: 'FIRE' }).success, false);
    assert.equal(
      createSchema.safeParse({ category: 'OTHER', photo: 'data:text/plain;base64,AAA' }).success,
      false
    );
    assert.equal(
      createSchema.safeParse({ category: 'OTHER', description: 'x'.repeat(1001) }).success,
      false
    );
  });

  it('does not let clients set REPORTED or ASSIGNED through the status endpoint', () => {
    assert.equal(statusSchema.safeParse({ status: 'ASSIGNED' }).success, false);
    assert.equal(statusSchema.safeParse({ status: 'REPORTED' }).success, false);
    assert.equal(statusSchema.safeParse({ status: 'ON_THE_WAY' }).success, true);
  });

  it('rejects negative or huge clarification counts', () => {
    assert.equal(
      statusSchema.safeParse({ status: 'RESOLVED', clarificationContacts: -1 }).success,
      false
    );
    assert.equal(
      statusSchema.safeParse({ status: 'RESOLVED', clarificationContacts: 51 }).success,
      false
    );
  });

  it('coerces technicianId and rejects zero', () => {
    assert.equal(assignSchema.parse({ technicianId: '3' }).technicianId, 3);
    assert.equal(assignSchema.safeParse({ technicianId: 0 }).success, false);
  });

  it('rejects coordinates outside the valid range', () => {
    assert.equal(locationSchema.safeParse({ latitude: 91, longitude: 30 }).success, false);
    assert.equal(locationSchema.safeParse({ latitude: -1.95, longitude: 181 }).success, false);
    assert.equal(locationSchema.safeParse({ latitude: '-1.95', longitude: '30.17' }).success, true);
  });

  it('normalises the login email and rejects malformed ones', () => {
    assert.equal(
      loginSchema.parse({ email: '  Aline@Demo.RW ', password: 'x' }).email,
      'aline@demo.rw'
    );
    assert.equal(loginSchema.safeParse({ email: 'not-an-email', password: 'x' }).success, false);
  });
});

describe('validate middleware', () => {
  it('replaces req.body with the parsed value and calls next()', () => {
    const req = { body: { category: 'OTHER', description: '  trimmed  ' } };
    let nextArg = 'not called';
    validate(createSchema)(req, {}, (arg) => (nextArg = arg));
    assert.equal(nextArg, undefined);
    assert.equal(req.body.description, 'trimmed');
  });

  it('passes a 400 HttpError with per-field details on invalid input', () => {
    let nextArg;
    validate(createSchema)({ body: {} }, {}, (arg) => (nextArg = arg));
    assert.ok(nextArg instanceof HttpError);
    assert.equal(nextArg.status, 400);
    assert.equal(nextArg.details[0].field, 'category');
  });
});

describe('errorHandler', () => {
  it('maps HttpError subclasses to their status code and message', () => {
    for (const error of [badRequest('bad'), forbidden(), conflict('busy')]) {
      const res = fakeResponse();
      errorHandler(error, {}, res, () => {});
      assert.equal(res.statusCode, error.status);
      assert.equal(res.body.error.message, error.message);
    }
  });

  it('turns an oversized body into a friendly 413', () => {
    const res = fakeResponse();
    errorHandler({ type: 'entity.too.large' }, {}, res, () => {});
    assert.equal(res.statusCode, 413);
  });

  it('hides unexpected errors behind a generic 500', (t) => {
    t.mock.method(console, 'error', () => {});
    const res = fakeResponse();
    errorHandler(new Error('secret stack detail'), {}, res, () => {});
    assert.equal(res.statusCode, 500);
    assert.doesNotMatch(res.body.error.message, /secret/);
  });
});

describe('customerMessageFor', () => {
  it('uses the technician’s first two names and the fault reference', () => {
    const message = customerMessageFor('ON_THE_WAY', {
      reference: 'FR-1001',
      technicianName: 'Jean Claude Habimana',
    });
    assert.equal(message.type, 'TECHNICIAN_ON_THE_WAY');
    assert.match(message.message, /^Jean Claude is on the way/);
    assert.match(message.message, /FR-1001/);
  });

  it('does not notify the customer when work starts', () => {
    assert.equal(customerMessageFor('WORKING', { reference: 'FR-1' }), null);
  });
});
