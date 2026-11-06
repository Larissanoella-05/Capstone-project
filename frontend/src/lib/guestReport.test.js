import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_PHOTO_BYTES,
  accuracyText,
  buildGuestPayload,
  isMeterNumber,
  locationErrorMessage,
  normalisePhone,
  parseSavedReports,
  placeLabel,
  photoProblem,
  pointFromPosition,
  rememberReport,
  reporterName,
  reporterPhone,
  telHref,
  trackingPath,
  validateGuestForm,
} from './guestReport.js';

const point = { latitude: -1.95, longitude: 30.17, accuracyM: 30 };
const form = (extra = {}) => ({
  category: 'POWER_OUTAGE',
  contactPhone: '078 812 3456',
  point,
  placeText: '',
  claimedMeter: '',
  description: '',
  ...extra,
});

describe('normalisePhone', () => {
  it('writes every usual form of a Rwandan mobile as +2507XXXXXXXX', () => {
    for (const input of ['0788123456', '078 812 3456', '+250788123456', '250788123456']) {
      assert.equal(normalisePhone(input), '+250788123456', input);
    }
  });

  it('rejects anything that is not a Rwandan mobile', () => {
    for (const input of ['', '12345', '0711234567', '+254712345678', '2727', undefined]) {
      assert.equal(normalisePhone(input), null, String(input));
    }
  });
});

describe('isMeterNumber', () => {
  it('accepts 11 or 13 digits, spaces allowed', () => {
    assert.equal(isMeterNumber('0123 4567 890'), true);
    assert.equal(isMeterNumber('0123456789012'), true);
  });

  it('rejects other lengths and letters', () => {
    for (const value of ['12345', '0123456789', 'ABCDEFGHIJK', '012345678901']) {
      assert.equal(isMeterNumber(value), false, value);
    }
  });
});

describe('validateGuestForm', () => {
  it('is empty for a complete form', () => {
    assert.deepEqual(validateGuestForm(form()), {});
  });

  it('needs a category', () => {
    assert.equal(validateGuestForm(form({ category: '' })).category, 'Choose the type of fault.');
  });

  it('needs a Rwandan mobile number and says how to write it', () => {
    for (const contactPhone of ['', '12345']) {
      assert.match(validateGuestForm(form({ contactPhone })).contactPhone, /078/);
    }
  });

  it('needs a point or a written place', () => {
    const errors = validateGuestForm(form({ point: null, placeText: '  ' }));
    assert.match(errors.location, /location|place/i);
  });

  it('accepts a written place without a point', () => {
    assert.deepEqual(validateGuestForm(form({ point: null, placeText: 'Near the blue gate' })), {});
  });

  it('checks the meter number only when one is given', () => {
    assert.equal(validateGuestForm(form({ claimedMeter: '' })).claimedMeter, undefined);
    assert.match(validateGuestForm(form({ claimedMeter: '123' })).claimedMeter, /11 or 13/);
  });

  it('limits the written place and the description', () => {
    assert.ok(validateGuestForm(form({ placeText: 'x'.repeat(301) })).location);
    assert.ok(validateGuestForm(form({ description: 'x'.repeat(1001) })).description);
  });
});

describe('buildGuestPayload', () => {
  it('sends the point with its accuracy and leaves out what is empty', () => {
    assert.deepEqual(buildGuestPayload(form({ description: ' No power ' })), {
      category: 'POWER_OUTAGE',
      contactPhone: '078 812 3456',
      latitude: -1.95,
      longitude: 30.17,
      accuracyM: 30,
      description: 'No power',
    });
  });

  it('sends the written place, the meter and the photo when given', () => {
    const body = buildGuestPayload(
      form({
        point: null,
        placeText: ' Near the blue gate ',
        claimedMeter: '0123 4567 890',
        photo: { dataUrl: 'data:image/png;base64,AAAA' },
      })
    );
    assert.equal(body.placeText, 'Near the blue gate');
    assert.equal(body.claimedMeter, '0123 4567 890');
    assert.equal(body.photo, 'data:image/png;base64,AAAA');
    assert.equal('latitude' in body, false);
  });

  it('keeps the written place next to a point, since it helps the technician', () => {
    assert.equal(buildGuestPayload(form({ placeText: 'Blue gate' })).placeText, 'Blue gate');
  });
});

describe('pointFromPosition', () => {
  it('keeps six decimals and a whole number of metres', () => {
    assert.deepEqual(
      pointFromPosition({
        coords: { latitude: -1.9500001234, longitude: 30.1712349, accuracy: 29.6 },
      }),
      { latitude: -1.95, longitude: 30.171235, accuracyM: 30 }
    );
  });

  it('treats a missing accuracy as unknown, not zero', () => {
    const result = pointFromPosition({
      coords: { latitude: 1, longitude: 2, accuracy: undefined },
    });
    assert.equal(result.accuracyM, undefined);
  });
});

