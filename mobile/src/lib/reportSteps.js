// Validation for the three-step report flow: 1 type, 2 details, 3 review.

export const STEP_NAMES = ['Type', 'Details', 'Review'];
export const MAX_DESCRIPTION = 1000;
const PHONE_PATTERN = /^[+\d][\d\s-]{7,}$/;

/**
 * Errors keyed by field, empty if the step is valid; step 3 rechecks the earlier steps.
 * @param {number} step 1, 2 or 3
 * @param {{ category: string, description: string, contactPhone: string, hasLocation: boolean }} form
 * @returns {Record<string, string>}
 */
export function validateStep(step, form) {
  const errors = {};
  if (step === 1 || step === 3) {
    if (!form.category) errors.category = 'Choose the type of fault.';
  }
  if (step === 2 || step === 3) {
    if (form.description.length > MAX_DESCRIPTION) {
      errors.description = `Shorten the description to ${MAX_DESCRIPTION} characters or fewer.`;
    }
    if (form.contactPhone && !PHONE_PATTERN.test(form.contactPhone.trim())) {
      errors.contactPhone = 'Enter a phone number such as +250 788 300 114.';
    }
    if (!form.hasLocation) {
      errors.location = 'Your registered service location has not loaded yet.';
    }
  }
  return errors;
}
