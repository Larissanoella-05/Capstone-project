import { badRequest, conflict, forbidden } from '../utils/httpError.js';
import { OPEN_STATUSES, STATUS_FLOW } from '../utils/constants.js';

const humanise = (status) => status.replace(/_/g, ' ').toLowerCase();

/** REPORTED → ASSIGNED → ON_THE_WAY → ARRIVED → WORKING → RESOLVED; a coordinator can cancel any open one. */
export class FaultStatusMachine {
  /**
   * @param {string[]} flow
   * @param {string[]} openStatuses
   * @param {string[]} assignable
   */
  constructor(
    flow = STATUS_FLOW,
    openStatuses = OPEN_STATUSES,
    assignable = ['REPORTED', 'ASSIGNED']
  ) {
    this.flow = Object.freeze([...flow]);
    this.openStatuses = Object.freeze([...openStatuses]);
    this.assignable = Object.freeze([...assignable]);
  }

  isOpen(status) {
    return this.openStatuses.includes(status);
  }

  canAssign(status) {
    return this.assignable.includes(status);
  }

  /** The single status that may follow `status`, or null at the end of the flow. */
  nextStatus(status) {
    const index = this.flow.indexOf(status);
    return index === -1 ? null : (this.flow[index + 1] ?? null);
  }

  /** Throws a 409 if a technician cannot be assigned while the fault is in `status`. */
  assertAssignable(status) {
    if (!this.canAssign(status)) {
      throw conflict('A technician can only be assigned before the response has started.');
    }
  }

  /** @param {{ role: string, from: string, to: string, resolutionNote?: string }} change */
  assertTransition({ role, from, to, resolutionNote }) {
    if (to === 'CANCELLED') {
      if (role !== 'COORDINATOR')
        throw forbidden('Only a service coordinator can cancel a report.');
      if (!this.isOpen(from)) throw conflict('This report is already closed.');
      return;
    }

    if (role !== 'TECHNICIAN')
      throw forbidden('Only the assigned technician can update the response status.');

    const currentIndex = this.flow.indexOf(from);
    if (currentIndex < 1)
      throw conflict('This fault has not been assigned yet or is already closed.');

    const expected = this.nextStatus(from);
    if (to !== expected) {
      throw conflict(
        expected
          ? `The next status for this fault is ${humanise(expected)}.`
          : 'This fault is already resolved.'
      );
    }
    if (to === 'RESOLVED' && !resolutionNote) {
      throw badRequest('An outcome note is required before a fault can be resolved.');
    }
  }
}

export const faultStatusMachine = new FaultStatusMachine();
