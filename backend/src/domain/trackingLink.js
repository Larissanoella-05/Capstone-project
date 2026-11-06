import { randomBytes } from 'node:crypto';

export const TRACKING_LINK_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;
const TOKEN = /^[A-Za-z0-9_-]{32}$/;

/** 24 random bytes as 32 URL-safe characters: the link is the only key to the report. */
export function newTrackingToken() {
  return randomBytes(24).toString('base64url');
}

/** A cheap check before the database is asked, so junk in the address never reaches a query. */
export function isTrackingTokenShape(value) {
  return typeof value === 'string' && TOKEN.test(value);
}

/**
 * The link stops working a week after the report was resolved or cancelled.
 * @param {{ status: string, resolvedAt?: Date | null, cancelledAt?: Date | null }} fault
 * @param {Date} [now]
 */
export function trackingLinkExpired(fault, now = new Date()) {
  const closedAt =
    fault.status === 'RESOLVED'
      ? fault.resolvedAt
      : fault.status === 'CANCELLED'
        ? fault.cancelledAt
        : null;
  if (!closedAt) return false;
  return now.getTime() - closedAt.getTime() > TRACKING_LINK_DAYS * DAY_MS;
}
