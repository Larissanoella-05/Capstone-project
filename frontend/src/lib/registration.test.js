import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRegisterPayload,
  identifierError,
  looksLikeEmail,
  validateRegisterForm,
} from './registration.js';

const point = { latitude: -1.9532, longitude: 30.1668, accuracyM: 25 };
const form = (extra = {}) => ({
  name: 'Aline Mukamana',
  phone: '078 830 0114',
  email: '',
  password: 'longenough',
  meterNumber: '0421 5583 019',
  cell: 'Kibenga',
  village: '',
  landmark: '',
  point,
  ...extra,
});

describe('looksLikeEmail', () => {
  it('is true for something@something.tld', () => {
    assert.equal(looksLikeEmail('aline@demo.rw'), true);
    assert.equal(looksLikeEmail(' aline@demo.rw '), true);
  });

  it('is false for anything else', () => {
    for (const text of ['', 'aline', 'aline@', '@demo.rw', 'a b@demo.rw', '0788300114']) {
      assert.equal(looksLikeEmail(text), false, text);
    }
  });
});

describe('identifierError', () => {
  it('accepts an email address or a Rwandan phone number in any usual form', () => {
    for (const text of ['aline@demo.rw', '0788300114', '078 830 0114', '+250788300114']) {
      assert.equal(identifierError(text), '', text);
    }
  });

  it('asks for the box to be filled in', () => {
    assert.match(identifierError(''), /email or phone/i);
    assert.match(identifierError('   '), /email or phone/i);
  });

  it('says which kind is wrong', () => {
    assert.match(identifierError('aline@'), /valid email/i);
    assert.match(identifierError('12345'), /Rwandan mobile/i);
  });
});

describe('validateRegisterForm', () => {
  it('is empty for a complete form, with or without an email', () => {
    assert.deepEqual(validateRegisterForm(form()), {});
    assert.deepEqual(validateRegisterForm(form({ email: 'aline@example.rw' })), {});
  });

  it('needs a name', () => {
    assert.match(validateRegisterForm(form({ name: '  ' })).name, /name/i);
  });

  it('needs a Rwandan mobile number', () => {
    for (const phone of ['', '12345', '0711234567', '+254712345678']) {
      assert.match(validateRegisterForm(form({ phone })).phone, /Rwandan mobile/, phone);
    }
  });

  it('checks an email only when one is typed', () => {
    assert.equal(validateRegisterForm(form({ email: '' })).email, undefined);
    assert.match(validateRegisterForm(form({ email: 'aline@' })).email, /valid email/i);
  });

  it('needs a password of at least 8 characters', () => {
    assert.match(validateRegisterForm(form({ password: '' })).password, /8 characters/);
    assert.match(validateRegisterForm(form({ password: 'short12' })).password, /8 characters/);
    assert.equal(validateRegisterForm(form({ password: 'eightchr' })).password, undefined);
  });

  it('needs a meter number of 11 or 13 digits, spaces allowed', () => {
    for (const meterNumber of ['', '12345', '0421 5583 01A', '042155830190']) {
      assert.match(validateRegisterForm(form({ meterNumber })).meterNumber, /11 or 13 digits/);
    }
    assert.equal(
      validateRegisterForm(form({ meterNumber: '1234567890123' })).meterNumber,
      undefined
    );
  });

  it('needs a cell', () => {
    assert.match(validateRegisterForm(form({ cell: ' ' })).cell, /cell/i);
  });

  it('needs the location to be found', () => {
    assert.match(validateRegisterForm(form({ point: null })).location, /use my location/i);
  });

  it('reports every problem at once', () => {
    const errors = validateRegisterForm(
      form({ name: '', phone: '', password: '', meterNumber: '', cell: '', point: null })
    );
    assert.deepEqual(Object.keys(errors).sort(), [
      'cell',
      'location',
      'meterNumber',
      'name',
      'password',
      'phone',
    ]);
  });
});

describe('buildRegisterPayload', () => {
  it('sends the typed values and the point, and leaves out empty optional fields', () => {
    assert.deepEqual(buildRegisterPayload(form({ name: ' Aline Mukamana ' })), {
      name: 'Aline Mukamana',
      phone: '078 830 0114',
      password: 'longenough',
      meterNumber: '0421 5583 019',
      cell: 'Kibenga',
      latitude: -1.9532,
      longitude: 30.1668,
    });
  });

  it('includes the email, village and landmark when they are filled in', () => {
    const body = buildRegisterPayload(
      form({ email: ' aline@example.rw ', village: ' Gasharu ', landmark: ' Blue gate ' })
    );
    assert.equal(body.email, 'aline@example.rw');
    assert.equal(body.village, 'Gasharu');
    assert.equal(body.landmark, 'Blue gate');
  });

  it('never sends a role or the accuracy of the point', () => {
    const body = buildRegisterPayload(form());
    assert.equal('role' in body, false);
    assert.equal('accuracyM' in body, false);
  });

  it('keeps the password exactly as typed', () => {
    assert.equal(
      buildRegisterPayload(form({ password: ' spaced pass ' })).password,
      ' spaced pass '
    );
  });
});
