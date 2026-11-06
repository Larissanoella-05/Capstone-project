import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { faultCell, faultPlace, faultPoint } from '../../src/domain/faultPoint.js';

describe('faultCell', () => {
  it('prefers the registered location, then the cell on the report, then Unknown', () => {
    assert.equal(faultCell({ serviceLocation: { cell: 'Kibenga' }, cell: 'Other' }), 'Kibenga');
    assert.equal(faultCell({ serviceLocation: null, cell: 'Kibenga' }), 'Kibenga');
    assert.equal(faultCell({ serviceLocation: null, cell: null }), 'Unknown');
  });
});

describe('faultPoint', () => {
  it('uses the registered service location when the report has one', () => {
    const fault = {
      serviceLocation: { latitude: -1.95, longitude: 30.17 },
      latitude: -1.9,
      longitude: 30.1,
    };
    assert.deepEqual(faultPoint(fault), { latitude: -1.95, longitude: 30.17 });
  });

  it('uses the coordinates stored on the report when there is no registered location', () => {
    const fault = { serviceLocation: null, latitude: -1.9, longitude: 30.1 };
    assert.deepEqual(faultPoint(fault), { latitude: -1.9, longitude: 30.1 });
  });

  it('accepts a point on the equator or the prime meridian', () => {
    const fault = { serviceLocation: null, latitude: 0, longitude: 0 };
    assert.deepEqual(faultPoint(fault), { latitude: 0, longitude: 0 });
  });

  it('is null when the report was given a written place only', () => {
    assert.equal(faultPoint({ serviceLocation: null, latitude: null, longitude: null }), null);
    assert.equal(faultPoint({ serviceLocation: null }), null);
  });

  it('is null for a half-filled pair of coordinates', () => {
    assert.equal(faultPoint({ serviceLocation: null, latitude: -1.9, longitude: null }), null);
  });
});

describe('faultPlace', () => {
  it('says "Kibenga Cell" when the cell is known', () => {
    assert.equal(faultPlace({ serviceLocation: { cell: 'Kibenga' } }), 'Kibenga Cell');
    assert.equal(
      faultPlace({ serviceLocation: null, cell: 'Kibenga', placeText: 'Near the shop' }),
      'Kibenga Cell'
    );
  });

  it('uses what a guest wrote while the cell is unknown, then the sector', () => {
    assert.equal(
      faultPlace({ serviceLocation: null, cell: null, placeText: ' Near the shop ' }),
      'Near the shop'
    );
    assert.equal(
      faultPlace({ serviceLocation: null, cell: null, placeText: '  ' }),
      'Ndera Sector'
    );
    assert.equal(faultPlace({ serviceLocation: null, cell: null }), 'Ndera Sector');
  });
});
