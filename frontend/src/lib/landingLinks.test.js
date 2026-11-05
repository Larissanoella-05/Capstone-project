import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { homeDecision, loginLink, TARGETS } from './landingLinks.js';

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
