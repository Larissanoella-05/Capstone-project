/**
 * Integration tests: the real Express app, over HTTP, against a real PostgreSQL database.
 *
 * They RESET the database with the seed data, so they REFUSE to run unless TEST_DATABASE_URL
 * points at a separate, local test database holding only demo data (see testDatabaseGuard.js):
 *
 *   TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/umuriro_test?schema=public" npm run test:integration
 */
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { assertSafeTestDatabase } from './testDatabaseGuard.js';

const TEST_DB = process.env.TEST_DATABASE_URL;
const backendDir = fileURLToPath(new URL('../../', import.meta.url));

let server;
let baseUrl;
let prisma;
const tokens = {};
const technicianIds = {}; // technician id → login key

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

const login = async (email, password = 'demo1234') =>
  call('POST', '/auth/login', { body: { email, password } });

async function reportFault(category = 'POWER_OUTAGE', description = 'Integration test fault') {
  const res = await call('POST', '/faults', {
    token: tokens.aline,
    body: { category, description },
  });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body.fault;
}

/**
 * Assigns the recommended technician (or, once every technician is busy, the top-ranked
 * on-duty one) and returns that technician's token key.
 */
async function assignBest(faultId) {
  const ranked = await call('GET', `/technicians?faultId=${faultId}`, { token: tokens.grace });
  const list = ranked.body.technicians;
  const choice = list.find((t) => t.recommended) ?? list.find((t) => t.onDuty);
  assert.ok(choice, 'expected at least one on-duty technician');
  const res = await call('POST', `/faults/${faultId}/assign`, {
    token: tokens.grace,
    body: { technicianId: choice.id },
  });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  return technicianIds[choice.id];
}

const setStatus = (faultId, token, body) =>
  call('PATCH', `/faults/${faultId}/status`, { token, body });

