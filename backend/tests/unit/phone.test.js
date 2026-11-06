import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normaliseRwandanPhone } from '../../src/utils/phone.js';

describe('normaliseRwandanPhone', () => {
  it('turns every common way of writing a number into +2507XXXXXXXX', () => {
    for (const input of [
      '0788123456',
      '078 812 3456',
      '078-812-3456',
      '+250788123456',
      '+250 788 123 456',
      '250788123456',
      '00250788123456',
      '(078) 8123456',
    ]) {
      assert.equal(normaliseRwandanPhone(input), '+250788123456', input);
    }
  });

  it('accepts the four mobile prefixes', () => {
    for (const prefix of ['072', '073', '078', '079']) {
      assert.equal(normaliseRwandanPhone(`${prefix}1234567`), `+250${prefix.slice(1)}1234567`);
    }
  });

  it('rejects numbers that are not Rwandan mobile numbers', () => {
    for (const input of [
      '',
      '   ',
      '12345',
      '078812345', // one digit short
      '07881234567', // one digit long
      '0711234567', // 071 is not a mobile prefix
      '+254712345678', // Kenya
      '2727', // the REG line is not a contact number
      'abcdefghij',
    ]) {
      assert.equal(normaliseRwandanPhone(input), null, input);
    }
  });

  it('returns null for input that is not text', () => {
    assert.equal(normaliseRwandanPhone(undefined), null);
    assert.equal(normaliseRwandanPhone(null), null);
    assert.equal(normaliseRwandanPhone(788123456), null);
  });
});
