/**
 * Builds synthetic fault reports for load testing. Pure: no database, no clock, no Math.random,
 * so the same inputs always give the same faults and the logic can be unit tested.
 */
import { DEFAULT_PRIORITY } from '../../src/utils/constants.js';

/** @typedef {import('@prisma/client').FaultStatus} FaultStatus */
/** @typedef {import('@prisma/client').FaultCategory} FaultCategory */
/** @typedef {import('@prisma/client').Priority} Priority */
/** @typedef {'assignedAt' | 'onTheWayAt' | 'arrivedAt' | 'workingAt' | 'resolvedAt'} StageColumn */
/**
 * One fault as it is stored: Prisma's create input with the time columns narrowed to real dates.
 * @typedef {import('@prisma/client').Prisma.FaultReportCreateManyInput & {
 *   reportedAt: Date,
 *   assignedAt: Date | null,
 *   onTheWayAt: Date | null,
 *   arrivedAt: Date | null,
 *   workingAt: Date | null,
 *   resolvedAt: Date | null,
 *   cancelledAt: Date | null,
 * }} LoadFault
 */

/** Reference prefix that marks load-test rows, so a re-run can remove exactly these and nothing else. */
export const LOAD_REFERENCE_PREFIX = 'LT-';

const MINUTE_MS = 60 * 1000;

/** @type {FaultCategory[]} */
const CATEGORIES = ['POWER_OUTAGE', 'LOW_VOLTAGE', 'DAMAGED_CONNECTION', 'METER_ISSUE', 'OTHER'];

/**
 * How the faults are spread over statuses: mostly finished, as in a system that has run for a while.
 * @type {[FaultStatus, number][]}
 */
const STATUS_WEIGHTS = [
  ['RESOLVED', 60],
  ['CANCELLED', 10],
  ['REPORTED', 8],
  ['ASSIGNED', 6],
  ['ON_THE_WAY', 6],
  ['WORKING', 6],
  ['ARRIVED', 4],
];

/**
 * The stages a fault passes through, in order, with the column that holds each time.
 * @type {[FaultStatus, 'reportedAt' | StageColumn][]}
 */
const STAGES = [
  ['REPORTED', 'reportedAt'],
  ['ASSIGNED', 'assignedAt'],
  ['ON_THE_WAY', 'onTheWayAt'],
  ['ARRIVED', 'arrivedAt'],
  ['WORKING', 'workingAt'],
  ['RESOLVED', 'resolvedAt'],
];

/**
 * Minutes between one stage and the one before it: [shortest, longest].
 * @type {Record<StageColumn, [number, number]>}
 */
const GAP_MINUTES = {
  assignedAt: [2, 30],
  onTheWayAt: [1, 10],
  arrivedAt: [10, 60],
  workingAt: [1, 5],
  resolvedAt: [20, 180],
};

/** Small deterministic random number generator (mulberry32). Returns numbers in [0, 1). */
export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickStatus(random) {
  const total = STATUS_WEIGHTS.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * total;
  for (const [status, weight] of STATUS_WEIGHTS) {
    roll -= weight;
    if (roll < 0) return status;
  }
  return STATUS_WEIGHTS[0][0];
}

/**
 * @param {{
 *   count: number,
 *   customers: { id: number, serviceLocationId: number }[],
 *   technicianIds: number[],
 *   coordinatorId: number | null,
 *   now: Date,
 *   seed?: number,
 * }} options
 * @returns {LoadFault[]}
 */
export function buildLoadFaults({
  count,
  customers,
  technicianIds,
  coordinatorId,
  now,
  seed = 2026,
}) {
  if (!customers.length)
    throw new Error('At least one customer with a service location is needed.');
  if (!technicianIds.length) throw new Error('At least one technician is needed.');

  const random = seededRandom(seed);
  const between = (min, max) => min + Math.floor(random() * (max - min + 1));

  return Array.from({ length: count }, (_, index) => {
    const customer = customers[index % customers.length];
    const category = CATEGORIES[between(0, CATEGORIES.length - 1)];
    const status = pickStatus(random);

    // The report is made some time in the last 90 days, then each stage follows a few minutes later.
    const reportedAt = new Date(now.getTime() - between(1, 90 * 24 * 60) * MINUTE_MS);
    /** @type {Pick<LoadFault, 'reportedAt' | StageColumn | 'cancelledAt'>} */
    const times = {
      reportedAt,
      assignedAt: null,
      onTheWayAt: null,
      arrivedAt: null,
      workingAt: null,
      resolvedAt: null,
      cancelledAt: null,
    };

    // A cancelled fault got as far as being assigned (or not even that), never further.
    const reachedStage = status === 'CANCELLED' ? 'ASSIGNED' : status;
    const reachedIndex = STAGES.findIndex(([name]) => name === reachedStage);
    let last = reportedAt;
    for (let i = 1; i <= reachedIndex; i += 1) {
      const column = /** @type {StageColumn} */ (STAGES[i][1]);
      const [min, max] = GAP_MINUTES[column];
      last = new Date(Math.min(now.getTime(), last.getTime() + between(min, max) * MINUTE_MS));
      times[column] = last;
    }
    if (status === 'CANCELLED') {
      times.cancelledAt = new Date(Math.min(now.getTime(), last.getTime() + 5 * MINUTE_MS));
    }

    const assigned = reachedIndex >= 1;
    const resolved = status === 'RESOLVED';

    return {
      reference: `${LOAD_REFERENCE_PREFIX}${String(index + 1).padStart(5, '0')}`,
      category,
      description: `Load-test fault ${index + 1}`,
      priority: /** @type {Priority} */ (DEFAULT_PRIORITY[category]),
      status,
      customerId: customer.id,
      serviceLocationId: customer.serviceLocationId,
      technicianId: assigned ? technicianIds[between(0, technicianIds.length - 1)] : null,
      assignedById: assigned ? coordinatorId : null,
      ...times,
      arrivalDistanceM: times.arrivedAt ? between(0, 250) : null,
      outcome: resolved ? 'SUPPLY_RESTORED' : null,
      resolutionNote: resolved ? 'Load-test resolution.' : null,
      clarificationContacts: resolved ? between(0, 3) : 0,
    };
  });
}

/**
 * The status-history rows that match a built fault: one per stage it reached, plus the cancellation.
 * @param {LoadFault} fault one element of buildLoadFaults
 * @param {number} faultId the id the database gave it
 */
export function historyFor(fault, faultId) {
  const rows = STAGES.filter(([, column]) => fault[column]).map(([status, column]) => ({
    faultId,
    status,
    note: null,
    createdAt: fault[column],
  }));
  if (fault.cancelledAt) {
    rows.push({
      faultId,
      status: 'CANCELLED',
      note: 'Load-test cancellation',
      createdAt: fault.cancelledAt,
    });
  }
  return rows;
}
