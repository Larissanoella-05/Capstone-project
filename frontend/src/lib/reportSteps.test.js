import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_DESCRIPTION, STEP_NAMES, validateStep } from './reportSteps.js';

const valid = {
  category: 'POWER_OUTAGE',
  description: '',
  contactPhone: '+250 788 300 114',
  hasLocation: true,
};

describe('STEP_NAMES', () => {
  it('names the three steps', () => {
    assert.deepEqual(STEP_NAMES, ['Type', 'Details', 'Review']);
  });
});

describe('validateStep', () => {
  it('step 1 needs a category', () => {
    assert.deepEqual(Object.keys(validateStep(1, { ...valid, category: '' })), ['category']);
    assert.deepEqual(validateStep(1, valid), {});
  });

  it('step 1 does not check the details yet', () => {
    assert.deepEqual(validateStep(1, { ...valid, contactPhone: 'abc', hasLocation: false }), {});
  });

  it('step 2 accepts a description of exactly the maximum length', () => {
    const description = 'a'.repeat(MAX_DESCRIPTION);
    assert.deepEqual(validateStep(2, { ...valid, description }), {});
  });

  it('step 2 rejects a description that is too long', () => {
    const description = 'a'.repeat(MAX_DESCRIPTION + 1);
    assert.deepEqual(Object.keys(validateStep(2, { ...valid, description })), ['description']);
  });

  it('step 2 rejects a malformed phone but allows an empty one', () => {
    assert.deepEqual(Object.keys(validateStep(2, { ...valid, contactPhone: '12' })), [
      'contactPhone',
    ]);
    assert.deepEqual(validateStep(2, { ...valid, contactPhone: '' }), {});
  });

  it('step 2 needs a loaded service location', () => {
    assert.deepEqual(Object.keys(validateStep(2, { ...valid, hasLocation: false })), ['location']);
  });

  it('step 3 checks every field again', () => {
    const errors = validateStep(3, {
      ...valid,
      category: '',
      contactPhone: '12',
      hasLocation: false,
    });
    assert.deepEqual(Object.keys(errors).sort(), ['category', 'contactPhone', 'location']);
    assert.deepEqual(validateStep(3, valid), {});
  });
});
