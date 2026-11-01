import { prisma } from '../lib/prisma.js';
import { ACTIVE_JOB_STATUSES, OPEN_STATUSES, STATUS_FLOW } from '../utils/constants.js';

// The averages are worked out by PostgreSQL, so the API reads a few numbers instead of every fault.
// Intervals are minutes between two stage times. A pair is left out if either time is missing or the
// second is earlier than the first (a clock error), exactly as the figures have always been counted.

/** @typedef {{ responseMinutes: number | null }} OverviewRow */
/**
 * @typedef {{
 *   totalReports: number, completedJobs: number,
 *   responseMinutes: number | null, assignmentMinutes: number | null, arrivalMinutes: number | null,
 *   locationIdentificationMinutes: number | null, travelMinutes: number | null, onSiteMinutes: number | null,
 *   measuredJobs: number, averageMetres: number | null, medianMetres: number | null,
 *   contacts: number, jobsWithNoContact: number,
 * }} AnalyticsRow
 */

/** Rounds to one decimal place; null stays null (nothing to average). */
const oneDecimal = (value) => (value === null ? null : Math.round(value * 10) / 10);

function startOfDay(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

/** Numbers for the coordinator dashboard tiles. */
export async function getOverview() {
  const [byStatus, technicians, resolvedToday, [timed]] = await Promise.all([
    prisma.faultReport.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.technician.findMany({
      select: {
        onDuty: true,
        _count: { select: { faults: { where: { status: { in: ACTIVE_JOB_STATUSES } } } } },
      },
    }),
    prisma.faultReport.count({ where: { status: 'RESOLVED', resolvedAt: { gte: startOfDay() } } }),
    // Every fault that has an arrival time counts here, cancelled or not.
    /** @type {Promise<OverviewRow[]>} */ (
      prisma.$queryRaw`
      SELECT (AVG(EXTRACT(EPOCH FROM ("arrivedAt" - "reportedAt")) / 60)
                FILTER (WHERE "arrivedAt" >= "reportedAt"))::float8 AS "responseMinutes"
      FROM "FaultReport"
      WHERE "arrivedAt" IS NOT NULL`
    ),
  ]);

  const count = (status) => byStatus.find((row) => row.status === status)?._count._all ?? 0;
  const onDuty = technicians.filter((technician) => technician.onDuty);

  return {
    openFaults: OPEN_STATUSES.reduce((sum, status) => sum + count(status), 0),
    reported: count('REPORTED'),
    assigned: count('ASSIGNED'),
    onTheWay: count('ON_THE_WAY'),
    onSite: count('ARRIVED') + count('WORKING'),
    resolved: count('RESOLVED'),
    resolvedToday,
    techniciansOnDuty: onDuty.length,
    techniciansAvailable: onDuty.filter((technician) => technician._count.faults === 0).length,
    averageResponseMinutes: oneDecimal(timed.responseMinutes),
  };
}

/** Response-performance report, calculated from the time stored at each status change. Cancelled faults are left out. */
export async function getAnalytics() {
  const weekStart = startOfDay(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));

  const [[figures], statusCounts, recentlyResolved] = await Promise.all([
    /** @type {Promise<AnalyticsRow[]>} */ (
      prisma.$queryRaw`
      SELECT
        COUNT(*)::int AS "totalReports",
        (COUNT(*) FILTER (WHERE "status" = 'RESOLVED'))::int AS "completedJobs",
        (AVG(EXTRACT(EPOCH FROM ("arrivedAt" - "reportedAt")) / 60)
          FILTER (WHERE "arrivedAt" >= "reportedAt"))::float8 AS "responseMinutes",
        (AVG(EXTRACT(EPOCH FROM ("assignedAt" - "reportedAt")) / 60)
          FILTER (WHERE "assignedAt" >= "reportedAt"))::float8 AS "assignmentMinutes",
        (AVG(EXTRACT(EPOCH FROM ("arrivedAt" - "assignedAt")) / 60)
          FILTER (WHERE "arrivedAt" >= "assignedAt"))::float8 AS "arrivalMinutes",
        (AVG(EXTRACT(EPOCH FROM ("onTheWayAt" - "assignedAt")) / 60)
          FILTER (WHERE "onTheWayAt" >= "assignedAt"))::float8 AS "locationIdentificationMinutes",
        (AVG(EXTRACT(EPOCH FROM ("arrivedAt" - "onTheWayAt")) / 60)
          FILTER (WHERE "arrivedAt" >= "onTheWayAt"))::float8 AS "travelMinutes",
        (AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "arrivedAt")) / 60)
          FILTER (WHERE "resolvedAt" >= "arrivedAt"))::float8 AS "onSiteMinutes",
        COUNT("arrivalDistanceM")::int AS "measuredJobs",
        AVG("arrivalDistanceM")::float8 AS "averageMetres",
        (percentile_cont(0.5) WITHIN GROUP (ORDER BY "arrivalDistanceM"))::float8 AS "medianMetres",
        COALESCE(SUM("clarificationContacts") FILTER (WHERE "status" = 'RESOLVED'), 0)::int AS "contacts",
        (COUNT(*) FILTER (WHERE "status" = 'RESOLVED' AND "clarificationContacts" = 0))::int AS "jobsWithNoContact"
      FROM "FaultReport"
      WHERE "status" <> 'CANCELLED'`
    ),
    prisma.faultReport.groupBy({
      by: ['status'],
      where: { status: { not: 'CANCELLED' } },
      _count: { _all: true },
    }),
    prisma.faultReport.findMany({
      where: { status: 'RESOLVED', resolvedAt: { gte: weekStart } },
      select: { resolvedAt: true },
    }),
  ]);

  const days = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const start = startOfDay(new Date(Date.now() - offset * 24 * 60 * 60 * 1000));
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    days.push({
      date: start,
      label: offset === 0 ? 'Today' : start.toLocaleDateString('en-GB', { weekday: 'short' }),
      completed: recentlyResolved.filter(
        (fault) => fault.resolvedAt >= start && fault.resolvedAt < end
      ).length,
    });
  }

  const completed = figures.completedJobs;
  return {
    totalReports: figures.totalReports,
    completedJobs: completed,
    averages: {
      responseMinutes: oneDecimal(figures.responseMinutes),
      assignmentMinutes: oneDecimal(figures.assignmentMinutes),
      arrivalMinutes: oneDecimal(figures.arrivalMinutes),
      locationIdentificationMinutes: oneDecimal(figures.locationIdentificationMinutes),
      travelMinutes: oneDecimal(figures.travelMinutes),
      onSiteMinutes: oneDecimal(figures.onSiteMinutes),
    },
    arrivalDistance: {
      measuredJobs: figures.measuredJobs,
      averageMetres: figures.averageMetres === null ? null : Math.round(figures.averageMetres),
      medianMetres: figures.medianMetres === null ? null : Math.round(figures.medianMetres),
    },
    clarification: {
      total: figures.contacts,
      perJob: completed ? Math.round((figures.contacts / completed) * 10) / 10 : null,
      jobsWithNoContactPercent: completed
        ? Math.round((figures.jobsWithNoContact / completed) * 100)
        : null,
    },
    statusDistribution: STATUS_FLOW.map((status) => ({
      status,
      count: statusCounts.find((row) => row.status === status)?._count._all ?? 0,
    })),
    completedLast7Days: days,
  };
}
