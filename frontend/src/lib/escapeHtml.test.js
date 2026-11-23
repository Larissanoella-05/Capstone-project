import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from './escapeHtml.js';

describe('escapeHtml', () => {
  it('leaves an ordinary map label unchanged', () => {
    assert.equal(escapeHtml('UR-1042 · Kibenga'), 'UR-1042 · Kibenga');
  });

  it('turns a script tag into plain text', () => {
    assert.equal(escapeHtml('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('removes the angle brackets an event-handler payload needs', () => {
    const out = escapeHtml('<img src=x onerror=alert(1)>');
    assert.equal(out.includes('<'), false);
    assert.equal(out.includes('>'), false);
  });

  it('escapes quotes and ampersands, and does not escape twice', () => {
    assert.equal(escapeHtml(`"a" & 'b'`), '&quot;a&quot; &amp; &#39;b&#39;');
    assert.equal(escapeHtml('&lt;'), '&amp;lt;');
  });

  it('answers an empty string for a missing label', () => {
    assert.equal(escapeHtml(undefined), '');
    assert.equal(escapeHtml(null), '');
  });
});
