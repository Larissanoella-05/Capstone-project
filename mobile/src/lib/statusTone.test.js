import { PRIORITY_LABEL, STATUS_LABEL } from './format.js';
import { PRIORITY_TONE, STATUS_TONE } from './statusTone.js';

describe('statusTone', () => {
  it('has a tone for every status and priority the app shows', () => {
    expect(Object.keys(STATUS_TONE).sort()).toEqual(Object.keys(STATUS_LABEL).sort());
    expect(Object.keys(PRIORITY_TONE).sort()).toEqual(Object.keys(PRIORITY_LABEL).sort());
  });
});
