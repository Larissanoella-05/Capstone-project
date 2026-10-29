import { fitsPhotoLimit } from './photo.js';

describe('fitsPhotoLimit', () => {
  it('accepts a small image data URL', () => {
    expect(fitsPhotoLimit('data:image/jpeg;base64,/9j/4AAQ')).toBe(true);
  });

  it('rejects a string that is not an image data URL', () => {
    expect(fitsPhotoLimit('hello')).toBe(false);
    expect(fitsPhotoLimit('data:text/plain;base64,aGk=')).toBe(false);
    expect(fitsPhotoLimit(null)).toBe(false);
  });

  it('rejects a data URL over 1,500,000 characters and accepts one exactly at the limit', () => {
    const prefix = 'data:image/jpeg;base64,';
    expect(fitsPhotoLimit(prefix + 'A'.repeat(1500000 - prefix.length))).toBe(true);
    expect(fitsPhotoLimit(prefix + 'A'.repeat(1500000 - prefix.length + 1))).toBe(false);
  });
});
