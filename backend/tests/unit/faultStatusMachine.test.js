import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FaultStatusMachine } from '../../src/domain/FaultStatusMachine.js';
import { HttpError } from '../../src/utils/httpError.js';

const machine = new FaultStatusMachine();

/** Asserts that `fn` throws an HttpError with the given status code. */
function throwsHttp(fn, status, messagePart) {
  assert.throws(fn, (error) => {
    assert.ok(error instanceof HttpError, 'expected an HttpError');
    assert.equal(error.status, status);
    if (messagePart) assert.match(error.message, new RegExp(messagePart, 'i'));
    return true;
  });
}

describe('FaultStatusMachine', () => {
  it('walks the full technician flow one step at a time', () => {
    const steps = ['ASSIGNED', 'ON_THE_WAY', 'ARRIVED', 'WORKING', 'RESOLVED'];
    for (let i = 0; i < steps.length - 1; i += 1) {
      const change = {
        role: 'TECHNICIAN',
        from: steps[i],
        to: steps[i + 1],
        resolutionNote: 'done',
      };
      assert.doesNotThrow(() => machine.assertTransition(change));
    }
  });

  it('returns the next status and null at the end of the flow', () => {
    assert.equal(machine.nextStatus('REPORTED'), 'ASSIGNED');
    assert.equal(machine.nextStatus('WORKING'), 'RESOLVED');
    assert.equal(machine.nextStatus('RESOLVED'), null);
    assert.equal(machine.nextStatus('CANCELLED'), null);
  });

  it('rejects skipping a stage (ASSIGNED → ARRIVED) with 409 and names the expected stage', () => {
    throwsHttp(
      () => machine.assertTransition({ role: 'TECHNICIAN', from: 'ASSIGNED', to: 'ARRIVED' }),
      409,
      'on the way'
    );
  });

  it('rejects moving backwards', () => {
    throwsHttp(
      () => machine.assertTransition({ role: 'TECHNICIAN', from: 'WORKING', to: 'ARRIVED' }),
      409
    );
  });

  it('rejects technician updates on an unassigned report', () => {
    throwsHttp(
      () => machine.assertTransition({ role: 'TECHNICIAN', from: 'REPORTED', to: 'ON_THE_WAY' }),
      409,
      'not been assigned'
    );
  });

  it('rejects updates after resolution', () => {
    throwsHttp(
      () => machine.assertTransition({ role: 'TECHNICIAN', from: 'RESOLVED', to: 'WORKING' }),
      409
    );
  });

  it('requires an outcome note to resolve (400)', () => {
    throwsHttp(
      () => machine.assertTransition({ role: 'TECHNICIAN', from: 'WORKING', to: 'RESOLVED' }),
      400,
      'outcome note'
    );
  });

  it('only lets technicians move the response forward (403 for customer and coordinator)', () => {
    throwsHttp(
      () => machine.assertTransition({ role: 'CUSTOMER', from: 'ASSIGNED', to: 'ON_THE_WAY' }),
      403
    );
    throwsHttp(
      () => machine.assertTransition({ role: 'COORDINATOR', from: 'ASSIGNED', to: 'ON_THE_WAY' }),
      403
    );
  });

  it('lets only a coordinator cancel, and only while the report is open', () => {
    assert.doesNotThrow(() =>
      machine.assertTransition({ role: 'COORDINATOR', from: 'WORKING', to: 'CANCELLED' })
    );
    throwsHttp(
      () => machine.assertTransition({ role: 'TECHNICIAN', from: 'ASSIGNED', to: 'CANCELLED' }),
      403
    );
    throwsHttp(
      () => machine.assertTransition({ role: 'COORDINATOR', from: 'RESOLVED', to: 'CANCELLED' }),
      409,
      'already closed'
    );
    throwsHttp(
      () => machine.assertTransition({ role: 'COORDINATOR', from: 'CANCELLED', to: 'CANCELLED' }),
      409
    );
  });

  it('allows (re)assignment only before the response has started', () => {
    assert.doesNotThrow(() => machine.assertAssignable('REPORTED'));
    assert.doesNotThrow(() => machine.assertAssignable('ASSIGNED'));
    for (const status of ['ON_THE_WAY', 'ARRIVED', 'WORKING', 'RESOLVED', 'CANCELLED']) {
      throwsHttp(() => machine.assertAssignable(status), 409);
    }
  });

  it('cannot have its rules changed after construction', () => {
    assert.throws(() => machine.flow.push('EXTRA'), TypeError);
  });
});
