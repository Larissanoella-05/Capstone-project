import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loginSchema, registerSchema } from '../../src/validators/auth.schemas.js';

const credentials = { email: 'aline@demo.rw', password: 'demo1234' };

describe('loginSchema client flag', () => {
  it('accepts web and mobile', () => {
    assert.equal(loginSchema.parse({ ...credentials, client: 'web' }).client, 'web');
    assert.equal(loginSchema.parse({ ...credentials, client: 'mobile' }).client, 'mobile');
  });

  it('is still valid when client is omitted', () => {
    const parsed = loginSchema.safeParse(credentials);
    assert.equal(parsed.success, true);
    assert.equal(parsed.data.client, undefined);
  });

  it('rejects any other client value', () => {
    assert.equal(loginSchema.safeParse({ ...credentials, client: 'desktop' }).success, false);
    assert.equal(loginSchema.safeParse({ ...credentials, client: '' }).success, false);
  });
});

describe('loginSchema identifier', () => {
  const parse = (identifier) => loginSchema.safeParse({ identifier, password: 'demo1234' });

  it('takes an email address, trimmed and in lower case', () => {
    assert.equal(parse('  Aline@Demo.rw ').data.identifier, 'aline@demo.rw');
  });

  it('takes a phone number in any usual form', () => {
    for (const phone of ['078 830 0114', '0788300114', '+250788300114', '250 788 300 114']) {
      assert.equal(parse(phone).success, true, phone);
    }
  });

  it('still reads the old email field sent by installed apps', () => {
    assert.equal(loginSchema.parse(credentials).identifier, 'aline@demo.rw');
  });

  it('prefers identifier when both are sent', () => {
    const parsed = loginSchema.parse({ ...credentials, identifier: '0788300114' });
    assert.equal(parsed.identifier, '0788300114');
  });

  it('rejects an empty box, text that is neither an email nor a phone, and a missing password', () => {
    assert.equal(parse('').success, false);
    assert.equal(parse('   ').success, false);
    assert.equal(parse('aline').success, false);
    assert.equal(parse('not@anemail').success, false);
    assert.equal(parse('0112345678').success, false);
    assert.equal(loginSchema.safeParse({ identifier: '0788300114' }).success, false);
    assert.equal(loginSchema.safeParse({ password: 'demo1234' }).success, false);
  });
});

describe('registerSchema', () => {
  const valid = {
    name: ' Aline Mukamana ',
    phone: '078 830 0114',
    password: 'longenough',
    meterNumber: '0421 5583 019',
    cell: 'Kibenga',
    latitude: -1.9532,
    longitude: 30.1668,
  };
  const messageFor = (body) => registerSchema.safeParse(body).error?.issues[0]?.message;

  it('accepts a phone-only registration and stores the phone and meter in one standard form', () => {
    const parsed = registerSchema.parse(valid);
    assert.equal(parsed.name, 'Aline Mukamana');
    assert.equal(parsed.phone, '+250788300114');
    assert.equal(parsed.meterNumber, '04215583019');
    assert.equal(parsed.email, undefined);
    assert.equal(parsed.village, undefined);
    assert.equal(parsed.landmark, undefined);
  });

  it('keeps an email in lower case and drops empty optional fields', () => {
    const parsed = registerSchema.parse({
      ...valid,
      email: ' Aline@Example.RW ',
      village: '',
      landmark: '  ',
    });
    assert.equal(parsed.email, 'aline@example.rw');
    assert.equal(parsed.village, undefined);
    assert.equal(parsed.landmark, undefined);
    assert.equal(registerSchema.parse({ ...valid, email: '' }).email, undefined);
  });

  it('keeps the client flag so the token can last as long as the app needs', () => {
    assert.equal(registerSchema.parse({ ...valid, client: 'mobile' }).client, 'mobile');
    assert.equal(registerSchema.safeParse({ ...valid, client: 'desktop' }).success, false);
  });

  it('rejects a role, or any other field the form does not have', () => {
    assert.equal(registerSchema.safeParse({ ...valid, role: 'COORDINATOR' }).success, false);
    assert.equal(registerSchema.safeParse({ ...valid, role: 'CUSTOMER' }).success, false);
    assert.equal(registerSchema.safeParse({ ...valid, technician: {} }).success, false);
  });

  it('rejects a password under 8 characters', () => {
    assert.match(messageFor({ ...valid, password: 'short12' }), /8 characters/);
    assert.equal(registerSchema.safeParse({ ...valid, password: 'eightchr' }).success, true);
  });

  it('rejects a phone number that is not a Rwandan mobile', () => {
    assert.match(messageFor({ ...valid, phone: '12345' }), /Rwandan mobile/);
    assert.match(messageFor({ ...valid, phone: '0112345678' }), /Rwandan mobile/);
    assert.match(messageFor({ ...valid, phone: undefined }), /Rwandan mobile/);
  });

  it('rejects a bad email address', () => {
    assert.match(messageFor({ ...valid, email: 'aline@' }), /email/i);
  });

  it('rejects a meter number that does not have 11 or 13 digits', () => {
    assert.match(messageFor({ ...valid, meterNumber: '12345' }), /11 or 13 digits/);
    assert.match(messageFor({ ...valid, meterNumber: '0421 5583 01A' }), /11 or 13 digits/);
    assert.match(messageFor({ ...valid, meterNumber: undefined }), /meter number/i);
    assert.equal(
      registerSchema.safeParse({ ...valid, meterNumber: '1234567890123' }).success,
      true
    );
  });

  it('needs a name and a cell', () => {
    assert.match(messageFor({ ...valid, name: ' ' }), /name/i);
    assert.match(messageFor({ ...valid, cell: ' ' }), /cell/i);
    assert.match(messageFor({ ...valid, cell: undefined }), /cell/i);
  });

  it('rejects coordinates that are missing or out of range', () => {
    for (const body of [
      { ...valid, latitude: 91 },
      { ...valid, latitude: -91 },
      { ...valid, longitude: 181 },
      { ...valid, longitude: -181 },
      { ...valid, latitude: undefined },
      { ...valid, longitude: undefined },
      { ...valid, latitude: '-1.9' },
    ]) {
      assert.equal(registerSchema.safeParse(body).success, false, JSON.stringify(body));
    }
    assert.match(messageFor({ ...valid, latitude: undefined }), /location/i);
  });
});
