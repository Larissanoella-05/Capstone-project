import { prisma } from '../lib/prisma.js';
import { ACTIVE_JOB_STATUSES, OPEN_STATUSES, STATUS_FLOW } from '../utils/constants.js';

const minutesBetween = (from, to) =>
  from && to ? (new Date(to).getTime() - new Date(from).getTime()) / 60000 : null;

function average(values) {
  const valid = values.filter((value) => value !== null && value >= 0);
  if (!valid.length) return null;
  return Math.round((valid.reduce((sum, value) => sum + value, 0) / valid.length) * 10) / 10;
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function startOfDay(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

/** Numbers for the coordinator dashboard tiles. */
export async function getOverview() {
  const [byStatus, technicians, resolvedToday, timed] = await Promise.all([
    prisma.faultReport.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.technician.findMany({
      select: {
        onDuty: true,
        _count: { select: { faults: { where: { status: { in: ACTIVE_JOB_STATUSES } } } } },
      },
    }),
    prisma.faultReport.count({ where: { status: 'RESOLVED', resolvedAt: { gte: startOfDay() } } }),
    prisma.faultReport.findMany({
      where: { arrivedAt: { not: null } },
      select: { reportedAt: true, arrivedAt: true },
    }),
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
    averageResponseMinutes: average(
      timed.map((fault) => minutesBetween(fault.reportedAt, fault.arrivedAt))
    ),
  };
}

/** Response-performance report, calculated from the time stored at each status change. */
export async function getAnalytics() {
  const faults = await prisma.faultReport.findMany({
    where: { status: { not: 'CANCELLED' } },
    select: {
      status: true,
      reportedAt: true,
      assignedAt: true,
      onTheWayAt: true,
      arrivedAt: true,
      arrivalDistanceM: true,
      resolvedAt: true,
      clarificationContacts: true,
    },
  });

  const resolved = faults.filter((fault) => fault.status === 'RESOLVED');
  const totalContacts = resolved.reduce((sum, fault) => sum + fault.clarificationContacts, 0);

  const arrivalDistances = faults
    .map((fault) => fault.arrivalDistanceM)
    .filter((metres) => metres !== null);

  const days = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const start = startOfDay(new Date(Date.now() - offset * 24 * 60 * 60 * 1000));
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    days.push({
      date: start,
      label: offset === 0 ? 'Today' : start.toLocaleDateString('en-GB', { weekday: 'short' }),
      completed: resolved.filter((fault) => fault.resolvedAt >= start && fault.resolvedAt < end)
        .length,
    });
  }

  return {
    totalReports: faults.length,
    completedJobs: resolved.length,
    averages: {
      responseMinutes: average(faults.map((f) => minutesBetween(f.reportedAt, f.arrivedAt))),
      assignmentMinutes: average(faults.map((f) => minutesBetween(f.reportedAt, f.assignedAt))),
      arrivalMinutes: average(faults.map((f) => minutesBetween(f.assignedAt, f.arrivedAt))),
      locationIdentificationMinutes: average(
        faults.map((f) => minutesBetween(f.assignedAt, f.onTheWayAt))
      ),
      travelMinutes: average(faults.map((f) => minutesBetween(f.onTheWayAt, f.arrivedAt))),
      onSiteMinutes: average(faults.map((f) => minutesBetween(f.arrivedAt, f.resolvedAt))),
    },
    arrivalDistance: {
      measuredJobs: arrivalDistances.length,
      averageMetres: arrivalDistances.length
        ? Math.round(arrivalDistances.reduce((sum, m) => sum + m, 0) / arrivalDistances.length)
        : null,
      medianMetres: median(arrivalDistances),
    },
    clarification: {
      total: totalContacts,
      perJob: resolved.length ? Math.round((totalContacts / resolved.length) * 10) / 10 : null,
      jobsWithNoContactPercent: resolved.length
        ? Math.round(
            (resolved.filter((fault) => fault.clarificationContacts === 0).length /
              resolved.length) *
              100
          )
        : null,
    },
    statusDistribution: STATUS_FLOW.map((status) => ({
      status,
      count: faults.filter((fault) => fault.status === status).length,
    })),
    completedLast7Days: days,
  };
}
