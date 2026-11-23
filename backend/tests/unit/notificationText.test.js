import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  LANGUAGES,
  aTechnician,
  isLanguage,
  noticeText,
} from '../../src/domain/notificationText.js';
import { customerMessageFor } from '../../src/services/notificationService.js';
import { languageSchema } from '../../src/validators/auth.schemas.js';

const TYPES = [
  'FAULT_SUBMITTED',
  'TECHNICIAN_ASSIGNED',
  'JOB_ASSIGNED',
  'TECHNICIAN_ON_THE_WAY',
  'TECHNICIAN_ARRIVED',
  'FAULT_RESOLVED',
  'FAULT_CANCELLED',
];
const params = { reference: 'FR-1001', technician: 'Jean Claude', cell: 'Kibenga' };

describe('noticeText', () => {
  it('has a title and a message in every language for every notification type', () => {
    for (const type of TYPES) {
      const texts = LANGUAGES.map((language) => noticeText(type, language, params));
      for (const { title, message } of texts) {
        assert.ok(title.trim() && message.trim(), type);
        assert.doesNotMatch(`${title} ${message}`, /\{\w+\}/, `${type} left a placeholder`);
      }
      assert.notEqual(texts[0].title, texts[1].title, `${type} is not translated`);
    }
  });

  it('keeps the English wording that the apps already show', () => {
    assert.equal(noticeText('FAULT_SUBMITTED', 'en', params).title, 'Fault received');
    assert.equal(
      noticeText('JOB_ASSIGNED', 'en', params).message,
      'Fault #FR-1001 at Kibenga Cell has been assigned to you.'
    );
  });

  it('writes Kinyarwanda for rw and English for an unknown language', () => {
    assert.equal(noticeText('FAULT_RESOLVED', 'rw', params).title, 'Ikibazo cyakemutse');
    assert.equal(noticeText('FAULT_RESOLVED', 'fr', params).title, 'Fault resolved');
    assert.equal(noticeText('FAULT_RESOLVED', undefined, params).title, 'Fault resolved');
  });

  it('throws for a type it does not know instead of sending a blank alert', () => {
    assert.throws(() => noticeText('NOT_A_TYPE', 'en', params), /No notification text/);
  });
});

describe('customerMessageFor in a language', () => {
  const details = { reference: 'FR-1001', technicianName: 'Jean Claude Habimana' };

  it('uses the language of the customer and names the technician', () => {
    const message = customerMessageFor('ON_THE_WAY', { ...details, language: 'rw' });
    assert.equal(message.type, 'TECHNICIAN_ON_THE_WAY');
    assert.equal(message.title, 'Umutekinisiye ari mu nzira');
    assert.match(message.message, /^Jean Claude ari mu nzira/);
  });

  it('says "a technician" in the right language when none is named', () => {
    assert.match(customerMessageFor('ARRIVED', { reference: 'FR-1' }).message, /^A technician /);
    assert.match(
      customerMessageFor('ARRIVED', { reference: 'FR-1', language: 'rw' }).message,
      /^Umutekinisiye /
    );
    assert.equal(aTechnician('fr'), 'A technician');
  });
});

describe('languageSchema', () => {
  it('accepts the two languages and nothing else', () => {
    assert.equal(languageSchema.safeParse({ language: 'en' }).success, true);
    assert.equal(languageSchema.safeParse({ language: 'rw' }).success, true);
    for (const language of ['fr', '', 'RW', null, undefined]) {
      assert.equal(languageSchema.safeParse({ language }).success, false, String(language));
    }
    assert.equal(isLanguage('rw'), true);
  });
});