describe('API integration', { concurrency: false }, () => {
  before(async () => {
    // Fails the run, before anything is written, unless TEST_DB is a separate local demo-only database.
    // Must run before DATABASE_URL is overwritten below, so it can compare against the real one.
    await assertSafeTestDatabase(TEST_DB);

    process.env.DATABASE_URL = TEST_DB;
    process.env.JWT_SECRET ||= 'integration-test-secret';
    process.env.NODE_ENV = 'test';

    // Fresh, known data for every run.
    execFileSync(process.execPath, ['prisma/seed.js'], {
      cwd: backendDir,
      env: { ...process.env, DATABASE_URL: TEST_DB },
      stdio: 'ignore',
    });

    const { createApp } = await import('../../src/app.js');
    ({ prisma } = await import('../../src/lib/prisma.js'));
    server = createApp().listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;

    const accounts = {
      aline: 'aline@demo.rw',
      ericn: 'eric.n@demo.rw',
      grace: 'grace@demo.rw',
      jeanclaude: 'jeanclaude@demo.rw',
      patrick: 'patrick@demo.rw',
      emmanuel: 'emmanuel@demo.rw',
      ericm: 'eric.m@demo.rw',
    };
    for (const [key, email] of Object.entries(accounts)) {
      const res = await login(email);
      assert.equal(res.status, 200, `login failed for ${email}`);
      tokens[key] = res.body.token;
      if (res.body.user.technicianId) technicianIds[res.body.user.technicianId] = key;
    }
  });

  after(async () => {
    // If setup stopped early (e.g. the safety check refused), there is no server to close.
    if (server) await new Promise((resolve) => server.close(resolve));
    await prisma?.$disconnect();
  });

  describe('health and authentication', () => {
    it('reports the API and database as up', async () => {
      const res = await call('GET', '/health');
      assert.equal(res.status, 200);
      assert.equal(res.body.database, 'connected');
    });

    it('gives the same 401 message for a wrong password and an unknown email', async () => {
      const wrong = await login('aline@demo.rw', 'nope');
      const unknown = await login('nobody@demo.rw', 'demo1234');
      assert.equal(wrong.status, 401);
      assert.equal(unknown.status, 401);
      assert.equal(wrong.body.error.message, unknown.body.error.message);
    });

    it('rejects a malformed email with 400 before touching the database', async () => {
      const res = await login('not-an-email');
      assert.equal(res.status, 400);
      assert.equal(res.body.error.details[0].field, 'email');
    });

    it('rejects missing and tampered tokens with 401', async () => {
      assert.equal((await call('GET', '/faults')).status, 401);
      assert.equal((await call('GET', '/faults', { token: `${tokens.aline}x` })).status, 401);
    });
  });

  describe('mobile client sessions', () => {
    const lifetimeSeconds = (token) => {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
      return payload.exp - payload.iat;
    };

    it('keeps the web login at 12 hours when no client is sent', async () => {
      const res = await login('aline@demo.rw');
      assert.equal(lifetimeSeconds(res.body.token), 12 * 60 * 60);
    });

    it('gives the mobile client a 30 day login', async () => {
      const res = await call('POST', '/auth/login', {
        body: { email: 'aline@demo.rw', password: 'demo1234', client: 'mobile' },
      });
      assert.equal(res.status, 200);
      assert.equal(lifetimeSeconds(res.body.token), 30 * 24 * 60 * 60);
    });

    it('rejects an unknown client with 400', async () => {
      const res = await call('POST', '/auth/login', {
        body: { email: 'aline@demo.rw', password: 'demo1234', client: 'desktop' },
      });
      assert.equal(res.status, 400);
    });
  });

  describe('end-to-end fault workflow', () => {
    let fault;
    let techKey;

    it('customer reports a fault linked to their service location', async () => {
      fault = await reportFault('POWER_OUTAGE', 'No power in the whole house');
      assert.equal(fault.status, 'REPORTED');
      assert.equal(fault.priority, 'HIGH'); // default priority for an outage
      assert.match(fault.reference, /^FR-\d+$/);
      assert.ok(fault.serviceLocation.latitude && fault.serviceLocation.longitude);
    });

    it('coordinator sees technicians ranked available-first, then by distance', async () => {
      const res = await call('GET', `/technicians?faultId=${fault.id}`, { token: tokens.grace });
      assert.equal(res.status, 200);
      const list = res.body.technicians;
      const order = { AVAILABLE: 0, ON_JOB: 1, OFF_DUTY: 2 };
      for (let i = 1; i < list.length; i += 1) {
        const [a, b] = [list[i - 1], list[i]];
        assert.ok(order[a.availability] <= order[b.availability], 'availability order broken');
        if (a.availability === b.availability && a.distanceKm !== null && b.distanceKm !== null) {
          assert.ok(a.distanceKm <= b.distanceKm, 'distance order broken');
        }
      }
      assert.equal(list.filter((t) => t.recommended).length, 1);
    });

    it('coordinator assigns the recommended technician', async () => {
      const ranked = await call('GET', `/technicians?faultId=${fault.id}`, { token: tokens.grace });
      assert.equal(ranked.body.technicians[0].recommended, true);
      techKey = await assignBest(fault.id);
      const res = await call('GET', `/faults/${fault.id}`, { token: tokens[techKey] });
      assert.equal(res.status, 200);
      assert.equal(res.body.fault.status, 'ASSIGNED');
    });

    it('technician moves the job through every stage and resolves it', async () => {
      for (const status of ['ON_THE_WAY', 'ARRIVED', 'WORKING']) {
        const res = await setStatus(fault.id, tokens[techKey], { status });
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.equal(res.body.fault.status, status);
      }
      const resolved = await setStatus(fault.id, tokens[techKey], {
        status: 'RESOLVED',
        outcome: 'SUPPLY_RESTORED',
        resolutionNote: 'Replaced the service fuse.',
        clarificationContacts: 0,
      });
      assert.equal(resolved.status, 200);
      assert.equal(resolved.body.fault.outcome, 'SUPPLY_RESTORED');
    });

    it('customer can track the full, time-stamped history', async () => {
      const res = await call('GET', `/faults/${fault.id}`, { token: tokens.aline });
      const f = res.body.fault;
      assert.deepEqual(
        f.history.map((h) => h.status),
        ['REPORTED', 'ASSIGNED', 'ON_THE_WAY', 'ARRIVED', 'WORKING', 'RESOLVED']
      );
      for (const field of [
        'reportedAt',
        'assignedAt',
        'onTheWayAt',
        'arrivedAt',
        'workingAt',
        'resolvedAt',
      ]) {
        assert.ok(f[field], `${field} should be stamped`);
      }
      assert.ok(new Date(f.resolvedAt) >= new Date(f.reportedAt));
    });

    it('customer received one notification per customer-facing event', async () => {
      const res = await call('GET', '/notifications', { token: tokens.aline });
      const types = res.body.notifications
        .filter((n) => n.faultId === fault.id)
        .map((n) => n.type)
        .sort();
      assert.deepEqual(types, [
        'FAULT_RESOLVED',
        'FAULT_SUBMITTED',
        'TECHNICIAN_ARRIVED',
        'TECHNICIAN_ASSIGNED',
        'TECHNICIAN_ON_THE_WAY',
      ]);
    });

    it('a resolved fault cannot be changed or reassigned', async () => {
      assert.equal((await setStatus(fault.id, tokens[techKey], { status: 'WORKING' })).status, 409);
      assert.equal((await setStatus(fault.id, tokens.grace, { status: 'CANCELLED' })).status, 409);
      const reassign = await call('POST', `/faults/${fault.id}/assign`, {
        token: tokens.grace,
        body: { technicianId: 1 },
      });
      assert.equal(reassign.status, 409);
    });
  });

  describe('authorization between roles', () => {
    let fault;
    before(async () => {
      fault = await reportFault('METER_ISSUE', 'Meter shows an error code');
    });

    it('another customer cannot open this fault (403)', async () => {
      assert.equal((await call('GET', `/faults/${fault.id}`, { token: tokens.ericn })).status, 403);
    });

    it('a customer only lists their own faults', async () => {
      const mine = await call('GET', '/faults?status=ALL', { token: tokens.ericn });
      assert.ok(mine.body.faults.every((f) => f.customer.id !== fault.customer.id));
    });

    it('an unassigned technician cannot open or update it (403)', async () => {
      assert.equal(
        (await call('GET', `/faults/${fault.id}`, { token: tokens.patrick })).status,
        403
      );
      assert.equal(
        (await setStatus(fault.id, tokens.patrick, { status: 'ON_THE_WAY' })).status,
        403
      );
    });

    it('customers cannot assign technicians or list them (403)', async () => {
      assert.equal(
        (
          await call('POST', `/faults/${fault.id}/assign`, {
            token: tokens.aline,
            body: { technicianId: 1 },
          })
        ).status,
        403
      );
      assert.equal((await call('GET', '/technicians', { token: tokens.aline })).status, 403);
    });

    it('technicians and coordinators cannot report faults (403)', async () => {
      const body = { category: 'OTHER' };
      assert.equal((await call('POST', '/faults', { token: tokens.patrick, body })).status, 403);
      assert.equal((await call('POST', '/faults', { token: tokens.grace, body })).status, 403);
    });
  });

  describe('technician location posts (the mobile tracker)', () => {
    let faultA;
    let faultB;
    let keyA;
    let keyB;

    before(async () => {
      faultA = await reportFault('POWER_OUTAGE', 'Location test A');
      keyA = await assignBest(faultA.id);

      // Give the second fault to a different technician, so each owns exactly one of the two jobs.
      faultB = await reportFault('LOW_VOLTAGE', 'Location test B');
      const ranked = await call('GET', `/technicians?faultId=${faultB.id}`, {
        token: tokens.grace,
      });
      const other = ranked.body.technicians.find((t) => t.onDuty && technicianIds[t.id] !== keyA);
      assert.ok(other, 'expected a second on-duty technician');
      const res = await call('POST', `/faults/${faultB.id}/assign`, {
        token: tokens.grace,
        body: { technicianId: other.id },
      });
      assert.equal(res.status, 200, JSON.stringify(res.body));
      keyB = technicianIds[other.id];
    });

    it('an assigned technician can post a position with the faultId of their own job', async () => {
      const res = await call('POST', '/technicians/me/location', {
        token: tokens[keyA],
        body: { latitude: -1.95, longitude: 30.17, faultId: faultA.id, label: 'Device location' },
      });
      assert.equal(res.status, 201, JSON.stringify(res.body));
      assert.equal(res.body.location.latitude, -1.95);
    });

    it('a faultId belonging to another technician is refused (400)', async () => {
      const res = await call('POST', '/technicians/me/location', {
        token: tokens[keyA],
        body: { latitude: -1.95, longitude: 30.17, faultId: faultB.id },
      });
      assert.equal(res.status, 400, JSON.stringify(res.body));
      assert.equal(res.body.error.message, 'That fault is not assigned to you.');
      assert.notEqual(keyA, keyB);
    });
  });

  describe('arrival distance (FR9)', () => {
    const NORTH_OF_SITE = 0.001; // degrees of latitude: about 111 m

    const technicianIdOf = (key) =>
      Number(Object.keys(technicianIds).find((id) => technicianIds[id] === key));

    /** Reports and assigns a fault, optionally with the technician's position posted first, then walks it to ARRIVED. */
    async function arriveAt({ positionOffset }) {
      const fault = await reportFault('POWER_OUTAGE', 'Arrival distance test');
      const key = await assignBest(fault.id);
      const site = fault.serviceLocation;

      if (positionOffset === null) {
        await prisma.technicianLocation.deleteMany({
          where: { technicianId: technicianIdOf(key) },
        });
      } else {
        const posted = await call('POST', '/technicians/me/location', {
          token: tokens[key],
          body: {
            latitude: site.latitude + positionOffset,
            longitude: site.longitude,
            faultId: fault.id,
          },
        });
        assert.equal(posted.status, 201, JSON.stringify(posted.body));
      }

      assert.equal((await setStatus(fault.id, tokens[key], { status: 'ON_THE_WAY' })).status, 200);
      const arrived = await setStatus(fault.id, tokens[key], { status: 'ARRIVED' });
      assert.equal(arrived.status, 200, JSON.stringify(arrived.body));
      return arrived.body.fault;
    }

    it('stores the distance between the last recorded position and the registered service point', async () => {
      const fault = await arriveAt({ positionOffset: NORTH_OF_SITE });
      assert.ok(Number.isInteger(fault.arrivalDistanceM));
      assert.ok(
        fault.arrivalDistanceM >= 110 && fault.arrivalDistanceM <= 112,
        `got ${fault.arrivalDistanceM}`
      );
    });

    it('is zero when the technician reports the service point itself', async () => {
      assert.equal((await arriveAt({ positionOffset: 0 })).arrivalDistanceM, 0);
    });

    it('stays null when no position was ever recorded, and the status change still succeeds', async () => {
      assert.equal((await arriveAt({ positionOffset: null })).arrivalDistanceM, null);
    });

    it('the customer sees the stored distance on their own report', async () => {
      const fault = await arriveAt({ positionOffset: NORTH_OF_SITE });
      const res = await call('GET', `/faults/${fault.id}`, { token: tokens.aline });
      assert.equal(res.body.fault.arrivalDistanceM, fault.arrivalDistanceM);
    });

    it('analytics report the average and median of the measured arrivals', async () => {
      const res = await call('GET', '/stats/analytics', { token: tokens.grace });
      const { arrivalDistance } = res.body.analytics;
      assert.ok(arrivalDistance.measuredJobs >= 2);
      assert.ok(arrivalDistance.averageMetres >= 0);
      assert.ok(arrivalDistance.medianMetres >= 0);
    });
  });

  describe('device tokens and push', () => {
    const TOKEN_ALINE = 'ExponentPushToken[integration-test-aline-0001]';
    const TOKEN_JEAN = 'ExponentPushToken[integration-test-jean-00001]';
    const sent = [];
    let push;
    let alineId;
    let patrickId;

    before(async () => {
      push = await import('../../src/services/pushService.js');
      // A fake Expo client: nothing leaves this machine, and every message is recorded.
      push.setExpoClient({
        chunkPushNotifications: (messages) => [messages],
        sendPushNotificationsAsync: async (chunk) => {
          sent.push(...chunk);
          return chunk.map((_, index) => ({
            status: 'ok',
            id: `integration-ticket-${sent.length}-${index}`,
          }));
        },
        chunkPushNotificationReceiptIds: (ids) => [ids],
        getPushNotificationReceiptsAsync: async () => ({}),
      });
      alineId = (await prisma.user.findUnique({ where: { email: 'aline@demo.rw' } })).id;
      patrickId = (await prisma.user.findUnique({ where: { email: 'patrick@demo.rw' } })).id;
      await prisma.deviceToken.deleteMany({});
    });

    after(async () => {
      await prisma.deviceToken.deleteMany({});
    });

    const register = (key, token) =>
      call('POST', '/devices', { token: tokens[key], body: { token } });
    const pushesAfter = async (action) => {
      sent.length = 0;
      await action();
      await push.whenPushIdle();
      return sent.map((m) => ({ to: m.to, type: m.data.type, faultId: m.data.faultId }));
    };

    it('registering requires a signed-in user (401)', async () => {
      assert.equal((await call('POST', '/devices', { body: { token: TOKEN_ALINE } })).status, 401);
    });

    it('rejects a malformed token (400)', async () => {
      assert.equal((await register('aline', 'not-a-push-token')).status, 400);
    });

    it('registers a token for the signed-in user', async () => {
      const res = await register('aline', TOKEN_ALINE);
      assert.equal(res.status, 201, JSON.stringify(res.body));
      const row = await prisma.deviceToken.findUnique({ where: { token: TOKEN_ALINE } });
      assert.equal(row.userId, alineId);
    });

    it('registering the same token as another user moves it (a shared phone)', async () => {
      assert.equal((await register('patrick', TOKEN_ALINE)).status, 201);
      const rows = await prisma.deviceToken.findMany({ where: { token: TOKEN_ALINE } });
      assert.equal(rows.length, 1);
      assert.equal(rows[0].userId, patrickId);
    });

    it('DELETE removes only the signed-in user’s own token', async () => {
      const notOwner = await call('DELETE', '/devices', {
        token: tokens.aline,
        body: { token: TOKEN_ALINE },
      });
      assert.equal(notOwner.body.removed, 0);
      assert.ok(await prisma.deviceToken.findUnique({ where: { token: TOKEN_ALINE } }));

      const owner = await call('DELETE', '/devices', {
        token: tokens.patrick,
        body: { token: TOKEN_ALINE },
      });
      assert.equal(owner.body.removed, 1);
      assert.equal(await prisma.deviceToken.findUnique({ where: { token: TOKEN_ALINE } }), null);
    });

    it('sends the right pushes at each step of a fault', async () => {
      assert.equal((await register('aline', TOKEN_ALINE)).status, 201);
      assert.equal((await register('jeanclaude', TOKEN_JEAN)).status, 201);
      const jeanId = Number(
        Object.keys(technicianIds).find((id) => technicianIds[id] === 'jeanclaude')
      );

      let fault;
      const reported = await pushesAfter(async () => {
        fault = await reportFault('POWER_OUTAGE', 'Push test fault');
      });
      assert.deepEqual(reported, [{ to: TOKEN_ALINE, type: 'FAULT_SUBMITTED', faultId: fault.id }]);

      const assigned = await pushesAfter(async () => {
        const res = await call('POST', `/faults/${fault.id}/assign`, {
          token: tokens.grace,
          body: { technicianId: jeanId },
        });
        assert.equal(res.status, 200, JSON.stringify(res.body));
      });
      assert.deepEqual(
        assigned.map((m) => [m.to, m.type]).sort(),
        [
          [TOKEN_ALINE, 'TECHNICIAN_ASSIGNED'],
          [TOKEN_JEAN, 'JOB_ASSIGNED'],
        ].sort()
      );

      const step = async (body) =>
        pushesAfter(async () => {
          const res = await setStatus(fault.id, tokens.jeanclaude, body);
          assert.equal(res.status, 200, JSON.stringify(res.body));
        });
      assert.deepEqual(
        (await step({ status: 'ON_THE_WAY' })).map((m) => [m.to, m.type]),
        [[TOKEN_ALINE, 'TECHNICIAN_ON_THE_WAY']]
      );
      assert.deepEqual(
        (await step({ status: 'ARRIVED' })).map((m) => [m.to, m.type]),
        [[TOKEN_ALINE, 'TECHNICIAN_ARRIVED']]
      );
      assert.deepEqual(await step({ status: 'WORKING' }), []); // work starting does not notify the customer
      assert.deepEqual(
        (
          await step({
            status: 'RESOLVED',
            outcome: 'SUPPLY_RESTORED',
            resolutionNote: 'Replaced the service fuse.',
            workCompleted: 'Fuse',
          })
        ).map((m) => [m.to, m.type]),
        [[TOKEN_ALINE, 'FAULT_RESOLVED']]
      );
    });

    it('a push failure never fails the API request', async () => {
      push.setExpoClient({
        chunkPushNotifications: (messages) => [messages],
        sendPushNotificationsAsync: async () => {
          throw new Error('Expo is down');
        },
        chunkPushNotificationReceiptIds: (ids) => [ids],
        getPushNotificationReceiptsAsync: async () => ({}),
      });
      const fault = await reportFault('METER_ISSUE', 'Push failure test');
      await push.whenPushIdle();
      assert.ok(fault.id);
    });
  });

  describe('invalid input and error handling', () => {
    it('rejects a fault without a category (400 with field details)', async () => {
      const res = await call('POST', '/faults', {
        token: tokens.aline,
        body: { description: 'no category' },
      });
      assert.equal(res.status, 400);
      assert.equal(res.body.error.details[0].field, 'category');
    });

    it('rejects a non-numeric id (400) and an unknown id (404)', async () => {
      assert.equal((await call('GET', '/faults/abc', { token: tokens.grace })).status, 400);
      assert.equal((await call('GET', '/faults/999999', { token: tokens.grace })).status, 404);
    });

    it('rejects invalid JSON with 400 and unknown routes with 404', async () => {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{bad json',
      });
      assert.equal(response.status, 400);
      assert.equal((await call('GET', '/does-not-exist')).status, 404);
    });

    it('rejects skipping a stage and resolving without a note', async () => {
      const fault = await reportFault('LOW_VOLTAGE');
      const techKey = await assignBest(fault.id);
      const skipped = await setStatus(fault.id, tokens[techKey], { status: 'ARRIVED' });
      assert.equal(skipped.status, 409);
      assert.match(skipped.body.error.message, /on the way/);

      for (const status of ['ON_THE_WAY', 'ARRIVED', 'WORKING'])
        await setStatus(fault.id, tokens[techKey], { status });
      const noNote = await setStatus(fault.id, tokens[techKey], {
        status: 'RESOLVED',
        resolutionNote: '   ',
      });
      assert.equal(noNote.status, 400);
    });

    it('rejects a technician location outside valid coordinates', async () => {
      const res = await call('POST', '/technicians/me/location', {
        token: tokens.patrick,
        body: { latitude: 120, longitude: 30.1 },
      });
      assert.equal(res.status, 400);
    });

    it('finds faults by category words in the search box', async () => {
      const res = await call('GET', '/faults?status=ALL&search=power', { token: tokens.grace });
      assert.ok(res.body.faults.length > 0);
      assert.ok(
        res.body.faults.every(
          (f) => f.category === 'POWER_OUTAGE' || /power/i.test(JSON.stringify(f))
        )
      );
    });
  });

  describe('data integrity under concurrent requests', () => {
    it('repeated simultaneous taps of the same status update are applied once; the rest get 409', async () => {
      const fault = await reportFault('OTHER', 'Concurrency check');
      const techKey = await assignBest(fault.id);

      // Five identical requests at once (an impatient user tapping repeatedly). Five, not two,
      // so that the requests reliably overlap and the race is actually exercised.
      const taps = 5;
      // Warm-up: open enough HTTP and database connections first. Otherwise the first request runs on a
      // warm connection and finishes before the others have even connected, and the race never happens.
      await Promise.all(
        Array.from({ length: taps }, () =>
          call('GET', `/faults/${fault.id}`, { token: tokens[techKey] })
        )
      );
      const results = await Promise.all(
        Array.from({ length: taps }, () =>
          setStatus(fault.id, tokens[techKey], { status: 'ON_THE_WAY' })
        )
      );
      const codes = results.map((r) => r.status);
      assert.equal(codes.filter((code) => code === 200).length, 1, `status codes: ${codes}`);
      assert.equal(codes.filter((code) => code === 409).length, taps - 1, `status codes: ${codes}`);

      const history = await prisma.faultStatusHistory.count({
        where: { faultId: fault.id, status: 'ON_THE_WAY' },
      });
      const notices = await prisma.notification.count({
        where: { faultId: fault.id, type: 'TECHNICIAN_ON_THE_WAY' },
      });
      assert.equal(history, 1);
      assert.equal(notices, 1);
    });

    it('two coordinators assigning different technicians at once: only one wins', async () => {
      const fault = await reportFault('OTHER', 'Concurrent assignment');
      const ranked = await call('GET', `/technicians?faultId=${fault.id}`, { token: tokens.grace });
      const [first, second] = ranked.body.technicians.filter((t) => t.availability !== 'OFF_DUTY');

      const results = await Promise.all(
        [first, second].map((t) =>
          call('POST', `/faults/${fault.id}/assign`, {
            token: tokens.grace,
            body: { technicianId: t.id },
          })
        )
      );
      assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
      const assigned = await prisma.faultStatusHistory.count({
        where: { faultId: fault.id, status: 'ASSIGNED' },
      });
      assert.equal(assigned, 1);
    });
  });

  describe('coordinator cancellation and analytics', () => {
    it('cancelling notifies the customer and blocks further technician updates', async () => {
      const fault = await reportFault('OTHER', 'Will be cancelled');
      const techKey = await assignBest(fault.id);
      const cancel = await setStatus(fault.id, tokens.grace, {
        status: 'CANCELLED',
        note: 'Duplicate report',
      });
      assert.equal(cancel.status, 200);
      assert.equal(
        (await setStatus(fault.id, tokens[techKey], { status: 'ON_THE_WAY' })).status,
        409
      );

      const notes = await call('GET', '/notifications', { token: tokens.aline });
      assert.ok(
        notes.body.notifications.some((n) => n.faultId === fault.id && n.type === 'FAULT_CANCELLED')
      );
    });

    it('analytics returns non-negative averages and a 7-day series', async () => {
      const res = await call('GET', '/stats/analytics', { token: tokens.grace });
      assert.equal(res.status, 200);
      const { averages, completedLast7Days } = res.body.analytics;
      for (const value of Object.values(averages)) assert.ok(value === null || value >= 0);
      assert.equal(completedLast7Days.length, 7);
    });
  });
});
