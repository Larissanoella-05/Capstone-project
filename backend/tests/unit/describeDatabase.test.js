import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { describeDatabase } from '../../src/utils/describeDatabase.js';

describe('describeDatabase', () => {
  it('names the host, port and database', () => {
    assert.equal(
      describeDatabase('postgresql://postgres:secret@localhost:5432/umuriro_test?schema=public'),
      'localhost:5432/umuriro_test'
    );
  });

  it('never includes the user name or password', () => {
    const text = describeDatabase('postgresql://admin:p%40ss@db.example.com:5432/app');
    assert.equal(text.includes('admin'), false);
    assert.equal(text.includes('p%40ss'), false);
    assert.equal(text.includes('ss'), false);
  });

  it('uses the standard port when none is given', () => {
    assert.equal(
      describeDatabase('postgresql://u:p@db.example.com/app'),
      'db.example.com:5432/app'
    );
  });

  it('says so when the address cannot be read, without echoing it', () => {
    const text = describeDatabase('not a url with secret');
    assert.equal(text, 'an unreadable DATABASE_URL');
    assert.equal(text.includes('secret'), false);
  });
});
