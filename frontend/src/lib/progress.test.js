import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { STAGES } from './format.js';
import { checkedLabel, nextStepFor } from './progress.js';

describe('nextStepFor', () => {
  it('has a sentence for every stage and for cancelled', () => {
    for (const status of [...STAGES, 'CANCELLED']) {
      assert.ok(nextStepFor(status).length > 10, status);
    }
  });

  it('is empty for an unknown status', () => {
    assert.equal(nextStepFor('SOMETHING_ELSE'), '');
  });
});

describe('checkedLabel', () => {
  it('is empty before the first answer', () => {
    assert.equal(checkedLabel(null), '');
    assert.equal(checkedLabel(undefined), '');
  });

  it('says when the screen last asked the server', () => {
    assert.match(checkedLabel(new Date(2026, 10, 1, 14, 5).getTime()), /^Checked 2:05\s?PM$/);
  });
});
