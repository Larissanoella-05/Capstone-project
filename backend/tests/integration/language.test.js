/** The notification language, over HTTP against PostgreSQL; refuses to run unless TEST_DATABASE_URL is a local test database. */
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
let setSmsProvider;
let token;
let userId;
let faultId;

/**
 * @param {string} method
 * @param {string} path
 * @param {{ token?: string, body?: unknown }} [options]
 */
async function call(method, path, { token: bearer, body } = {}) {
  const headers = {};
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${baseUrl}/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await response.json().catch(() => null);
  return { status: response.status, body: json };
}

describe('Notification language', { concurrency: false }, () => {
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

    const login = await call('POST', '/auth/login', {
      body: { identifier: 'aline@demo.rw', password: 'demo1234' },
    });
    token = login.body.token;
    userId = login.body.user.id;
  });

  after(async () => {
    if (prisma) {
      if (faultId) {
        await prisma.notification.deleteMany({ where: { faultId } });
        await prisma.faultStatusHistory.deleteMany({ where: { faultId } });
        await prisma.faultReport.delete({ where: { id: faultId } });
      }
      if (userId) await prisma.user.update({ where: { id: userId }, data: { language: 'en' } });
    }
    if (server) await new Promise((resolve) => server.close(resolve));
    await prisma?.$disconnect();
  });

  it('starts in English and shows the language on the signed-in user', async () => {
    const me = await call('GET', '/auth/me', { token });
    assert.equal(me.body.user.language, 'en');
  });

  it('rejects a language that is not offered, and a request with no sign-in', async () => {
    const bad = await call('PATCH', '/auth/language', { token, body: { language: 'fr' } });
    assert.equal(bad.status, 400);
    const anonymous = await call('PATCH', '/auth/language', { body: { language: 'rw' } });
    assert.equal(anonymous.status, 401);
  });

  it('saves the language and writes the next notification in it', async () => {
    const saved = await call('PATCH', '/auth/language', { token, body: { language: 'rw' } });
    assert.equal(saved.status, 200);
    assert.equal(saved.body.language, 'rw');

    const locations = await call('GET', '/service-locations', { token });
    const created = await call('POST', '/faults', {
      token,
      body: {
        category: 'POWER_OUTAGE',
        contactPhone: '+250788300114',
        serviceLocationId: locations.body.serviceLocations[0].id,
      },
    });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    faultId = created.body.fault.id;

    const notes = await call('GET', '/notifications', { token });
    const received = notes.body.notifications.find(
      (n) => n.faultId === faultId && n.type === 'FAULT_SUBMITTED'
    );
    assert.equal(received.title, 'Ikibazo cyakiriwe');
    assert.match(received.message, new RegExp(created.body.fault.reference));
  });
});
