import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { listQuerySchema } from '../../src/validators/fault.schemas.js';

const parse = (query) => listQuerySchema.safeParse(query);
const message = (query) => {
  const result = parse(query);
  return result.success ? null : result.error.issues[0].message;
};

describe('listQuerySchema', () => {
  it('accepts a request with no query at all', () => {
    assert.equal(parse({}).success, true);
  });

  it('accepts every filter the coordinator page can send', () => {
    const result = parse({
      status: 'OPEN',
      priority: 'HIGH',
      date: 'WEEK',
      search: 'kibenga',
      page: '2',
      pageSize: '20',
    });
    assert.equal(result.success, true);
  });

  it('turns page and pageSize from text into whole numbers', () => {
    const data = parse({ page: '3', pageSize: '10' }).data;
    assert.equal(data.page, 3);
    assert.equal(data.pageSize, 10);
  });

  it('accepts every real fault status, OPEN and ALL', () => {
    for (const status of [
      'OPEN',
      'ALL',
      'REPORTED',
      'ASSIGNED',
      'ON_THE_WAY',
      'ARRIVED',
      'WORKING',
      'RESOLVED',
      'CANCELLED',
    ]) {
      assert.equal(parse({ status }).success, true, status);
    }
  });

  it('accepts the largest page size, 100', () => {
    assert.equal(parse({ pageSize: '100' }).success, true);
  });

  it('rejects a page that is zero, negative, fractional or not a number', () => {
    for (const page of ['0', '-1', '1.5', 'abc']) {
      assert.match(message({ page }), /page/i, page);
    }
  });

  it('rejects a page size of zero, over 100, or not a number', () => {
    for (const pageSize of ['0', '101', '1000', 'abc']) {
      assert.match(message({ pageSize }), /page size/i, pageSize);
    }
  });

  it('rejects an unknown status, priority or date', () => {
    assert.match(message({ status: 'banana' }), /status/i);
    assert.match(message({ priority: 'URGENT' }), /priority/i);
    assert.match(message({ date: 'YESTERDAY' }), /date/i);
  });

  it('trims the search text and treats blank as no search', () => {
    assert.equal(parse({ search: '  power  ' }).data.search, 'power');
    assert.equal(parse({ search: '   ' }).data.search, undefined);
  });

  it('refuses a search longer than 100 characters', () => {
    assert.equal(parse({ search: 'x'.repeat(101) }).success, false);
  });

  it('ignores query parameters it does not know', () => {
    assert.equal(parse({ utm_source: 'x' }).success, true);
  });
});
