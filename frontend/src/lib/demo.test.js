import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isDemoLogin } from './demo.js';

describe('isDemoLogin', () => {
  it('is on only for the exact string "true"', () => {
    assert.equal(isDemoLogin('true'), true);
    assert.equal(isDemoLogin('false'), false);
    assert.equal(isDemoLogin(''), false);
    assert.equal(isDemoLogin(undefined), false);
  });
});
