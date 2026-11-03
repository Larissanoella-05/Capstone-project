import { MAX_DESCRIPTION, STEP_NAMES, validateStep } from './reportSteps.js';

const valid = {
  category: 'POWER_OUTAGE',
  description: '',
  contactPhone: '+250 788 300 114',
  hasLocation: true,
};

describe('STEP_NAMES', () => {
  it('names the three steps', () => {
    expect(STEP_NAMES).toEqual(['Type', 'Details', 'Review']);
  });
});

describe('validateStep', () => {
  it('step 1 needs a category', () => {
    expect(Object.keys(validateStep(1, { ...valid, category: '' }))).toEqual(['category']);
    expect(validateStep(1, valid)).toEqual({});
  });

  it('step 1 does not check the details yet', () => {
    expect(validateStep(1, { ...valid, contactPhone: 'abc', hasLocation: false })).toEqual({});
  });

  it('step 2 accepts a description of exactly the maximum length', () => {
    expect(validateStep(2, { ...valid, description: 'a'.repeat(MAX_DESCRIPTION) })).toEqual({});
  });

  it('step 2 rejects a description that is too long', () => {
    const errors = validateStep(2, { ...valid, description: 'a'.repeat(MAX_DESCRIPTION + 1) });
    expect(Object.keys(errors)).toEqual(['description']);
  });

  it('step 2 rejects a malformed phone but allows an empty one', () => {
    expect(Object.keys(validateStep(2, { ...valid, contactPhone: '12' }))).toEqual([
      'contactPhone',
    ]);
    expect(validateStep(2, { ...valid, contactPhone: '' })).toEqual({});
  });

  it('step 2 needs a loaded service location', () => {
    expect(Object.keys(validateStep(2, { ...valid, hasLocation: false }))).toEqual(['location']);
  });

  it('step 3 checks every field again', () => {
    const errors = validateStep(3, {
      ...valid,
      category: '',
      contactPhone: '12',
      hasLocation: false,
    });
    expect(Object.keys(errors).sort()).toEqual(['category', 'contactPhone', 'location']);
    expect(validateStep(3, valid)).toEqual({});
  });
});
