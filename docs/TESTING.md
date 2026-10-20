# Testing and validation

Three automated strategies plus two manual checklists. Results below are from the run on 20 Oct 2026; re-run and update before submitting.

## 1. Unit testing (`node:test`, no extra dependencies)

**Why:** the workflow rules, the technician ranking and the input validation are the logic most likely to break silently. They are pure functions or classes, so they can be tested without a database.

**How:**

```bash
cd backend && npm test      # 36 tests: status machine, ranker, haversine, validators, middleware, messages
cd frontend && npm test     # 7 tests: shared labels and formatting helpers
```

**Result:** 43 / 43 passing.

**Improvement made because of it:** the `optionalText` validator was meant to turn empty strings into "no value" but never did (its fallback branch could not run). The test exposed it and the helper was fixed.

## 2. Integration testing (real API + real PostgreSQL)

**Why:** the core value of the system is the hand-off between three roles through one database. Only an end-to-end test proves the hand-off, the permissions and the notifications work together.

**How:** the tests reset a **separate** test database with the seed data, start the Express app on a random port and call it over HTTP.

```bash
createdb umuriro_test   # once
cd backend
DATABASE_URL="postgresql://…/umuriro_test" npx prisma migrate deploy   # once
TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/umuriro_test?schema=public" npm run test:integration
```

Covers (26 tests):

| Area | Inputs tested | Expected behaviour |
|---|---|---|
| Authentication | wrong password, unknown email, malformed email, no token, tampered token | 401 with the same message for both login failures; 400 for malformed email |
| Full workflow | report → rank → assign → on the way → arrived → working → resolved | each status stored, all six timestamps set, five customer notifications |
| Authorization | other customer, unassigned technician, customer assigning, staff reporting | 403 |
| Invalid input | missing category, `abc` id, unknown id, bad JSON, unknown route, out-of-range GPS | 400 / 404 with a readable message |
| Workflow rules | skipping a stage, resolving with a blank note, changing a resolved fault | 409 / 400 |
| Concurrency | two identical status updates at once; two assignments at once | exactly one succeeds, the other gets 409; no duplicate history or notifications |
| Cancellation & analytics | coordinator cancels; analytics after many changes | customer notified; technician blocked; averages never negative |

**Result:** 26 / 26 passing.

**Improvement made because of it:** before the fix, two simultaneous "On the way" taps **both** succeeded, creating duplicate history rows and two identical customer notifications (reproduced against the original code: 2 tests failed). Updates are now conditional on the status that was checked (optimistic concurrency), so the second request gets *409 – refresh to see the latest status*.

## 3. Performance / load testing

**Why:** every dashboard polls the API every 4–6 s, so many open screens means many requests.

**How:** `npm run test:perf` (read-only GET requests, 200 per endpoint, 10 concurrent). Point it at the live API with `API_URL=…`.

**Result (development machine, seeded data, 0 errors; indicative only — measured in a sandbox using Prisma's driver-adapter mode, re-run on your own machine for the report):**

| Endpoint | req/s | p50 ms | p95 ms |
|---|---|---|---|
| GET /health | 580 | 13 | 40 |
| GET /faults (all) | 84 | 116 | 151 |
| GET /stats/overview | 154 | 63 | 82 |
| GET /stats/analytics | 224 | 44 | 57 |
| GET /notifications | 287 | 33 | 46 |
| GET /faults/:id | 151 | 63 | 85 |
| GET /technicians?faultId= | 165 | 59 | 82 |

`GET /faults` is the slowest because it returns each fault with its full history. If the pilot grows, add pagination there first. *Re-run against the deployed Render API for the report; the free tier will be slower and the first request includes the wake-up delay.*

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
