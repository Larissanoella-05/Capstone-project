// Unit tests for the distance label used on the analytics and fault pages. Run with: npm test
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fmtMetres } from './distance.js';

describe('fmtMetres', () => {
  it('shows a dash when the distance was not measured', () => {
    assert.equal(fmtMetres(null), '—');
    assert.equal(fmtMetres(undefined), '—');
  });

  it('shows whole metres under a kilometre, including zero', () => {
    assert.equal(fmtMetres(0), '0 m');
    assert.equal(fmtMetres(42), '42 m');
    assert.equal(fmtMetres(999), '999 m');
  });

  it('switches to kilometres with one decimal from 1,000 m', () => {
    assert.equal(fmtMetres(1000), '1.0 km');
    assert.equal(fmtMetres(1249), '1.2 km');
    assert.equal(fmtMetres(12500), '12.5 km');
  });
});
