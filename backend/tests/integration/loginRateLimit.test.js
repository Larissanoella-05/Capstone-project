/** Sign-in attempt limits, over HTTP against PostgreSQL; refuses to run unless TEST_DATABASE_URL is a local test database. */
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
/** Attempts that passed validation; both limiters count exactly these, from this one network. */
let counted = 0;

/** Signs in through the API; every call here counts against the per-network limit. */
async function signIn(identifier, password) {
  counted += 1;
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  const body = await response.json().catch(() => null);
  return { status: response.status, body };
}

describe('Sign-in limits', { concurrency: false }, () => {
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
    server = createApp().listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    await prisma?.$disconnect();
  });

  it('answers 429 on the 11th attempt at one account, even with the right password', async () => {
    for (let attempt = 1; attempt <= 10; attempt += 1) {
      const res = await signIn('aline@demo.rw', 'wrong-password');
      assert.equal(res.status, 401, `attempt ${attempt}`);
    }
    const blocked = await signIn('aline@demo.rw', 'demo1234');
    assert.equal(blocked.status, 429);
    assert.match(blocked.body.error.message, /too many sign-in attempts/i);
    assert.equal(blocked.body.token, undefined);
  });

  it('does not stop a different account from the same network', async () => {
    const res = await signIn('grace@demo.rw', 'demo1234');
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.ok(res.body.token);
  });

  it('answers 429 once one network passes 30 attempts, whatever the account', async () => {
    while (counted < 30) {
      const res = await signIn(`nobody${counted}@demo.rw`, 'wrong-password');
      assert.equal(res.status, 401, `attempt ${counted}`);
    }
    const res = await signIn('nobody-else@demo.rw', 'wrong-password');
    assert.equal(res.status, 429);
    assert.match(res.body.error.message, /too many sign-in attempts/i);
  });

  it('answers 400, not 429, for a malformed form, because validation runs before the limit', async () => {
    // This network is already over its limit from the test above.
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'not a login', password: 'x' }),
    });
    assert.equal(response.status, 400);
  });
});
