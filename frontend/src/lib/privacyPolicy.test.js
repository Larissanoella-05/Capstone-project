import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { POLICY } from './privacyPolicy.js';
import { HOTLINE } from './landingCopy.js';

const text = POLICY.sections.flatMap((s) => [s.heading, ...s.paragraphs]);

describe('privacy policy copy', () => {
  it('has no [placeholder] text and no empty section', () => {
    for (const line of text) assert.ok(!/\[[^\]]*\]|TO CONFIRM/i.test(line), line);
    for (const s of POLICY.sections) assert.ok(s.paragraphs.length > 0, s.heading);
  });

  it('covers collection, protection, retention, rights, the hotline and a contact', () => {
    const headings = POLICY.sections.map((s) => s.heading);
    for (const wanted of [
      'What we collect',
      'How it is protected',
      'Retention',
      'Your rights',
      'Contact',
    ]) {
      assert.ok(headings.includes(wanted), wanted);
    }
    assert.ok(text.some((line) => line.includes(HOTLINE)));
    assert.ok(text.some((line) => line.includes(POLICY.contactEmail)));
  });

  it('names the ethics approval code and the seven-day tracking link', () => {
    assert.equal(POLICY.approval, 'SEPT26-BSE-025');
    assert.ok(text.some((line) => line.includes(POLICY.approval)));
    assert.ok(text.some((line) => line.includes('seven days')));
  });
});
