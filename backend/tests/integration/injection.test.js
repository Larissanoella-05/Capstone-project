/** SQL injection strings and role-route probes, over HTTP against PostgreSQL; refuses to run unless TEST_DATABASE_URL is a local test database. */
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { assertSafeTestDatabase } from './testDatabaseGuard.js';

const TEST_DB = process.env.TEST_DATABASE_URL;
const backendDir = fileURLToPath(new URL('../../', import.meta.url));

/** Classic strings that would change a query built by joining text, and one that would add a second statement. */
const PAYLOADS = [
  "' OR '1'='1",
  `'; DROP TABLE "FaultReport"; --`,
  '" OR 1=1 --',
  '\' UNION SELECT id, password FROM "User" --',
  'x\'); DELETE FROM "User"; --',
];
const TABLES = ['User', 'FaultReport', 'FaultStatusHistory', 'Notification'];

let server;
let baseUrl;
let prisma;
let setSmsProvider;
const tokens = {};
/** Accounts made by the registration test, removed afterwards. */
const createdUserIds = [];
let nextPhone = 788_400_000;
let nextMeter = 30_000_000_000;

/**
 * @param {string} method
 * @param {string} path
 * @param {{ token?: string, body?: unknown }} [options]
 */
async function call(method, path, { token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${baseUrl}/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await response.json().catch(() => null);
  return { status: response.status, body: json };
}

/** A different phone for every call, so the per-phone report limit never interferes. */
const freshPhone = () => `0${nextPhone++}`;

/** Row counts of the tables a successful injection would change. */
async function counts() {
  const result = {};
  for (const table of TABLES) {
    const rows = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS n FROM "${table}"`);
    result[table] = rows[0].n;
  }
  return result;
}

describe('Injection strings and role routes', { concurrency: false }, () => {
  before(async () => {
    await assertSafeTestDatabase(TEST_DB);

    process.env.DATABASE_URL = TEST_DB;
    process.env.JWT_SECRET ||= 'integration-test-secret';
    process.env.NODE_ENV = 'test';

    execFileSync(process.execPath, ['prisma/seed.js'], {
      cwd: backendDir,
      env: { ...process.env, DATABASE_URL: TEST_DB },
      stdio: 'ignore',
    });

    const { createApp } = await import('../../src/app.js');
    ({ prisma } = await import('../../src/lib/prisma.js'));
    ({ setSmsProvider } = await import('../../src/services/smsService.js'));
    setSmsProvider({ send: async () => {} });
    server = createApp().listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;

    const accounts = {
      aline: 'aline@demo.rw',
      grace: 'grace@demo.rw',
      jeanclaude: 'jeanclaude@demo.rw',
    };
    for (const [key, email] of Object.entries(accounts)) {
      const res = await call('POST', '/auth/login', { body: { email, password: 'demo1234' } });
      assert.equal(res.status, 200, `login failed for ${email}`);
      tokens[key] = res.body.token;
    }
  });

  after(async () => {
    if (prisma) {
      // The guard only accepts a test database that holds nothing but @demo.rw accounts.
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
    if (server) await new Promise((resolve) => server.close(resolve));
    await prisma?.$disconnect();
  });

  describe('sign-in', () => {
    for (const payload of PAYLOADS) {
      it(`gives no token for ${payload} as the identifier or the password`, async () => {
        const asIdentifier = await call('POST', '/auth/login', {
          body: { identifier: payload, password: payload },
        });
        const asEmail = await call('POST', '/auth/login', {
          body: { identifier: `${payload}@demo.rw`, password: payload },
        });
        const asPassword = await call('POST', '/auth/login', {
          body: { identifier: 'aline@demo.rw', password: payload },
        });
        for (const res of [asIdentifier, asEmail, asPassword]) {
          assert.ok([400, 401].includes(res.status), `status ${res.status}`);
          assert.equal(res.body?.token, undefined);
        }
      });
    }
  });

  describe('registration', () => {
    it('stores each string as plain text in the free-text fields', async () => {
      for (const payload of PAYLOADS) {
        const phone = freshPhone();
        const res = await call('POST', '/auth/register', {
          body: {
            name: payload,
            phone,
            password: 'a-long-password',
            meterNumber: String(nextMeter++),
            cell: payload,
            village: payload,
            landmark: payload,
            latitude: -1.9,
            longitude: 30.1,
          },
        });
        assert.equal(res.status, 201, JSON.stringify(res.body));
        createdUserIds.push(res.body.user.id);
        const user = await prisma.user.findFirst({
          where: { id: res.body.user.id },
          include: { customer: { include: { serviceLocations: true } } },
        });
        assert.equal(user.name, payload);
        assert.equal(user.customer.serviceLocations[0].landmark, payload);
        assert.equal(user.customer.serviceLocations[0].cell, payload);
      }
    });

    it('rejects a string in the email field without making an account', async () => {
      const before = (await counts()).User;
      const res = await call('POST', '/auth/register', {
        body: {
          name: 'Test',
          phone: freshPhone(),
          email: PAYLOADS[0],
          password: 'a-long-password',
          meterNumber: String(nextMeter++),
          cell: 'Ndera',
          latitude: -1.9,
          longitude: 30.1,
        },
      });
      assert.equal(res.status, 400);
      assert.equal((await counts()).User, before);
    });
  });

  describe('guest report and tracking', () => {
    it('stores each string as plain text and leaves the tables intact', async () => {
      const before = await counts();
      for (const payload of PAYLOADS) {
        const res = await call('POST', '/public/faults', {
          body: {
            category: 'POWER_OUTAGE',
            contactPhone: freshPhone(),
            placeText: payload,
            description: payload,
          },
        });
        assert.equal(res.status, 201, JSON.stringify(res.body));
        const row = await prisma.faultReport.findUnique({ where: { id: res.body.fault.id } });
        assert.equal(row.placeText, payload);
        assert.equal(row.description, payload);
      }
      const after = await counts();
      assert.equal(after.FaultReport, before.FaultReport + PAYLOADS.length);
      assert.equal(after.User, before.User);
    });

    it('rejects a string as the claimed meter number', async () => {
      const res = await call('POST', '/public/faults', {
        body: {
          category: 'POWER_OUTAGE',
          contactPhone: freshPhone(),
          placeText: 'Near the church',
          claimedMeter: PAYLOADS[0],
        },
      });
      assert.equal(res.status, 400);
    });

    it('returns 404 and no data when a string is used as the tracking token', async () => {
      for (const payload of PAYLOADS) {
        const res = await call('GET', `/public/faults/${encodeURIComponent(payload)}`);
        assert.equal(res.status, 404);
        assert.equal(res.body.fault, undefined);
      }
    });
  });

  describe('coordinator notes and search', () => {
    it('stores a string in a cancellation note as plain text', async () => {
      const report = await call('POST', '/public/faults', {
        body: { category: 'POWER_OUTAGE', contactPhone: freshPhone(), placeText: 'Ndera market' },
      });
      assert.equal(report.status, 201, JSON.stringify(report.body));
      const res = await call('PATCH', `/faults/${report.body.fault.id}/status`, {
        token: tokens.grace,
        body: { status: 'CANCELLED', note: PAYLOADS[1] },
      });
      assert.equal(res.status, 200, JSON.stringify(res.body));
      const history = await prisma.faultStatusHistory.findFirst({
        where: { faultId: report.body.fault.id, status: 'CANCELLED' },
      });
      assert.equal(history.note, PAYLOADS[1]);
    });

    it('treats a string in the search box as text and changes nothing', async () => {
      const before = await counts();
      for (const payload of PAYLOADS) {
        const res = await call('GET', `/faults?search=${encodeURIComponent(payload)}`, {
          token: tokens.grace,
        });
        assert.equal(res.status, 200, JSON.stringify(res.body));
      }
      assert.deepEqual(await counts(), before);
    });

    it('still has every table after all the strings', async () => {
      const rows = await prisma.$queryRaw`
        SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
      const names = rows.map((row) => row.table_name);
      for (const table of TABLES) assert.ok(names.includes(table), `${table} is missing`);
    });
  });

  describe('role routes', () => {
    it('refuses a request with no token', async () => {
      assert.equal((await call('GET', '/faults')).status, 401);
    });

    it('refuses a token that holds a string', async () => {
      const res = await call('GET', '/faults', { token: PAYLOADS[0] });
      assert.equal(res.status, 401);
    });

    it('refuses a customer on a coordinator route', async () => {
      const res = await call('PATCH', '/faults/1', {
        token: tokens.aline,
        body: { priority: 'HIGH' },
      });
      assert.equal(res.status, 403);
    });

    it('refuses a technician on a coordinator route', async () => {
      const res = await call('POST', '/faults/1/assign', {
        token: tokens.jeanclaude,
        body: { technicianId: 1 },
      });
      assert.equal(res.status, 403);
    });
  });
});
