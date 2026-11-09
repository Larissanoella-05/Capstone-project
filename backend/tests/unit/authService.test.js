import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import {
  conflictFromExisting,
  conflictFromUniqueViolation,
} from '../../src/services/authService.js';
import { parseLoginIdentifier } from '../../src/domain/loginIdentifier.js';

describe('parseLoginIdentifier', () => {
  it('looks anything with an @ up by email, in lower case', () => {
    assert.deepEqual(parseLoginIdentifier(' Aline@Demo.rw '), { email: 'aline@demo.rw' });
  });

  it('looks anything else up by phone, in the standard +250 form', () => {
    for (const phone of ['0788300114', '078 830 0114', '+250 788 300 114', '250788300114']) {
      assert.deepEqual(parseLoginIdentifier(phone), { phone: '+250788300114' }, phone);
    }
  });

  it('returns null for text that is neither', () => {
    for (const text of ['', '   ', 'aline', '12345', '0112345678', 'a@b', undefined, null, 42]) {
      assert.equal(parseLoginIdentifier(text), null, String(text));
    }
  });
});

describe('conflictFromExisting', () => {
  const wanted = { phone: '+250788300114', email: 'aline@demo.rw' };

  it('is null when nobody has the phone or the email', () => {
    assert.equal(conflictFromExisting([], wanted), null);
    assert.equal(conflictFromExisting([{ phone: '+250788000000', email: 'x@y.rw' }], wanted), null);
  });

  it('names the phone number when it is taken', () => {
    const error = conflictFromExisting([{ phone: wanted.phone, email: null }], wanted);
    assert.equal(error.status, 409);
    assert.match(error.message, /phone number/i);
    assert.deepEqual(error.details, [{ field: 'phone', message: error.message }]);
  });

  it('names the email address when it is taken', () => {
    const error = conflictFromExisting([{ phone: null, email: wanted.email }], wanted);
    assert.equal(error.status, 409);
    assert.match(error.message, /email address/i);
    assert.deepEqual(error.details, [{ field: 'email', message: error.message }]);
  });

  it('reports the phone first when both are taken', () => {
    const error = conflictFromExisting([{ phone: wanted.phone, email: wanted.email }], wanted);
    assert.equal(error.details[0].field, 'phone');
  });

  it('ignores an email nobody typed', () => {
    const error = conflictFromExisting([{ phone: '+250788000000', email: null }], {
      phone: wanted.phone,
    });
    assert.equal(error, null);
  });
});

describe('conflictFromUniqueViolation', () => {
  const violation = (target, code = 'P2002') =>
    new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code,
      clientVersion: 'test',
      meta: { target },
    });

  it('turns a race on the phone or the email into the same named 409', () => {
    const phone = conflictFromUniqueViolation(violation(['phone']));
    assert.equal(phone.status, 409);
    assert.match(phone.message, /phone number/i);
    const email = conflictFromUniqueViolation(violation(['email']));
    assert.equal(email.status, 409);
    assert.match(email.message, /email address/i);
  });

  it('leaves every other error alone', () => {
    assert.equal(conflictFromUniqueViolation(violation(['customerId', 'meterNumber'])), null);
    assert.equal(conflictFromUniqueViolation(violation(['phone'], 'P2025')), null);
    assert.equal(conflictFromUniqueViolation(new Error('boom')), null);
  });
});
