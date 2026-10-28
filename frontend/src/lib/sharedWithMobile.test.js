// Guards the verbatim copy of format.js used by the Android app, and that its labels still
// cover the enums the API uses. If this fails, copy frontend/src/lib/format.js over mobile/src/lib/format.js.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as format from './format.js';
import * as backend from '../../../backend/src/utils/constants.js';

const read = (relative) => readFileSync(new URL(relative, import.meta.url));

describe('format.js shared with the mobile app', () => {
  it('is byte-identical in frontend and mobile', () => {
    assert.ok(
      read('./format.js').equals(read('../../../mobile/src/lib/format.js')),
      'mobile/src/lib/format.js differs from frontend/src/lib/format.js'
    );
  });

  it('lists the same stages as the API', () => {
    assert.deepEqual(format.STAGES, backend.STATUS_FLOW);
    assert.deepEqual(format.OPEN_STATUSES, backend.OPEN_STATUSES);
  });

  it('has a label for every status the API can stamp', () => {
    assert.deepEqual(Object.keys(format.STATUS_LABEL).sort(), Object.keys(backend.STATUS_TIMESTAMP).sort());
  });

  it('has a label for every fault category', () => {
    assert.deepEqual(format.CATEGORIES.map((c) => c.value).sort(), Object.keys(format.CATEGORY_LABEL).sort());
    assert.deepEqual(Object.keys(format.CATEGORY_LABEL).sort(), Object.keys(backend.CATEGORY_LABEL).sort());
  });
});
