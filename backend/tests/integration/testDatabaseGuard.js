/**
 * Safety checks that run BEFORE the integration tests wipe and reseed a database.
 *
 * The integration tests run prisma/seed.js, which TRUNCATEs every table. These checks make sure
 * that can only ever happen to a dedicated, local, synthetic-data test database:
 *
 *   1. TEST_DATABASE_URL must be set explicitly (no fallback to DATABASE_URL).
 *   2. Its database name must end in "_test".
 *   3. It must not point at the same server + database as the development DATABASE_URL
 *      (read from backend/.env and from the shell).
 *   4. It must be on this machine (localhost) unless ALLOW_REMOTE_TEST_DATABASE=true,
 *      so a hosted database (e.g. production on Neon) can never be wiped by mistake.
 *   5. After connecting, the server must confirm it really is that database (current_database()),
 *      and any existing users must all be synthetic demo accounts (@demo.rw).
 *
 * If any check fails, the tests stop with an explanation and nothing is changed.
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const SYNTHETIC_EMAIL = /@demo\.rw$/i;

export class UnsafeTestDatabaseError extends Error {
  constructor(message) {
    super(`Integration tests stopped, no data was changed.\n${message}`);
    this.name = 'UnsafeTestDatabaseError';
  }
}

/** host:port/database, with localhost spellings normalised so they compare equal. */
export function databaseTarget(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new UnsafeTestDatabaseError('TEST_DATABASE_URL is not a valid connection URL.');
  }
  const host = LOCAL_HOSTS.has(parsed.hostname) ? 'localhost' : parsed.hostname.toLowerCase();
  return {
    protocol: parsed.protocol,
    host,
    port: parsed.port || '5432',
    database: decodeURIComponent(parsed.pathname.replace(/^\//, '')),
    isLocal: host === 'localhost',
  };
}

const sameTarget = (a, b) => a.host === b.host && a.port === b.port && a.database === b.database;

/** The development DATABASE_URL values we must never touch: backend/.env and the shell. */
function developmentUrls() {
  const urls = [];
  const envFile = fileURLToPath(new URL('../../.env', import.meta.url));
  if (existsSync(envFile)) {
    const fromFile = dotenv.parse(readFileSync(envFile)).DATABASE_URL;
    if (fromFile) urls.push(fromFile);
  }
  if (process.env.DATABASE_URL) urls.push(process.env.DATABASE_URL);
  return urls;
}

/** Checks 1–4: configuration only, no connection. Returns the validated target. */
export function checkTestDatabaseConfig(
  testUrl = process.env.TEST_DATABASE_URL,
  devUrls = developmentUrls()
) {
  if (!testUrl) {
    throw new UnsafeTestDatabaseError(
      'TEST_DATABASE_URL is not set. Point it at a separate test database, for example:\n' +
        '  TEST_DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/umuriro_test?schema=public" npm run test:integration'
    );
  }

  const target = databaseTarget(testUrl);
  if (!/^postgres(ql)?:$/.test(target.protocol)) {
    throw new UnsafeTestDatabaseError('TEST_DATABASE_URL must be a postgresql:// URL.');
  }
  if (!target.database.endsWith('_test')) {
    throw new UnsafeTestDatabaseError(
      `The test database name must end in "_test" (got "${target.database}"). Create one such as umuriro_test.`
    );
  }
  for (const devUrl of devUrls) {
    let dev;
    try {
      dev = databaseTarget(devUrl);
    } catch {
      continue; // an unparsable DATABASE_URL cannot match a valid test URL
    }
    if (sameTarget(target, dev)) {
      throw new UnsafeTestDatabaseError(
        `TEST_DATABASE_URL points at the same database as DATABASE_URL (${dev.host}:${dev.port}/${dev.database}). ` +
          'Use a separate database for the tests.'
      );
    }
  }
  if (!target.isLocal && process.env.ALLOW_REMOTE_TEST_DATABASE !== 'true') {
    throw new UnsafeTestDatabaseError(
      `TEST_DATABASE_URL points at a remote server (${target.host}). Integration tests only run against a local ` +
        'database. Set ALLOW_REMOTE_TEST_DATABASE=true only for a remote database created just for testing.'
    );
  }
  return target;
}

/** Check 5: connect and confirm the server's identity and that it holds only synthetic data. */
export async function verifyTestDatabaseContents(testUrl, target) {
  const client = new PrismaClient({ datasourceUrl: testUrl });
  try {
    const [{ current_database: actual }] = /** @type {{ current_database: string }[]} */ (
      await client.$queryRaw`SELECT current_database()`
    );
    if (actual !== target.database) {
      throw new UnsafeTestDatabaseError(`Connected to "${actual}", expected "${target.database}".`);
    }

    const [{ exists }] = /** @type {{ exists: boolean }[]} */ (
      await client.$queryRaw`SELECT to_regclass('"User"') IS NOT NULL AS exists`
    );
    if (!exists) {
      throw new UnsafeTestDatabaseError(
        `The tables do not exist in "${actual}" yet. Run the migrations against the TEST database first:\n` +
          '  DATABASE_URL="$TEST_DATABASE_URL" npx prisma migrate deploy'
      );
    }

    const emails = /** @type {{ email: string }[]} */ (
      await client.$queryRaw`SELECT email FROM "User"`
    );
    const real = emails.filter(({ email }) => !SYNTHETIC_EMAIL.test(email));
    if (real.length) {
      throw new UnsafeTestDatabaseError(
        `"${actual}" contains ${real.length} account(s) that are not demo (@demo.rw) accounts. ` +
          'It does not look like a disposable test database, so it will not be wiped.'
      );
    }
  } finally {
    await client.$disconnect();
  }
}

/** Runs every check. Throws UnsafeTestDatabaseError if the database must not be touched. */
export async function assertSafeTestDatabase(testUrl = process.env.TEST_DATABASE_URL) {
  const target = checkTestDatabaseConfig(testUrl);
  await verifyTestDatabaseContents(testUrl, target);
  return target;
}
