import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { homeDecision, loginLink, postLoginPath, registerLink, TARGETS } from './landingLinks.js';

const HOME = { CUSTOMER: '/customer', TECHNICIAN: '/technician', COORDINATOR: '/coordinator' };

describe('homeDecision', () => {
  it('waits while the session is being restored', () => {
    assert.equal(homeDecision(null, true, HOME), 'wait');
  });

  it('sends each signed-in role to its own home', () => {
    for (const [role, path] of Object.entries(HOME)) {
      assert.equal(homeDecision({ role }, false, HOME), path);
    }
  });

  it('shows the landing page to a signed-out visitor', () => {
    assert.equal(homeDecision(null, false, HOME), 'landing');
  });
});

describe('loginLink', () => {
  it('goes to /login and carries the target as from', () => {
    for (const target of Object.values(TARGETS)) {
      assert.deepEqual(loginLink(target), { to: '/login', state: { from: target } });
    }
  });

  it('keeps every target inside a role home so Login honours it', () => {
    for (const target of Object.values(TARGETS)) {
      assert.ok(
        Object.values(HOME).some((home) => target.startsWith(home)),
        target
      );
    }
  });
});

describe('postLoginPath', () => {
  it('returns the page the user was heading to when it is in their own area', () => {
    assert.equal(postLoginPath('/coordinator/faults', 'COORDINATOR', HOME), '/coordinator/faults');
    assert.equal(postLoginPath('/customer/report', 'CUSTOMER', HOME), '/customer/report');
    assert.equal(postLoginPath('/technician', 'TECHNICIAN', HOME), '/technician');
  });

  it('falls back to the role home when there is no usable from', () => {
    assert.equal(postLoginPath(undefined, 'CUSTOMER', HOME), '/customer');
    assert.equal(postLoginPath(null, 'CUSTOMER', HOME), '/customer');
    assert.equal(postLoginPath({ pathname: '/customer/report' }, 'CUSTOMER', HOME), '/customer');
  });

  it('does not send a user into another role area', () => {
    assert.equal(postLoginPath('/coordinator/faults', 'TECHNICIAN', HOME), '/technician');
  });

  it('matches whole path segments, not prefixes', () => {
    assert.equal(postLoginPath('/customerX', 'CUSTOMER', HOME), '/customer');
  });
});

describe('registerLink', () => {
  it('goes to the sign-up page without asking for a sign-in first', () => {
    assert.deepEqual(registerLink, { to: '/register' });
  });
});