describe('accuracyText', () => {
  it('describes a good, a fair and a poor position in words', () => {
    assert.equal(accuracyText(20), 'Accurate to about 20 m');
    assert.equal(accuracyText(150), 'Roughly 150 m, check the place below');
    assert.equal(accuracyText(2400), 'Very rough, about 2.4 km. Describe the place below');
  });

  it('says nothing when the accuracy is unknown', () => {
    assert.equal(accuracyText(undefined), '');
  });
});

describe('locationErrorMessage', () => {
  it('explains each way finding the location can fail, and always offers the written place', () => {
    for (const code of [1, 2, 3, 99]) {
      assert.match(locationErrorMessage(code), /describe the place/i, String(code));
    }
    assert.match(locationErrorMessage(1), /blocked/i);
    assert.match(locationErrorMessage(3), /too long/i);
  });
});

describe('photoProblem', () => {
  it('accepts an image under 1 MB', () => {
    assert.equal(photoProblem({ type: 'image/jpeg', size: 500_000 }), null);
  });

  it('refuses something that is not an image or is too big', () => {
    assert.match(photoProblem({ type: 'application/pdf', size: 10 }), /image/i);
    assert.match(photoProblem({ type: 'image/png', size: MAX_PHOTO_BYTES + 1 }), /1 MB/);
  });
});

describe('reports remembered on this phone', () => {
  const entry = (n) => ({ token: `t${n}`, reference: `FR-${1000 + n}`, savedAt: n });

  it('puts the newest first and keeps at most ten', () => {
    let list = [];
    for (let n = 1; n <= 12; n += 1) list = rememberReport(list, entry(n));
    assert.equal(list.length, 10);
    assert.equal(list[0].token, 't12');
  });

  it('does not repeat a report that is saved twice', () => {
    const list = rememberReport(rememberReport([], entry(1)), entry(1));
    assert.equal(list.length, 1);
  });

  it('reads saved text back and ignores anything that is not a list of reports', () => {
    assert.deepEqual(parseSavedReports(JSON.stringify([entry(1)])), [entry(1)]);
    for (const bad of [null, '', 'not json', '{}', '[1,2]', '[{"token":5}]']) {
      assert.deepEqual(parseSavedReports(bad), [], String(bad));
    }
  });
});

describe('trackingPath', () => {
  it('is the page a tracking link opens', () => {
    assert.equal(trackingPath('abc'), '/track/abc');
  });
});

describe('reporterName and reporterPhone', () => {
  it('use the customer for a registered report', () => {
    const fault = { customer: { name: 'Aline', phone: '+250788000001' }, contactPhone: null };
    assert.equal(reporterName(fault), 'Aline');
    assert.equal(reporterPhone(fault), '+250788000001');
  });

  it('prefer the contact phone given on the report', () => {
    const fault = {
      customer: { name: 'Aline', phone: '+250788000001' },
      contactPhone: '+250788000009',
    };
    assert.equal(reporterPhone(fault), '+250788000009');
  });

  it('say Guest reporter for a report with no customer and read the phone they gave', () => {
    const fault = { customer: null, contactPhone: '+250788123456' };
    assert.equal(reporterName(fault), 'Guest reporter');
    assert.equal(reporterPhone(fault), '+250788123456');
  });

  it('give an empty phone when there is none', () => {
    assert.equal(reporterPhone({ customer: null, contactPhone: null }), '');
  });
});

describe('placeLabel', () => {
  it('shows the cell when it is known', () => {
    assert.equal(
      placeLabel({ cell: 'Kibenga', landmark: 'Near the shop', sector: 'Ndera' }),
      'Kibenga'
    );
  });

  it('shows what the guest wrote while the cell is unknown', () => {
    assert.equal(
      placeLabel({ cell: 'Unknown', landmark: ' Behind the church ', sector: 'Ndera' }),
      'Behind the church'
    );
  });

  it('falls back to the sector when the guest wrote nothing, or there is no location', () => {
    assert.equal(placeLabel({ cell: 'Unknown', landmark: null, sector: 'Ndera' }), 'Ndera Sector');
    assert.equal(placeLabel({ cell: 'Unknown', landmark: '  ', sector: 'Ndera' }), 'Ndera Sector');
    assert.equal(placeLabel(null), '—');
  });
});

describe('telHref', () => {
  it('makes a dialable link from the usual ways of writing a number', () => {
    assert.equal(telHref('+250788123456'), 'tel:+250788123456');
    assert.equal(telHref('+250 788 123 456'), 'tel:+250788123456');
    assert.equal(telHref('078-812-3456'), 'tel:0788123456');
  });

  it('gives null when there is no number to dial', () => {
    for (const value of ['', '   ', null, undefined, 'n/a', '12', '+25078812345678901']) {
      assert.equal(telHref(value), null, String(value));
    }
  });
});
