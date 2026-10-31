import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  UnsafeTestDatabaseError,
  checkTestDatabaseConfig,
} from '../integration/testDatabaseGuard.js';

const DEV = 'postgresql://user:pw@localhost:5432/umuriro_database?schema=public';
const TEST = 'postgresql://user:pw@localhost:5432/umuriro_test?schema=public';

const refuses = (testUrl, devUrls, messagePart) =>
  assert.throws(
    () => checkTestDatabaseConfig(testUrl, devUrls),
    (error) => {
      assert.ok(error instanceof UnsafeTestDatabaseError);
      assert.match(error.message, messagePart);
      return true;
    }
  );

describe('integration test database guard', () => {
  it('accepts a separate local database whose name ends in _test', () => {
    assert.equal(checkTestDatabaseConfig(TEST, [DEV]).database, 'umuriro_test');
  });

  it('refuses to run when TEST_DATABASE_URL is missing (no fallback to DATABASE_URL)', () => {
    // null, not undefined: undefined would fall back to the real process.env.TEST_DATABASE_URL.
    refuses(null, [DEV], /TEST_DATABASE_URL is not set/);
    refuses('', [DEV], /TEST_DATABASE_URL is not set/);
  });

  it('refuses the development database, even if it is spelled differently', () => {
    const devAsTest = 'postgresql://other:x@127.0.0.1/my_test';
    refuses(
      devAsTest,
      ['postgresql://user:pw@localhost:5432/my_test'],
      /same database as DATABASE_URL/
    );
  });

  it('refuses a database name that does not end in _test', () => {
    refuses('postgresql://u:p@localhost:5432/umuriro_database', [], /must end in "_test"/);
    refuses('postgresql://u:p@localhost:5432/test_umuriro', [], /must end in "_test"/);
  });

  it('refuses a remote server such as a hosted production database', () => {
    refuses('postgresql://u:p@ep-example.neon.tech:5432/umuriro_test', [], /remote server/);
  });

  it('refuses a URL that is not PostgreSQL or cannot be parsed', () => {
    refuses('mysql://u:p@localhost:3306/umuriro_test', [], /postgresql/);
    refuses('not a url', [], /not a valid connection URL/);
  });
});
