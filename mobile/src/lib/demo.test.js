import { isDemoLogin } from './demo.js';

describe('isDemoLogin', () => {
  it('is on only for the exact string "true"', () => {
    expect(isDemoLogin('true')).toBe(true);
    expect(isDemoLogin('false')).toBe(false);
    expect(isDemoLogin('')).toBe(false);
    expect(isDemoLogin(undefined)).toBe(false);
  });
});
