// Unit tests for restoring a saved sign-in after a page reload. Run with: npm test
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { restoreSession } from './session.js';

/** A token store that remembers what happened to it. */
function fakeTokenStore(token) {
  return {
    token,
    get() {
      return this.token;
    },
    clear() {
      this.token = null;
    },
  };
}

const failure = (status) => Object.assign(new Error(`failed ${status}`), { status });

describe('restoreSession', () => {
  it('returns null without calling the API when no token is saved', async () => {
    let called = false;
    const user = await restoreSession({
      api: async () => {
        called = true;
      },
      tokenStore: fakeTokenStore(null),
    });
    assert.equal(user, null);
    assert.equal(called, false);
  });

  it('returns the signed-in user for a valid token and keeps the token', async () => {
    const tokenStore = fakeTokenStore('abc');
    const user = await restoreSession({
      api: async (path) => {
        assert.equal(path, '/auth/me');
        return { user: { id: 1, role: 'CUSTOMER' } };
      },
      tokenStore,
    });
    assert.deepEqual(user, { id: 1, role: 'CUSTOMER' });
    assert.equal(tokenStore.get(), 'abc');
  });

  it('forgets a token the server rejected (401)', async () => {
    const tokenStore = fakeTokenStore('expired');
    const user = await restoreSession({
      api: async () => {
        throw failure(401);
      },
      tokenStore,
    });
    assert.equal(user, null);
    assert.equal(tokenStore.get(), null);
  });

  it('keeps the token when the server is unreachable (status 0), so a reload can try again', async () => {
    const tokenStore = fakeTokenStore('abc');
    assert.equal(
      await restoreSession({
        api: async () => {
          throw failure(0);
        },
        tokenStore,
      }),
      null
    );
    assert.equal(tokenStore.get(), 'abc');
  });

  it('keeps the token on a server error (500) or a gateway timeout (504)', async () => {
    for (const status of [500, 504]) {
      const tokenStore = fakeTokenStore('abc');
      await restoreSession({
        api: async () => {
          throw failure(status);
        },
        tokenStore,
      });
      assert.equal(tokenStore.get(), 'abc', String(status));
    }
  });

  it('does not throw when the failure has no status at all', async () => {
    const tokenStore = fakeTokenStore('abc');
    assert.equal(
      await restoreSession({
        api: async () => {
          throw new Error('boom');
        },
        tokenStore,
      }),
      null
    );
    assert.equal(tokenStore.get(), 'abc');
  });
});
