# Testing and validation

Three automated strategies plus two manual checklists. Results below are from the run on 20 Oct 2026 on the development laptop (Windows 11, Node 24, PostgreSQL 18); re-run and update before submitting.

## 1. Unit testing (`node:test`, no extra dependencies)

**Why:** the workflow rules, the technician ranking and the input validation are the logic most likely to break silently. They are pure functions or classes, so they can be tested without a database.

**How:**

```bash
cd backend && npm test      # 42 tests: status machine, ranker, haversine, validators, middleware, messages, test-database guard
cd frontend && npm test     # 7 tests: shared labels and formatting helpers
```

**Result:** 49 / 49 passing (42 backend, 7 frontend). The frontend production build (`npm run build`) also succeeds.

**Improvement made because of it:** the `optionalText` validator was meant to turn empty strings into "no value" but never did (its fallback branch could not run). The test exposed it and the helper was fixed.

## 2. Integration testing (real API + real PostgreSQL)

**Why:** the core value of the system is the hand-off between three roles through one database. Only an end-to-end test proves the hand-off, the permissions and the notifications work together.

**How:** the tests reset a **separate** test database with the seed data, start the Express app on a random port and call it over HTTP. See README §6 for the exact commands.

**Database safety:** because the seed TRUNCATEs every table, `tests/integration/testDatabaseGuard.js` runs first and stops the run (nothing changed) unless:

1. `TEST_DATABASE_URL` is set explicitly. There is no fallback to `DATABASE_URL`.
2. The database name ends in `_test`.
3. It is not the same host, port and database as `DATABASE_URL` in `backend/.env` or the shell.
4. It is on `localhost` (a hosted database such as production on Neon is refused).
5. After connecting, `current_database()` matches, and every existing account is a demo `@demo.rw` account.

Each refusal was checked by hand: a missing variable, the development URL, and a test database containing one non-demo account were all refused with exit code 1, and the development database row counts were identical before and after all test runs. Checks 1–4 also have unit tests (`tests/unit/testDatabaseGuard.test.js`).

Covers (26 tests):

| Area | Inputs tested | Expected behaviour |
|---|---|---|
| Authentication | wrong password, unknown email, malformed email, no token, tampered token | 401 with the same message for both login failures; 400 for malformed email |
| Full workflow | report → rank → assign → on the way → arrived → working → resolved | each status stored, all six timestamps set, five customer notifications |
| Authorization | other customer, unassigned technician, customer assigning, staff reporting | 403 |
| Invalid input | missing category, `abc` id, unknown id, bad JSON, unknown route, out-of-range GPS | 400 / 404 with a readable message |
| Workflow rules | skipping a stage, resolving with a blank note, changing a resolved fault | 409 / 400 |
| Concurrency | five identical status updates at once; two assignments at once | exactly one succeeds, the others get 409; no duplicate history or notifications |
| Cancellation & analytics | coordinator cancels; analytics after many changes | customer notified; technician blocked; averages never negative |

**Result:** 26 / 26 passing, in 3 consecutive runs.

**Improvement made because of it:** before the fix, simultaneous "On the way" taps **all** succeeded, creating duplicate history rows and duplicate customer notifications, and two coordinators could both assign a technician. With the fix removed, both concurrency tests failed in 3 of 3 runs; with the fix, both pass. Updates are now conditional on the status that was checked (optimistic concurrency), so the later requests get *409 – refresh to see the latest status*.

The repeated-tap test first sends a few reads to warm up the database connections. Without that warm-up, the first request ran on an already-open connection and finished before the others had connected, so the race never happened and the test passed even without the fix.

## 3. Performance / load testing

**Why:** every dashboard polls the API every 4–6 s, so many open screens means many requests.

**How:** `npm run test:perf` (read-only GET requests, 200 per endpoint, 10 concurrent). It was run against a local API started on the test database (`API_URL=http://localhost:4100`). Point it at the live API with `API_URL=…`.

**Result (development laptop, local API and PostgreSQL 18, seeded test data plus the integration-test faults, 1,400 requests, 0 errors):**

| Endpoint | req/s | p50 ms | p95 ms | p99 ms |
|---|---|---|---|---|
| GET /health | 762 | 6 | 19 | 150 |
| GET /faults (all) | 249 | 37 | 53 | 87 |
| GET /stats/overview | 472 | 20 | 28 | 31 |
| GET /stats/analytics | 361 | 26 | 40 | 56 |
| GET /notifications | 713 | 13 | 22 | 28 |
| GET /faults/:id | 484 | 20 | 25 | 28 |
| GET /technicians?faultId= | 479 | 21 | 24 | 26 |

`GET /faults` is the slowest because it returns each fault with its full history. If the pilot grows, add pagination there first. (The p99 for `/health` is the first requests opening connections.) *Re-run against the deployed Render API for the report; the free tier will be slower and the first request includes the wake-up delay.*

## 4. Compatibility testing (manual – fill in)

| Environment | Version | Login | Report fault | Assign | Status updates | Map | Notes |
|---|---|---|---|---|---|---|---|
| Chrome (Windows/macOS) | | | | | | | |
| Firefox | | | | | | | |
| Edge | | | | | | | |
| Safari (iPhone) | | | | | | | |
| Chrome (Android, low-end phone) | | | | | | | |

Use Chrome DevTools → Lighthouse (mobile) for a performance score, and the Performance panel for load time on a "Slow 4G / 4× CPU slowdown" profile to simulate a low-end phone.

## 5. Usability testing (manual)

Ask 3–5 pilot customers to report a fault and follow it without help. Record time to submit and any step where they hesitated. Feeds the Google Form evaluation.
