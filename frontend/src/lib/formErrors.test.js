import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { errorSummary } from './formErrors.js';

const FIELDS = [
  { key: 'category', id: 'category-group' },
  { key: 'description', id: 'description' },
  { key: 'contactPhone', id: 'contact-phone' },
];

describe('errorSummary', () => {
  it('lists the fields with an error in page order, with the same message as the field', () => {
    const errors = { contactPhone: 'Enter a phone number.', category: 'Choose the type of fault.' };
    assert.deepEqual(errorSummary(errors, FIELDS), [
      { id: 'category-group', message: 'Choose the type of fault.' },
      { id: 'contact-phone', message: 'Enter a phone number.' },
    ]);
  });

  it('ignores cleared errors and is empty when nothing is wrong', () => {
    assert.deepEqual(errorSummary({ category: undefined, description: '' }, FIELDS), []);
  });
});
