/** @typedef {import('@prisma/client').FaultStatus} FaultStatus */

/**
 * The order a fault moves through. A technician can only move one step forward.
 * @type {FaultStatus[]}
 */
export const STATUS_FLOW = ['REPORTED', 'ASSIGNED', 'ON_THE_WAY', 'ARRIVED', 'WORKING', 'RESOLVED'];

/**
 * Statuses that count as "open" (still needing work).
 * @type {FaultStatus[]}
 */
export const OPEN_STATUSES = ['REPORTED', 'ASSIGNED', 'ON_THE_WAY', 'ARRIVED', 'WORKING'];

/**
 * Statuses where a technician is busy with the fault.
 * @type {FaultStatus[]}
 */
export const ACTIVE_JOB_STATUSES = ['ASSIGNED', 'ON_THE_WAY', 'ARRIVED', 'WORKING'];

/** Which timestamp column is stamped when a fault enters a status. */
export const STATUS_TIMESTAMP = {
  REPORTED: 'reportedAt',
  ASSIGNED: 'assignedAt',
  ON_THE_WAY: 'onTheWayAt',
  ARRIVED: 'arrivedAt',
  WORKING: 'workingAt',
  RESOLVED: 'resolvedAt',
  CANCELLED: 'cancelledAt',
};

/** Starting priority by category. The coordinator can change it afterwards. */
export const DEFAULT_PRIORITY = {
  DAMAGED_CONNECTION: 'CRITICAL',
  POWER_OUTAGE: 'HIGH',
  LOW_VOLTAGE: 'MEDIUM',
  METER_ISSUE: 'LOW',
  OTHER: 'MEDIUM',
};

export const CATEGORY_LABEL = {
  POWER_OUTAGE: 'Power outage',
  LOW_VOLTAGE: 'Low voltage',
  DAMAGED_CONNECTION: 'Damaged connection',
  METER_ISSUE: 'Meter issue',
  OTHER: 'Other',
};
