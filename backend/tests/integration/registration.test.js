/** Customer registration and phone sign-in, over HTTP against PostgreSQL; refuses to run unless TEST_DATABASE_URL is a local test database. */
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { assertSafeTestDatabase } from './testDatabaseGuard.js';

const TEST_DB = process.env.TEST_DATABASE_URL;
const backendDir = fileURLToPath(new URL('../../', import.meta.url));
/** The seeded customer Aline: meter 0421 5583 019, phone 078 830 0114. */
const SEEDED_METER = '04215583019';

let server;
let baseUrl;
let prisma;
let setSmsProvider;
/** Every account this file creates, so `after` can remove them and leave only demo data behind. */
const createdUserIds = [];
/** Registrations that passed validation; the limiter counts exactly these. */
let counted = 0;

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

const form = (extra = {}) => ({
  name: 'Test Tenant',
  phone: '078 100 0001',
  password: 'tenant-pass-1',
  meterNumber: '0421 5583 019',
  cell: 'Kibenga',
  village: 'Gasharu',
  latitude: -1.9532,
  longitude: 30.1668,
  ...extra,
});

/** Registers through the API; every call here counts against the sign-up limit. */
async function register(extra) {
  counted += 1;
  const res = await call('POST', '/auth/register', { body: form(extra) });
  if (res.status === 201) createdUserIds.push(res.body.user.id);
  return res;
}

const signIn = (identifier, password = 'tenant-pass-1') =>
  call('POST', '/auth/login', { body: { identifier, password } });

