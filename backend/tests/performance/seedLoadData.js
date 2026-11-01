/**
 * Adds synthetic faults to the TEST database so the load test has a realistic amount of data.
 *
 *   npm run test:perf:seed           # 2,000 faults
 *   npm run test:perf:seed -- 5000   # a different number (up to 20,000)
 *
 * It runs the same safety checks as the integration tests: TEST_DATABASE_URL must be set, local, end in
 * "_test", differ from DATABASE_URL and hold only demo accounts. Rows it adds have references starting
 * "LT-", and running it again replaces them, so they never pile up. Running the integration tests
 * afterwards wipes them with everything else.
 */
import { pathToFileURL } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { assertSafeTestDatabase } from '../integration/testDatabaseGuard.js';
import { LOAD_REFERENCE_PREFIX, buildLoadFaults, historyFor } from './loadData.js';

const DEFAULT_COUNT = 2000;
const MAX_COUNT = 20_000;
const CHUNK = 500;

/** @param {string | undefined} argument the number typed on the command line */
export function parseCount(argument) {
  if (argument === undefined) return DEFAULT_COUNT;
  const count = Number(argument);
  if (!Number.isInteger(count) || count < 1 || count > MAX_COUNT) {
    throw new Error(`The number of faults must be a whole number from 1 to ${MAX_COUNT}.`);
  }
  return count;
}

async function main() {
  const count = parseCount(process.argv[2] ?? process.env.LOAD_FAULTS);
  const url = process.env.TEST_DATABASE_URL;
  await assertSafeTestDatabase(url);

  const prisma = new PrismaClient({ datasourceUrl: url });
  try {
    const [customerRows, technicians, coordinator] = await Promise.all([
      prisma.customer.findMany({
        include: { serviceLocations: { orderBy: { id: 'asc' }, take: 1 } },
      }),
      prisma.technician.findMany({ select: { id: true } }),
      prisma.serviceCoordinator.findFirst({ select: { id: true } }),
    ]);
    const customers = customerRows
      .filter((customer) => customer.serviceLocations.length)
      .map((customer) => ({ id: customer.id, serviceLocationId: customer.serviceLocations[0].id }));

    const removed = await prisma.faultReport.deleteMany({
      where: { reference: { startsWith: LOAD_REFERENCE_PREFIX } },
    });

    const faults = buildLoadFaults({
      count,
      customers,
      technicianIds: technicians.map((technician) => technician.id),
      coordinatorId: coordinator?.id ?? null,
      now: new Date(),
    });

    for (let start = 0; start < faults.length; start += CHUNK) {
      await prisma.faultReport.createMany({ data: faults.slice(start, start + CHUNK) });
    }

    // The history rows need the ids the database just assigned.
    const rows = await prisma.faultReport.findMany({
      where: { reference: { startsWith: LOAD_REFERENCE_PREFIX } },
      select: { id: true, reference: true },
    });
    const ids = new Map(rows.map((row) => [row.reference, row.id]));
    const history = faults.flatMap((fault) => historyFor(fault, ids.get(fault.reference)));
    for (let start = 0; start < history.length; start += CHUNK * 4) {
      await prisma.faultStatusHistory.createMany({ data: history.slice(start, start + CHUNK * 4) });
    }

    const total = await prisma.faultReport.count();
    console.log(
      `Replaced ${removed.count} earlier load-test faults with ${faults.length} new ones ` +
        `(${history.length} history rows). The test database now holds ${total} faults.`
    );
  } finally {
    await prisma.$disconnect();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
