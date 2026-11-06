/** Reporting without an account, over HTTP against PostgreSQL; refuses to run unless TEST_DATABASE_URL is a local test database. */
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { assertSafeTestDatabase } from './testDatabaseGuard.js';

const TEST_DB = process.env.TEST_DATABASE_URL;
const backendDir = fileURLToPath(new URL('../../', import.meta.url));
const DAY = 24 * 60 * 60 * 1000;

let server;
let baseUrl;
let prisma;
let setSmsProvider;
let whenSmsIdle;
/** Every text the app would have sent, in order. The real gateway is never contacted. */
const texts = [];
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
  return { status: response.status, body: json, headers: response.headers };
}

const login = (email) => call('POST', '/auth/login', { body: { email, password: 'demo1234' } });

const guestBody = (extra = {}) => ({
  category: 'POWER_OUTAGE',
  contactPhone: '078 812 3456',
  latitude: -1.9,
  longitude: 30.1,
  accuracyM: 30,
  description: 'No power since the storm',
  ...extra,
});

async function reportAsGuest(extra) {
  const res = await call('POST', '/public/faults', { body: guestBody(extra) });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body.fault;
}

async function assignBest(faultId) {
  const ranked = await call('GET', `/technicians?faultId=${faultId}`, { token: tokens.grace });
  const choice = ranked.body.technicians.find((t) => t.recommended) ?? ranked.body.technicians[0];
  const res = await call('POST', `/faults/${faultId}/assign`, {
    token: tokens.grace,
    body: { technicianId: choice.id },
  });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  return technicianIds[choice.id];
}

const setStatus = (faultId, token, body) =>
  call('PATCH', `/faults/${faultId}/status`, { token, body });

