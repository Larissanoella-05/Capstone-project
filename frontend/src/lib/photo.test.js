import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ATTEMPTS,
  MAX_DATA_URL_CHARS,
  MAX_PICKED_BYTES,
  SEND_AS_IS_BYTES,
  photoProblem,
  photoToDataUrl,
  scaledSize,
  shrinkPhoto,
} from './photo.js';

const big = { type: 'image/jpeg', size: SEND_AS_IS_BYTES + 1 };

/** A fake browser: the picture is 4000 x 3000, and encoding gives a string of the length the test sets. */
function fakeBrowser(lengthFor) {
  const calls = [];
  return {
    calls,
    decode: async () => ({ width: 4000, height: 3000, source: {} }),
    encode: async (_image, size, quality) => {
      calls.push({ size, quality });
      return 'x'.repeat(lengthFor(calls.length));
    },
  };
}

describe('scaledSize', () => {
  it('shrinks the longest side and keeps the shape', () => {
    assert.deepEqual(scaledSize(4000, 3000, 1600), { width: 1600, height: 1200 });
    assert.deepEqual(scaledSize(3000, 4000, 1600), { width: 1200, height: 1600 });
  });

  it('never makes a small picture bigger', () => {
    assert.deepEqual(scaledSize(800, 600, 1600), { width: 800, height: 600 });
  });
});

describe('photoProblem', () => {
  it('accepts a big phone photo, because it will be shrunk', () => {
    assert.equal(photoProblem({ type: 'image/jpeg', size: 6_000_000 }), null);
  });

  it('refuses something that is not an image, or is far too big to open', () => {
    assert.match(photoProblem({ type: 'application/pdf', size: 10 }), /image/i);
    assert.match(photoProblem({ type: 'image/png', size: MAX_PICKED_BYTES + 1 }), /30 MB/);
  });
});

describe('shrinkPhoto', () => {
  it('stops at the first attempt that fits', async () => {
    const browser = fakeBrowser(() => 900_000);
    const result = await shrinkPhoto(big, browser);
    assert.equal(result.length, 900_000);
    assert.equal(browser.calls.length, 1);
    assert.deepEqual(browser.calls[0].size, { width: 1600, height: 1200 });
  });

  it('tries a smaller, more compressed picture when the first is still too big', async () => {
    const browser = fakeBrowser((attempt) => (attempt < 3 ? MAX_DATA_URL_CHARS + 1 : 700_000));
    const result = await shrinkPhoto(big, browser);
    assert.equal(result.length, 700_000);
    assert.equal(browser.calls.length, 3);
    assert.ok(browser.calls[2].quality < browser.calls[0].quality);
    assert.ok(browser.calls[2].size.width < browser.calls[0].size.width);
  });

  it('gives null when even the smallest attempt does not fit', async () => {
    const browser = fakeBrowser(() => MAX_DATA_URL_CHARS + 1);
    assert.equal(await shrinkPhoto(big, browser), null);
    assert.equal(browser.calls.length, ATTEMPTS.length);
  });
});

describe('photoToDataUrl', () => {
  it('shrinks a big photo and returns the result', async () => {
    const browser = fakeBrowser(() => 500_000);
    const result = await photoToDataUrl(big, browser);
    assert.equal(result.length, 500_000);
  });

  it('says so, in words a person can read, when the photo cannot be opened', async () => {
    const decode = async () => {
      throw new Error('decode failed');
    };
    await assert.rejects(photoToDataUrl(big, { decode }), /could not be opened/);
  });

  it('says so when no attempt makes it small enough', async () => {
    const browser = fakeBrowser(() => MAX_DATA_URL_CHARS + 1);
    await assert.rejects(photoToDataUrl(big, browser), /too detailed/);
  });
});
