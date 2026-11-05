// Guards the verbatim mobile copies of the shared lib files; if it fails, copy the frontend file over its mobile twin.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as format from './format.js';
import * as backend from '../../../backend/src/utils/constants.js';

// Compared without line endings, because a Windows checkout may turn one copy into CRLF.
const read = (relative) =>
  readFileSync(new URL(relative, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

describe('lib files shared with the mobile app', () => {
  for (const name of ['format.js', 'statusTone.js', 'reportSteps.js', 'landingCopy.js']) {
    it(`has the same ${name} in frontend and mobile`, () => {
      assert.equal(
        read(`../../../mobile/src/lib/${name}`),
        read(`./${name}`),
        `mobile/src/lib/${name} differs from frontend/src/lib/${name}`
      );
    });
  }
});

describe('format.js shared with the mobile app', () => {
  it('lists the same stages as the API', () => {
    assert.deepEqual(format.STAGES, backend.STATUS_FLOW);
    assert.deepEqual(format.OPEN_STATUSES, backend.OPEN_STATUSES);
  });

  it('has a label for every status the API can stamp', () => {
    assert.deepEqual(
      Object.keys(format.STATUS_LABEL).sort(),
      Object.keys(backend.STATUS_TIMESTAMP).sort()
    );
  });

  it('has a label for every fault category', () => {
    assert.deepEqual(
      format.CATEGORIES.map((c) => c.value).sort(),
      Object.keys(format.CATEGORY_LABEL).sort()
    );
    assert.deepEqual(
      Object.keys(format.CATEGORY_LABEL).sort(),
      Object.keys(backend.CATEGORY_LABEL).sort()
    );
  });
});
