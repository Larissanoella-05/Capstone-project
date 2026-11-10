# Testing

Five approaches, each chosen for a specific risk. Counts taken on 9 Nov 2026 (Windows 11, Node 24, PostgreSQL 18).

| Approach                    | Why                                                      | Result                                          |
| --------------------------- | -------------------------------------------------------- | ----------------------------------------------- |
| Unit                        | Workflow rules, ranking and validation break quietly     | 534 pass: backend 222, frontend 148, mobile 164 |
| Integration                 | The value is the hand-off between roles via one database | 104 pass, 27 suites, about 26 s                 |
| Load                        | Every open screen polls the API every 4 to 15 s          | Tables below                                    |
| Code review of both apps    | Finds what tests miss                                    | 8 problems fixed, no feature broken             |
| Manual device and usability | Maps, GPS, camera and push need a real phone             | Section 5                                       |

CI (GitHub Actions) runs lint, format, type-check and unit tests on every pull request.

## 1. Unit

```bash
npm test          # repo root: backend, frontend and mobile
```

Covers the status machine, ranking, phone and photo rules, validators, the mobile API client, sign-in and
sign-up, polling, location throttling and push registration. Found: a validator that never turned empty text into
"no value", and a list that accepted `?status=banana` and returned nothing. Both fixed.

## 2. Integration

Real API, real PostgreSQL, over HTTP. The tests wipe their database, so they refuse to run unless
`TEST_DATABASE_URL` is set, ends in `_test`, is on localhost, differs from `DATABASE_URL`, and holds only demo data.

```bash
psql -U postgres -c "CREATE DATABASE umuriro_test;"
export TEST_DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/umuriro_test?schema=public"
cd backend
DATABASE_URL="$TEST_DATABASE_URL" npx prisma migrate deploy
npm run test:integration
```

| Area                      | Checked                                                                      | Expected                                              |
| ------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------- |
| Sign-in                   | wrong password, unknown user, bad identifier, no or tampered token           | 401 (400 for a bad identifier)                        |
| Registration              | valid, `role` field, short password, duplicate phone or email, twice at once | created and signed in; 400; 409; nothing half-created |
| Sign-up limit             | 11 sign-ups in an hour from one network                                      | the 11th gets 429                                     |
| Full workflow             | report, rank, assign, on the way, arrived, working, resolved                 | every status and time stored; customer notified       |
| Permissions               | another customer's fault, customer assigning, unassigned technician          | 403                                                   |
| Assignment                | busy, twice, unknown, reassigned, off-duty technician                        | allowed / 409 / 404 / moves / 409                     |
| Workflow rules            | skipping a stage, blank outcome note, changing a resolved fault              | 409 or 400                                            |
| Double taps               | five identical updates at once; two assignments at once                      | one succeeds, the rest 409; no duplicates             |
| Guest report and tracking | invalid phone, no place, hidden field; right, wrong, expired token           | 400; guest sees progress, the rest 404                |
| Guest limit               | 4 reports from one phone in an hour                                          | the fourth gets 429                                   |
| SMS                       | each status change, gateway down                                             | one text each; failure never fails the report         |
| Paging and analytics      | pages, bad `page`, 300 generated faults vs plain JavaScript                  | same numbers, no gaps or overlap                      |

**What changed:** simultaneous "On the way" taps all succeeded and made duplicate history, and two coordinators
could assign one fault. Optimistic concurrency (`guardedUpdate`) fixed both; with the fix removed the tests failed
3 of 3 times. A first version of the test passed without the fix until connections were warmed up first.

## 3. Load

`npm run test:perf:seed` adds 2,000 synthetic faults to the test database; `npm run test:perf` sends 200
read-only requests per endpoint, 10 at a time. Single runs on a laptop vary by about 30%, so trust sizes over times.

| Local, 2,028 faults    | Before                               | After                            |
| ---------------------- | ------------------------------------ | -------------------------------- |
| Fault list             | 3,105 KB, p50 3,743 ms, 3 requests/s | 28 KB, p50 72 ms, 130 requests/s |
| `GET /stats/analytics` | p50 319 ms                           | p50 67 ms                        |
| `GET /stats/overview`  | p50 106 ms                           | p50 36 ms                        |

The list is now paged (20 per page) and averages are computed in PostgreSQL.

**Live Render API** (9 Nov 2026, 1,600 requests, 0 errors, small demo database, includes network from a laptop):

| Request                          | KB  | p50 (ms) | p95 (ms) | Requests/s |
| -------------------------------- | --- | -------- | -------- | ---------- |
| `GET /health`                    | 0   | 345      | 553      | 25         |
| `GET /faults?status=ALL` (paged) | 28  | 616      | 765      | 15         |
| `GET /stats/overview`            | 0   | 409      | 553      | 23         |
| `GET /stats/analytics`           | 1   | 408      | 551      | 23         |
| `GET /notifications`             | 0   | 405      | 453      | 24         |
| `GET /technicians?faultId=…`     | 2   | 481      | 686      | 19         |
| `GET /faults/:id`                | 717 | 869      | 1,856    | 10         |

One fault is slowest because it carries photos as data URLs (a documented scope decision). **Cold start:** the
first request after the free tier slept took 24.4 s; the next took 0.6 s.

## 4. Android and review

```bash
cd mobile && npm test && npx expo-doctor && npx expo export --platform android
```

164 Jest tests in 20 suites, `expo-doctor` 20 of 20, and a full bundle. Two read-only reviews of both apps fixed
8 problems, e.g. sign-out could freeze for 70 s waiting on a sleeping server (now at most 3 s, with a test that
fails on the old code).

## 5. Manual checks

Device: TECNO KG5j, Android 11, EAS `preview` build of commit `74fcfaa`, against the live server.

| #   | Check                                                         | Result                                                                                                         |
| --- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1   | SMS with tracking link arrives and opens the right report     | Pass in a local run (10 Nov): real texts reached an iPhone; link opened FR-1022. Deployed app still logs texts |
| 2   | Coordinator assigns; technician sees the job                  | Pass on the phone (assigned via API). Web assign screen not checked                                            |
| 3   | Technician moves through all stages                           | Pass for a signed-in customer, each step stored with name and time. Guest page not checked                     |
| 4   | Android sign-in as customer and technician; reopen stays in   | Pass                                                                                                           |
| 5   | Android: create account, report, sign out, sign in with phone | Create and report pass; phone sign-in passed for the seeded customer, not the new account                      |
| 6   | Push with app open, background, closed                        | Open: pass. Background and closed: not checked                                                                 |

Not tested: guest report from a phone browser, photos over 1 MB, location while the phone is locked, airplane
mode, and any browser other than desktop Chrome.

**Lighthouse** (live landing page, mobile profile, 10 Nov 2026): performance 64, accessibility 98, best practices
100, SEO 92. LCP 5.6 s.

**Usability:** no sessions with real users have been run, so there is no usability result.