describe('Customer registration', { concurrency: false }, () => {
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
    setSmsProvider({ send: async () => {} }); // no real text is ever sent
    server = createApp().listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    if (prisma) {
      // The guard only accepts a test database that holds nothing but @demo.rw accounts.
      await prisma.faultReport.deleteMany({
        where: { customer: { userId: { in: createdUserIds } } },
      });
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
    if (server) await new Promise((resolve) => server.close(resolve));
    await prisma?.$disconnect();
  });

  describe('creating an account', () => {
    let first;

    it('creates the user, the customer and the first location, and signs the customer in', async () => {
      const res = await register();
      assert.equal(res.status, 201, JSON.stringify(res.body));
      first = res.body;
      assert.equal(first.user.role, 'CUSTOMER');
      assert.equal(first.user.phone, '+250781000001');
      assert.equal(first.user.email, null);
      assert.ok(first.user.customerId);
      assert.equal(JSON.stringify(first).includes('tenant-pass-1'), false);
      assert.equal(JSON.stringify(first).includes('passwordHash'), false);

      const row = await prisma.user.findUnique({
        where: { id: first.user.id },
        include: { customer: { include: { serviceLocations: true } } },
      });
      assert.equal(row.role, 'CUSTOMER');
      assert.equal(row.email, null);
      assert.notEqual(row.passwordHash, 'tenant-pass-1');
      assert.equal(row.customer.serviceLocations.length, 1);
      const [location] = row.customer.serviceLocations;
      assert.equal(location.meterNumber, SEEDED_METER); // spaces removed
      assert.equal(location.cell, 'Kibenga');
      assert.equal(location.latitude, -1.9532);
      assert.equal(location.sector, 'Ndera');
    });

    it('returns a token that works', async () => {
      const me = await call('GET', '/auth/me', { token: first.token });
      assert.equal(me.status, 200);
      assert.equal(me.body.user.id, first.user.id);
    });

    it('lets the new customer report a fault at the new location', async () => {
      const res = await call('POST', '/faults', {
        token: first.token,
        body: { category: 'POWER_OUTAGE' },
      });
      assert.equal(res.status, 201, JSON.stringify(res.body));
      assert.equal(res.body.fault.serviceLocation.cell, 'Kibenga');
      assert.equal(res.body.fault.serviceLocation.latitude, -1.9532);
      assert.equal(res.body.fault.customer.name, 'Test Tenant');
    });

    it('can only ever create a customer', async () => {
      const users = await prisma.user.count();
      for (const role of ['COORDINATOR', 'TECHNICIAN', 'CUSTOMER']) {
        const res = await call('POST', '/auth/register', {
          body: form({ phone: '078 100 0099', role }),
        });
        assert.equal(res.status, 400, role);
      }
      assert.equal(await prisma.user.count(), users);
    });

    it('rejects a short password and a bad phone number before touching the database', async () => {
      const users = await prisma.user.count();
      const short = await call('POST', '/auth/register', {
        body: form({ phone: '078 100 0098', password: 'short12' }),
      });
      assert.equal(short.status, 400);
      const phone = await call('POST', '/auth/register', { body: form({ phone: '12345' }) });
      assert.equal(phone.status, 400);
      assert.equal(await prisma.user.count(), users);
    });
  });

  describe('a phone or email that is already taken', () => {
    it('answers 409 naming the phone number and creates nothing', async () => {
      const before = await prisma.user.count();
      const res = await register({ phone: '+250 781 000 001', email: 'fresh@example.rw' });
      assert.equal(res.status, 409);
      assert.match(res.body.error.message, /phone number/i);
      assert.equal(res.body.error.details[0].field, 'phone');
      assert.equal(await prisma.user.count(), before);
      assert.equal(await prisma.user.count({ where: { email: 'fresh@example.rw' } }), 0);
    });

    it('answers 409 for the phone number of a seeded account too', async () => {
      const res = await register({ phone: '0788300114' });
      assert.equal(res.status, 409);
      assert.match(res.body.error.message, /phone number/i);
    });

    it('answers 409 naming the email address and creates nothing', async () => {
      const first = await register({ phone: '078 100 0002', email: 'Tenant2@Example.rw' });
      assert.equal(first.status, 201, JSON.stringify(first.body));
      assert.equal(first.body.user.email, 'tenant2@example.rw');

      const before = await prisma.user.count();
      const res = await register({ phone: '078 100 0003', email: 'tenant2@example.rw' });
      assert.equal(res.status, 409);
      assert.match(res.body.error.message, /email address/i);
      assert.equal(res.body.error.details[0].field, 'email');
      assert.equal(await prisma.user.count(), before);
      assert.equal(await prisma.user.count({ where: { phone: '+250781000003' } }), 0);
    });

    it('creates one account when the same sign-up arrives twice at once', async () => {
      const [a, b] = await Promise.all([
        register({ phone: '078 100 0004' }),
        register({ phone: '078 100 0004' }),
      ]);
      assert.deepEqual([a.status, b.status].sort(), [201, 409]);
      const loser = a.status === 409 ? a : b;
      assert.match(loser.body.error.message, /phone number/i);
      assert.equal(await prisma.user.count({ where: { phone: '+250781000004' } }), 1);
      assert.equal(await prisma.customer.count({ where: { user: { phone: '+250781000004' } } }), 1);
    });
  });

  describe('a meter that more than one customer uses', () => {
    it('lets tenants register on the landlord’s meter, in any spelling', async () => {
      const meters = await prisma.serviceLocation.count({ where: { meterNumber: SEEDED_METER } });
      // The seeded customer, the first test above, and the one with spaces left in (tenant 2) all share it.
      assert.ok(meters >= 3, `expected at least 3 locations on the meter, found ${meters}`);
    });

    it('lets each of them report a fault', async () => {
      const second = await signIn('tenant2@example.rw');
      assert.equal(second.status, 200, JSON.stringify(second.body));
      const res = await call('POST', '/faults', {
        token: second.body.token,
        body: { category: 'LOW_VOLTAGE' },
      });
      assert.equal(res.status, 201, JSON.stringify(res.body));
    });

    it('refuses the same meter twice for one customer', async () => {
      const aline = await prisma.customer.findFirst({
        where: { user: { email: 'aline@demo.rw' } },
      });
      await assert.rejects(
        prisma.serviceLocation.create({
          data: {
            customerId: aline.id,
            meterNumber: SEEDED_METER,
            cell: 'Kibenga',
            latitude: 0,
            longitude: 0,
          },
        }),
        { code: 'P2002' }
      );
    });
  });

  describe('signing in', () => {
    it('works with an email address, whatever its case', async () => {
      for (const email of ['tenant2@example.rw', ' Tenant2@Example.RW ']) {
        const res = await signIn(email);
        assert.equal(res.status, 200, email);
        assert.equal(res.body.user.email, 'tenant2@example.rw');
      }
    });

    it('works with the phone number written in any usual way', async () => {
      for (const phone of ['0781000001', '+250781000001', '078 100 0001', '250 781 000 001']) {
        const res = await signIn(phone);
        assert.equal(res.status, 200, `${phone}: ${JSON.stringify(res.body)}`);
        assert.equal(res.body.user.phone, '+250781000001');
      }
    });

    it('works for a seeded account by email and by phone', async () => {
      const byEmail = await signIn('aline@demo.rw', 'demo1234');
      const byPhone = await signIn('078 830 0114', 'demo1234');
      assert.equal(byEmail.status, 200);
      assert.equal(byPhone.status, 200);
      assert.equal(byPhone.body.user.id, byEmail.body.user.id);
    });

    it('still takes the old email field that installed apps send', async () => {
      const res = await call('POST', '/auth/login', {
        body: { email: 'aline@demo.rw', password: 'demo1234' },
      });
      assert.equal(res.status, 200);
    });

    it('gives the same answer for a wrong password and for an account that does not exist', async () => {
      const wrongPassword = await signIn('0781000001', 'not-the-password');
      const unknownPhone = await signIn('0791999999');
      const unknownEmail = await signIn('nobody@example.rw');
      assert.equal(wrongPassword.status, 401);
      assert.deepEqual(unknownPhone, wrongPassword);
      assert.deepEqual(unknownEmail, wrongPassword);
    });
  });

  describe('limits', () => {
    it('answers 429 on the 11th sign-up from one network in an hour', async () => {
      while (counted < 10) {
        const res = await register({ phone: `078 100 ${String(5000 + counted).padStart(4, '0')}` });
        assert.equal(res.status, 201, JSON.stringify(res.body));
      }
      const res = await register({ phone: '078 100 9999' });
      assert.equal(res.status, 429);
      assert.match(res.body.error.message, /too many/i);
      assert.equal(await prisma.user.count({ where: { phone: '+250781009999' } }), 0);
    });
  });
});
