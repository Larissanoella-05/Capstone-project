import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { guestCreateSchema } from '../../src/validators/fault.schemas.js';

const valid = (extra = {}) => ({
  category: 'POWER_OUTAGE',
  contactPhone: '078 812 3456',
  latitude: -1.9,
  longitude: 30.1,
  accuracyM: 25,
  ...extra,
});

const messages = (result) => result.error.issues.map((issue) => issue.message);

describe('guestCreateSchema', () => {
  it('accepts a report with a category, a phone and a point', () => {
    const result = guestCreateSchema.safeParse(valid());
    assert.ok(result.success);
    assert.equal(result.data.contactPhone, '+250788123456'); // normalised
    assert.equal(result.data.locationSource, 'GPS');
  });

  it('accepts a written place instead of a point', () => {
    const result = guestCreateSchema.safeParse(
      valid({
        latitude: undefined,
        longitude: undefined,
        accuracyM: undefined,
        placeText: 'Near the blue gate, Kibenga',
      })
    );
    assert.ok(result.success);
    assert.equal(result.data.locationSource, 'TYPED');
  });

  it('needs a point or a written place', () => {
    const result = guestCreateSchema.safeParse(
      valid({ latitude: undefined, longitude: undefined, accuracyM: undefined })
    );
    assert.ok(!result.success);
    assert.ok(messages(result).some((message) => /where|place|location/i.test(message)));
  });

  it('needs a Rwandan mobile number', () => {
    for (const contactPhone of [undefined, '', '12345', '+254712345678']) {
      const result = guestCreateSchema.safeParse(valid({ contactPhone }));
      assert.ok(!result.success, String(contactPhone));
    }
  });

  it('needs a category', () => {
    assert.ok(!guestCreateSchema.safeParse(valid({ category: undefined })).success);
    assert.ok(!guestCreateSchema.safeParse(valid({ category: 'FIRE' })).success);
  });

  it('rejects coordinates outside the world', () => {
    assert.ok(!guestCreateSchema.safeParse(valid({ latitude: 91 })).success);
    assert.ok(!guestCreateSchema.safeParse(valid({ longitude: -181 })).success);
  });

  it('needs both coordinates or neither', () => {
    const result = guestCreateSchema.safeParse(
      valid({ longitude: undefined, placeText: 'Kibenga' })
    );
    assert.ok(!result.success);
  });

  it('accepts a meter number of 11 or 13 digits, spaces allowed, and rejects others', () => {
    const ok11 = guestCreateSchema.safeParse(valid({ claimedMeter: '0123 4567 890' }));
    assert.ok(ok11.success);
    assert.equal(ok11.data.claimedMeter, '01234567890');
    assert.ok(guestCreateSchema.safeParse(valid({ claimedMeter: '0123456789012' })).success);
    assert.ok(!guestCreateSchema.safeParse(valid({ claimedMeter: '12345' })).success);
    assert.ok(!guestCreateSchema.safeParse(valid({ claimedMeter: 'ABCDEFGHIJK' })).success);
  });

  it('treats an empty meter number as not given', () => {
    const result = guestCreateSchema.safeParse(valid({ claimedMeter: '  ' }));
    assert.ok(result.success);
    assert.equal(result.data.claimedMeter, undefined);
  });

  it('limits the written place and the description', () => {
    assert.ok(!guestCreateSchema.safeParse(valid({ placeText: 'x'.repeat(301) })).success);
    assert.ok(!guestCreateSchema.safeParse(valid({ description: 'x'.repeat(1001) })).success);
  });

  it('only accepts an image data URL under the size limit as the photo', () => {
    assert.ok(guestCreateSchema.safeParse(valid({ photo: 'data:image/png;base64,AAAA' })).success);
    assert.ok(!guestCreateSchema.safeParse(valid({ photo: 'http://example.com/a.png' })).success);
    assert.ok(
      !guestCreateSchema.safeParse(
        valid({ photo: `data:image/png;base64,${'A'.repeat(1_500_000)}` })
      ).success
    );
  });

  it('keeps the honeypot field empty-or-absent only', () => {
    assert.ok(guestCreateSchema.safeParse(valid({ website: '' })).success);
    assert.ok(!guestCreateSchema.safeParse(valid({ website: 'http://spam.example' })).success);
  });

  it('ignores fields a guest must not set', () => {
    const result = guestCreateSchema.safeParse(valid({ customerId: 1, priority: 'CRITICAL' }));
    assert.ok(result.success);
    assert.equal('customerId' in result.data, false);
    assert.equal('priority' in result.data, false);
  });
});
