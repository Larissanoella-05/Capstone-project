import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loginSchema } from '../../src/validators/auth.schemas.js';

const credentials = { email: 'aline@demo.rw', password: 'demo1234' };

describe('loginSchema client flag', () => {
  it('accepts web and mobile', () => {
    assert.equal(loginSchema.parse({ ...credentials, client: 'web' }).client, 'web');
    assert.equal(loginSchema.parse({ ...credentials, client: 'mobile' }).client, 'mobile');
  });

  it('is still valid when client is omitted', () => {
    const parsed = loginSchema.safeParse(credentials);
    assert.equal(parsed.success, true);
    assert.equal(parsed.data.client, undefined);
  });

  it('rejects any other client value', () => {
    assert.equal(loginSchema.safeParse({ ...credentials, client: 'desktop' }).success, false);
    assert.equal(loginSchema.safeParse({ ...credentials, client: '' }).success, false);
  });
});
