import { CATEGORY_LABEL, OPEN_STATUSES } from '../utils/constants.js';

/** Limits a query to the faults the signed-in user is allowed to see. */
export function scopeFor(user) {
  if (user.role === 'CUSTOMER') return { customerId: user.customer.id };
  if (user.role === 'TECHNICIAN') return { technicianId: user.technician.id };
  return {}; // coordinators see everything
}

/**
 * Builds the database filter for the fault list: the signed-in user's scope plus the optional
 * status, priority, date and search filters from the query string.
 */
export function buildFaultFilter(user, query = {}) {
  /** @type {import('@prisma/client').Prisma.FaultReportWhereInput} */
  const where = { ...scopeFor(user) };
  const { status, priority, search, date } = query;

  if (status === 'OPEN') where.status = { in: OPEN_STATUSES };
  else if (status && status !== 'ALL') where.status = status;

  if (priority && priority !== 'ALL') where.priority = priority;

  if (date === 'TODAY') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    where.reportedAt = { gte: start };
  } else if (date === 'WEEK') {
    where.reportedAt = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
  }

  const term = typeof search === 'string' ? search.trim() : '';
  if (term) {
    const contains = { contains: term, mode: /** @type {const} */ ('insensitive') };
    const categoryMatches = Object.entries(CATEGORY_LABEL)
      .filter(([, label]) => label.toLowerCase().includes(term.toLowerCase()))
      .map(([category]) => /** @type {import('@prisma/client').FaultCategory} */ (category));
    where.OR = [
      { reference: contains },
      { description: contains },
      { serviceLocation: { cell: contains } },
      { serviceLocation: { village: contains } },
      { customer: { user: { name: contains } } },
      { technician: { user: { name: contains } } },
      ...(categoryMatches.length ? [{ category: { in: categoryMatches } }] : []),
    ];
  }
  return where;
}
