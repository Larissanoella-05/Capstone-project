// Unit tests for the paging helpers used by the coordinator fault list. Run with: npm test
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PAGE_SIZE, pageSummary, pagedPath } from './paging.js';

describe('pageSummary', () => {
  it('describes the first page', () => {
    assert.deepEqual(pageSummary({ page: 1, pageSize: 20, total: 53 }), {
      from: 1,
      to: 20,
      total: 53,
      hasPrevious: false,
      hasNext: true,
    });
  });

  it('shortens the last page to what is left', () => {
    assert.deepEqual(pageSummary({ page: 3, pageSize: 20, total: 53 }), {
      from: 41,
      to: 53,
      total: 53,
      hasPrevious: true,
      hasNext: false,
    });
  });

  it('has no range and no buttons when there are no results', () => {
    assert.deepEqual(pageSummary({ page: 1, pageSize: 20, total: 0 }), {
      from: 0,
      to: 0,
      total: 0,
      hasPrevious: false,
      hasNext: false,
    });
  });

  it('has no next page when the results fill the page exactly', () => {
    assert.equal(pageSummary({ page: 2, pageSize: 20, total: 40 }).hasNext, false);
  });
});

describe('pagedPath', () => {
  it('adds the filters that are set and always the page and page size', () => {
    const path = pagedPath({
      status: 'OPEN',
      priority: 'HIGH',
      date: 'WEEK',
      search: 'kibenga',
      page: 2,
    });
    const params = new URL(path, 'http://x').searchParams;
    assert.equal(path.startsWith('/faults?'), true);
    assert.equal(params.get('status'), 'OPEN');
    assert.equal(params.get('priority'), 'HIGH');
    assert.equal(params.get('date'), 'WEEK');
    assert.equal(params.get('search'), 'kibenga');
    assert.equal(params.get('page'), '2');
    assert.equal(params.get('pageSize'), String(PAGE_SIZE));
  });

  it('leaves out the filters that mean "everything"', () => {
    const params = new URL(
      pagedPath({ status: 'ALL', priority: 'ALL', date: 'ANY', search: '', page: 1 }),
      'http://x'
    ).searchParams;
    assert.equal(params.has('priority'), false);
    assert.equal(params.has('date'), false);
    assert.equal(params.has('search'), false);
    assert.equal(params.get('status'), 'ALL');
  });

  it('encodes the search text', () => {
    const path = pagedPath({ status: 'ALL', search: 'a&b c', page: 1 });
    assert.equal(new URL(path, 'http://x').searchParams.get('search'), 'a&b c');
  });
});
