import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { acknowledgeNewReports, newReportsText, tabTitle, updateNewReports } from './newReports.js';

const fault = (id, status = 'REPORTED') => ({ id, status });

describe('updateNewReports', () => {
  it('does not call the reports already waiting on the first load new', () => {
    const state = updateNewReports(null, [fault(1), fault(2), fault(3, 'ASSIGNED')]);
    assert.equal(state.fresh.size, 0);
    assert.deepEqual([...state.seen].sort(), [1, 2]);
  });

  it('flags a report that appears after the first load', () => {
    let state = updateNewReports(null, [fault(1)]);
    state = updateNewReports(state, [fault(1), fault(2)]);
    assert.deepEqual([...state.fresh], [2]);
  });

  it('does not flag the same report twice', () => {
    let state = updateNewReports(null, [fault(1)]);
    state = updateNewReports(state, [fault(1), fault(2)]);
    state = acknowledgeNewReports(state);
    state = updateNewReports(state, [fault(1), fault(2)]);
    assert.equal(state.fresh.size, 0);
  });

  it('keeps counting reports that arrive while the alert is still showing', () => {
    let state = updateNewReports(null, []);
    state = updateNewReports(state, [fault(1)]);
    state = updateNewReports(state, [fault(1), fault(2)]);
    assert.deepEqual([...state.fresh].sort(), [1, 2]);
  });

  it('drops a new report once it is assigned or no longer listed', () => {
    let state = updateNewReports(null, []);
    state = updateNewReports(state, [fault(1), fault(2)]);
    state = updateNewReports(state, [fault(1, 'ASSIGNED')]);
    assert.equal(state.fresh.size, 0);
  });

  it('does not change the state it was given', () => {
    const before = updateNewReports(null, [fault(1)]);
    updateNewReports(before, [fault(1), fault(2)]);
    assert.equal(before.fresh.size, 0);
    assert.equal(before.seen.size, 1);
  });
});

describe('acknowledgeNewReports', () => {
  it('clears what is new and keeps what has been seen', () => {
    let state = updateNewReports(null, []);
    state = updateNewReports(state, [fault(5)]);
    const next = acknowledgeNewReports(state);
    assert.equal(next.fresh.size, 0);
    assert.deepEqual([...next.seen], [5]);
  });

  it('leaves an empty state alone', () => {
    assert.equal(acknowledgeNewReports(null), null);
  });
});

describe('wording', () => {
  it('says how many reports are new', () => {
    assert.equal(newReportsText(1), '1 new report needs a technician');
    assert.equal(newReportsText(3), '3 new reports need a technician');
  });

  it('puts the count in the tab title only while something is new', () => {
    assert.equal(tabTitle('Umuriro', 2), '(2) Umuriro');
    assert.equal(tabTitle('Umuriro', 0), 'Umuriro');
  });
});
