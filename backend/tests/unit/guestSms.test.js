import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GUEST_SMS_TYPES, guestSmsMessage } from '../../src/domain/guestSms.js';

const token = 'T'.repeat(32);
const details = {
  reference: 'FR-1042',
  token,
  technicianName: 'Jean Claude Habimana',
  webUrl: 'https://umuriro-response.example.app',
};
const link = `${details.webUrl}/track/${token}`;

describe('guestSmsMessage', () => {
  it('covers received, assigned, on the way, arrived, resolved and cancelled', () => {
    assert.deepEqual([...GUEST_SMS_TYPES].sort(), [
      'FAULT_CANCELLED',
      'FAULT_RESOLVED',
      'FAULT_SUBMITTED',
      'TECHNICIAN_ARRIVED',
      'TECHNICIAN_ASSIGNED',
      'TECHNICIAN_ON_THE_WAY',
    ]);
  });

  it('carries the reference and the tracking link when the report is received', () => {
    const message = guestSmsMessage('FAULT_SUBMITTED', details);
    assert.equal(message.type, 'FAULT_SUBMITTED');
    assert.ok(message.message.includes('FR-1042'));
    assert.ok(message.message.includes(link));
    assert.ok(message.message.includes('2727'));
  });

  it('names the technician by first name only when one is assigned or on the way', () => {
    for (const type of ['TECHNICIAN_ASSIGNED', 'TECHNICIAN_ON_THE_WAY', 'TECHNICIAN_ARRIVED']) {
      const { message } = guestSmsMessage(type, details);
      assert.ok(message.includes('FR-1042'), type);
      assert.ok(message.includes('Jean'), type);
      assert.equal(message.includes('Habimana'), false, type);
    }
  });

  it('keeps the link in the messages that tell the guest to follow along', () => {
    for (const type of ['TECHNICIAN_ASSIGNED', 'TECHNICIAN_ON_THE_WAY']) {
      assert.ok(guestSmsMessage(type, details).message.includes(link), type);
    }
  });

  it('tells the guest what to do if the power is still off after the fix', () => {
    const { message } = guestSmsMessage('FAULT_RESOLVED', details);
    assert.match(message, /still off/i);
    assert.ok(message.includes('2727'));
  });

  it('tells the guest a cancelled report was cancelled and where to call', () => {
    const { message } = guestSmsMessage('FAULT_CANCELLED', details);
    assert.match(message, /cancelled/i);
    assert.ok(message.includes('2727'));
  });

  it('fits in one 160-character text with a long address and a long name', () => {
    const long = {
      ...details,
      webUrl: 'https://umuriro-response-pilot-ndera.vercel.app',
      technicianName: 'Mukamusoni-Ndayisenga Marie Claire',
    };
    for (const type of GUEST_SMS_TYPES) {
      const { message } = guestSmsMessage(type, long);
      assert.ok(message.length <= 160, `${type} is ${message.length} characters`);
    }
  });

  it('uses only plain ASCII so the text is not split into 70-character parts', () => {
    const accented = { ...details, technicianName: 'Désiré Ñamuhanga' };
    for (const type of GUEST_SMS_TYPES) {
      const { message } = guestSmsMessage(type, accented);
      assert.match(message, /^[\x20-\x7e]+$/, type);
    }
  });

  it('says "A technician" when no name is known', () => {
    const { message } = guestSmsMessage('TECHNICIAN_ON_THE_WAY', {
      ...details,
      technicianName: undefined,
    });
    assert.ok(message.includes('A technician'));
  });

  it('returns null for a type that guests are not texted about', () => {
    assert.equal(guestSmsMessage('JOB_ASSIGNED', details), null);
  });
});