describe('Reporting without an account', { concurrency: false }, () => {
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
    ({ setSmsProvider, whenSmsIdle } = await import('../../src/services/smsService.js'));
    setSmsProvider({ send: async (message) => void texts.push(message) });
    server = createApp().listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;

    const accounts = {
      aline: 'aline@demo.rw',
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
    if (server) await new Promise((resolve) => server.close(resolve));
    await prisma?.$disconnect();
  });

  describe('sending a report', () => {
    let guest;

    it('accepts a report with no sign-in and returns the reference and the tracking token', async () => {
      guest = await reportAsGuest();
      assert.match(guest.reference, /^FR-\d+$/);
      assert.match(guest.trackingToken, /^[A-Za-z0-9_-]{32}$/);
      assert.equal(guest.status, 'REPORTED');
    });

    it('stores the phone in one standard form, the point and the guest flag', async () => {
      const row = await prisma.faultReport.findUnique({ where: { id: guest.id } });
      assert.equal(row.customerId, null);
      assert.equal(row.serviceLocationId, null);
      assert.equal(row.contactPhone, '+250788123456');
      assert.equal(row.locationSource, 'GPS');
      assert.equal(row.accuracyM, 30);
      assert.equal(row.priority, 'HIGH');
    });

    it('rejects a phone number that is not a Rwandan mobile', async () => {
      const res = await call('POST', '/public/faults', {
        body: guestBody({ contactPhone: '12345' }),
      });
      assert.equal(res.status, 400);
    });

    it('rejects a report that says nothing about where the fault is', async () => {
      const res = await call('POST', '/public/faults', {
        body: guestBody({ latitude: undefined, longitude: undefined, accuracyM: undefined }),
      });
      assert.equal(res.status, 400);
    });

    it('does not let a guest set a customer or a priority', async () => {
      const res = await call('POST', '/public/faults', {
        body: guestBody({ contactPhone: '079 000 0001', customerId: 1, priority: 'LOW' }),
      });
      assert.equal(res.status, 201);
      const row = await prisma.faultReport.findUnique({ where: { id: res.body.fault.id } });
      assert.equal(row.customerId, null);
      assert.equal(row.priority, 'HIGH');
    });
  });

  describe('following a report by its link', () => {
    let guest;

    before(async () => {
      guest = await reportAsGuest({ contactPhone: '072 000 0002', claimedMeter: '01234567890' });
    });

    it('shows the report to whoever holds the token, without any phone number or meter', async () => {
      const res = await call('GET', `/public/faults/${guest.trackingToken}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.fault.reference, guest.reference);
      assert.equal(res.body.fault.status, 'REPORTED');
      const text = JSON.stringify(res.body);
      assert.equal(text.includes('0720000002'), false);
      assert.equal(text.includes('+250720000002'), false);
      assert.equal(text.includes('01234567890'), false);
      assert.equal(text.includes(guest.trackingToken), false);
    });

    it('tells the browser not to cache it or pass the link on', async () => {
      const res = await call('GET', `/public/faults/${guest.trackingToken}`);
      assert.match(res.headers.get('cache-control'), /no-store/);
      assert.equal(res.headers.get('referrer-policy'), 'no-referrer');
    });

    it('answers 404 for a token that is wrong, unknown or the wrong shape', async () => {
      const unknown = 'A'.repeat(32);
      assert.equal((await call('GET', `/public/faults/${unknown}`)).status, 404);
      assert.equal((await call('GET', '/public/faults/short')).status, 404);
      assert.equal((await call('GET', `/public/faults/${guest.reference}`)).status, 404);
    });

    it('is not readable through the signed-in endpoints by a registered customer', async () => {
      const one = await call('GET', `/faults/${guest.id}`, { token: tokens.aline });
      assert.equal(one.status, 403);
      const list = await call('GET', '/faults', { token: tokens.aline });
      assert.equal(
        list.body.faults.some((fault) => fault.id === guest.id),
        false
      );
    });

    it('is not readable without signing in', async () => {
      assert.equal((await call('GET', `/faults/${guest.id}`)).status, 401);
    });

    it('stops working 7 days after the report is resolved', async () => {
      await prisma.faultReport.update({
        where: { id: guest.id },
        data: { status: 'RESOLVED', resolvedAt: new Date(Date.now() - 6 * DAY) },
      });
      assert.equal((await call('GET', `/public/faults/${guest.trackingToken}`)).status, 200);

      await prisma.faultReport.update({
        where: { id: guest.id },
        data: { resolvedAt: new Date(Date.now() - 8 * DAY) },
      });
      assert.equal((await call('GET', `/public/faults/${guest.trackingToken}`)).status, 404);
    });
  });

  describe('handling a guest report as staff', () => {
    let guest;
    let technicianKey;

    before(async () => {
      guest = await reportAsGuest({
        contactPhone: '073 000 0003',
        placeText: 'Near the blue gate',
      });
    });

    it('shows the coordinator the report as a guest report with a location in the usual shape', async () => {
      const res = await call('GET', `/faults/${guest.id}`, { token: tokens.grace });
      assert.equal(res.status, 200);
      const fault = res.body.fault;
      assert.equal(fault.isGuest, true);
      assert.equal(fault.customer, null);
      assert.equal(fault.contactPhone, '+250730000003');
      assert.equal(fault.serviceLocation.cell, 'Unknown');
      assert.equal(fault.serviceLocation.landmark, 'Near the blue gate');
      assert.equal(fault.serviceLocation.latitude, -1.9);
    });

    it('lists it for the coordinator and finds it by phone number', async () => {
      const found = await call('GET', '/faults?search=%2B250730000003', { token: tokens.grace });
      assert.equal(found.status, 200);
      assert.ok(found.body.faults.some((fault) => fault.id === guest.id));
    });

    it('ranks technicians by distance to the guest point', async () => {
      const res = await call('GET', `/technicians?faultId=${guest.id}`, { token: tokens.grace });
      assert.equal(res.status, 200);
      assert.ok(res.body.technicians.every((t) => typeof t.distanceKm === 'number'));
    });

    it('assigns a technician, who then sees the job', async () => {
      technicianKey = await assignBest(guest.id);
      const jobs = await call('GET', '/faults', { token: tokens[technicianKey] });
      assert.ok(jobs.body.faults.some((fault) => fault.id === guest.id));
    });

    it('moves through every status to resolved and records the arrival distance', async () => {
      const token = tokens[technicianKey];
      for (const status of ['ON_THE_WAY', 'ARRIVED', 'WORKING']) {
        const res = await setStatus(guest.id, token, { status });
        assert.equal(res.status, 200, JSON.stringify(res.body));
      }
      const done = await setStatus(guest.id, token, {
        status: 'RESOLVED',
        resolutionNote: 'Replaced a blown fuse.',
      });
      assert.equal(done.status, 200, JSON.stringify(done.body));
      assert.equal(typeof done.body.fault.arrivalDistanceM, 'number');
    });

    it('shows the guest the progress, with the technician by first name only', async () => {
      const res = await call('GET', `/public/faults/${guest.trackingToken}`);
      assert.equal(res.body.fault.status, 'RESOLVED');
      const { technician } = res.body.fault;
      assert.ok(technician.name && !technician.name.includes(' '));
      assert.equal(technician.phone, null);
      assert.equal(technician.staffNumber, null);
      assert.ok(res.body.fault.history.length >= 5);
      assert.ok(res.body.fault.history.every((entry) => entry.changedBy === null));
    });
  });

  describe('a guest who gave a written place only', () => {
    it('can still be assigned and reach the site, with no arrival distance', async () => {
      const guest = await reportAsGuest({
        contactPhone: '079 000 0004',
        latitude: undefined,
        longitude: undefined,
        accuracyM: undefined,
        placeText: 'Behind the market, Kibenga cell',
      });
      const row = await prisma.faultReport.findUnique({ where: { id: guest.id } });
      assert.equal(row.locationSource, 'TYPED');
      assert.equal(row.latitude, null);

      const key = await assignBest(guest.id);
      for (const status of ['ON_THE_WAY', 'ARRIVED']) {
        const res = await setStatus(guest.id, tokens[key], { status });
        assert.equal(res.status, 200, JSON.stringify(res.body));
      }
      const after = await call('GET', `/faults/${guest.id}`, { token: tokens.grace });
      assert.equal(after.body.fault.arrivalDistanceM, null);
    });
  });

  describe('texts to the guest', () => {
    const phone = '+250795550007';
    let guest;
    let key;

    /** The texts sent to this guest so far, once every background send has finished. */
    async function textsSoFar() {
      await whenSmsIdle();
      return texts.filter((text) => text.to === phone).map((text) => text.text);
    }

    it('texts the reference and the tracking link as soon as the report is received', async () => {
      guest = await reportAsGuest({ contactPhone: '079 555 0007' });
      assert.equal(guest.sms.delivery, 'queued'); // a gateway is set, so it is not simulated
      const sent = await textsSoFar();
      assert.equal(sent.length, 1);
      assert.ok(sent[0].includes(guest.reference));
      assert.ok(sent[0].includes(`/track/${guest.trackingToken}`));
      assert.equal(sent[0], guest.sms.text);
    });

    it('texts when a technician is assigned, by first name', async () => {
      key = await assignBest(guest.id);
      const sent = await textsSoFar();
      assert.equal(sent.length, 2);
      assert.ok(sent[1].includes(guest.reference));
      assert.ok(sent[1].includes(`/track/${guest.trackingToken}`));
    });

    it('texts on the way, arrived and resolved, and says nothing when work starts', async () => {
      for (const status of ['ON_THE_WAY', 'ARRIVED', 'WORKING']) {
        const res = await setStatus(guest.id, tokens[key], { status });
        assert.equal(res.status, 200, JSON.stringify(res.body));
      }
      assert.equal((await textsSoFar()).length, 4); // working sent nothing
      const done = await setStatus(guest.id, tokens[key], {
        status: 'RESOLVED',
        resolutionNote: 'Reset the breaker.',
      });
      assert.equal(done.status, 200, JSON.stringify(done.body));
      const sent = await textsSoFar();
      assert.equal(sent.length, 5);
      assert.match(sent[2], /on the way/i);
      assert.match(sent[3], /arrived/i);
      assert.match(sent[4], /still off/i);
    });

    it('keeps every text to one 160-character message', async () => {
      for (const text of await textsSoFar()) assert.ok(text.length <= 160, text);
    });

    it('still saves the report when the gateway fails', async () => {
      setSmsProvider({
        send: async () => {
          throw new Error('gateway down');
        },
      });
      const failed = await reportAsGuest({ contactPhone: '079 555 0008' });
      await whenSmsIdle();
      assert.match(failed.reference, /^FR-\d+$/);
      setSmsProvider({ send: async (message) => void texts.push(message) });
    });

    it('does not text a registered customer more than before', async () => {
      const before = texts.length;
      const res = await call('POST', '/faults', {
        token: tokens.aline,
        body: { category: 'LOW_VOLTAGE' },
      });
      assert.equal(res.status, 201, JSON.stringify(res.body));
      await whenSmsIdle();
      assert.equal(texts.length - before, 1); // "received" only, as today
      const key2 = await assignBest(res.body.fault.id);
      await setStatus(res.body.fault.id, tokens[key2], { status: 'ON_THE_WAY' });
      await whenSmsIdle();
      assert.equal(texts.length - before, 2); // plus "assigned"; on the way is in the app, not by SMS
    });
  });

  describe('limits', () => {
    it('answers 429 after 3 reports from the same phone number in an hour', async () => {
      const phone = '078 555 0005';
      for (let i = 0; i < 3; i += 1) await reportAsGuest({ contactPhone: phone });
      const res = await call('POST', '/public/faults', {
        body: guestBody({ contactPhone: phone }),
      });
      assert.equal(res.status, 429);
      assert.match(res.body.error.message, /too many/i);
    });

    it('rejects a report whose hidden field was filled in', async () => {
      const res = await call('POST', '/public/faults', {
        body: guestBody({ contactPhone: '078 555 0006', website: 'http://spam.example' }),
      });
      assert.equal(res.status, 400);
    });
  });
});
