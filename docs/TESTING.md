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

| Area                     | Inputs tested                                                                     | Expected behaviour                                                              |
| ------------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Authentication           | wrong password, unknown email, malformed email, no token, tampered token          | 401 with the same message for both login failures; 400 for malformed email      |
| Full workflow            | report → rank → assign → on the way → arrived → working → resolved                | each status stored, all six timestamps set, five customer notifications         |
| Authorization            | other customer, unassigned technician, customer assigning, staff reporting        | 403                                                                             |
| Invalid input            | missing category, `abc` id, unknown id, bad JSON, unknown route, out-of-range GPS | 400 / 404 with a readable message                                               |
| Workflow rules           | skipping a stage, resolving with a blank note, changing a resolved fault          | 409 / 400                                                                       |
| Concurrency              | five identical status updates at once; two assignments at once                    | exactly one succeeds, the others get 409; no duplicate history or notifications |
| Cancellation & analytics | coordinator cancels; analytics after many changes                                 | customer notified; technician blocked; averages never negative                  |

**Result:** 26 / 26 passing, in 3 consecutive runs.

**Improvement made because of it:** before the fix, simultaneous "On the way" taps **all** succeeded, creating duplicate history rows and duplicate customer notifications, and two coordinators could both assign a technician. With the fix removed, both concurrency tests failed in 3 of 3 runs; with the fix, both pass. Updates are now conditional on the status that was checked (optimistic concurrency), so the later requests get _409 – refresh to see the latest status_.

The repeated-tap test first sends a few reads to warm up the database connections. Without that warm-up, the first request ran on an already-open connection and finished before the others had connected, so the race never happened and the test passed even without the fix.

## 3. Performance / load testing

**Why:** every dashboard polls the API every 4–6 s, so many open screens means many requests.

**How:** `npm run test:perf` (read-only GET requests, 200 per endpoint, 10 concurrent). It was run against a local API started on the test database (`API_URL=http://localhost:4100`). Point it at the live API with `API_URL=…`.

**Result (development laptop, local API and PostgreSQL 18, seeded test data plus the integration-test faults, 1,400 requests, 0 errors):**

| Endpoint                  | req/s | p50 ms | p95 ms | p99 ms |
| ------------------------- | ----- | ------ | ------ | ------ |
| GET /health               | 762   | 6      | 19     | 150    |
| GET /faults (all)         | 249   | 37     | 53     | 87     |
| GET /stats/overview       | 472   | 20     | 28     | 31     |
| GET /stats/analytics      | 361   | 26     | 40     | 56     |
| GET /notifications        | 713   | 13     | 22     | 28     |
| GET /faults/:id           | 484   | 20     | 25     | 28     |
| GET /technicians?faultId= | 479   | 21     | 24     | 26     |

`GET /faults` was the slowest because it returned every fault with its full history. That is why the coordinator list is now paged (opt-in `?page=&pageSize=`, 20 per page, 100 at most). _The p99 for `/health` is the first requests opening connections._ Re-run against the deployed Render API for the report; the free tier will be slower and the first request includes the wake-up delay.

### 3a. Paging with 2,028 faults (1 Nov 2026)

`npm run test:perf:seed` adds 2,000 synthetic faults (about 9,500 status-history rows) to the **test** database only, behind the same safety checks as the integration tests. The load test then compared the whole list with one page. Same laptop, local API and PostgreSQL, 200 requests per endpoint, 10 at a time, 0 errors. Single run; latencies move by tens of percent between runs on a laptop, so read the sizes first and the times second.

| Request                                     | Response size | req/s | p50 ms | p95 ms | p99 ms |
| ------------------------------------------- | ------------- | ----- | ------ | ------ | ------ |
| `GET /faults?status=ALL` (everything)       | 3,105 KB      | 3     | 3,743  | 5,146  | 5,614  |
| `GET /faults?status=ALL&page=1&pageSize=20` | 28 KB         | 130   | 72     | 113    | 161    |

A page is about 110 times smaller and answers about 50 times faster at the median. The unpaged request was already acceptable with about 20 faults and was not at 2,028, which is the case for paging. Only the coordinator's Fault management page is paged; the customer, technician and mobile screens still fetch their own, short lists.

**Found by the same run:** with 2,028 faults `GET /stats/analytics` rose to p50 319 ms and about 31 req/s (from 26 ms and 361 req/s on about 50 faults), and `/stats/overview` to 106 ms. Both read every fault into the API and average in JavaScript. Doing the averaging in SQL is the next change to make; it has not been done.

**Method note:** the first attempts compared against a stale API process that was still reading the small development database. Both list requests came back at 27 KB, which is how it was noticed. The API now prints `Using database <host>:<port>/<name>` at start-up so this is visible.

## 3b. Android app testing

The Android app (`mobile/`) has two layers: automated checks that run anywhere (Jest, the project checker and a full bundle), and a manual checklist on real phones for what a computer cannot show (maps, GPS, camera, push).

### Automated

```bash
cd mobile
npm test                                   # Jest with jest-expo and Testing Library
npx expo-doctor                            # project and dependency-version checks
npx expo export --platform android         # bundles the whole app; fails on any import or syntax error
cd ../frontend && npm test                 # includes sharedWithMobile.test.js
cd ../backend && npm test                  # includes authSchemas.test.js and pushService.test.js
```

**What the Jest tests cover (mobile, 84 tests in 11 suites):**

| Suite                                 | Tests | What is checked                                                                                                                                                                                                                                                                                          |
| ------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/api.test.js`                     | 9     | Bearer token sent; JSON body; non-JSON failure becomes an `ApiError`; the API's message and field details are used; a 401 clears the token and signs out, except on `/auth/login`; network failure gives status 0; the 70 s timeout; a caller's own abort passes through                                 |
| `context/AuthContext.test.js`         | 11    | Customer and technician logins store the token; the app asks for a mobile session; a coordinator is refused and nothing is stored; the session is restored through `/auth/me`; logout clears the token, unregisters the push token first and still signs out if that fails                               |
| `lib/mapParts.test.js`                | 8     | Which markers and lines each status shows: no technician for `REPORTED`; a line only while travelling; "on site" marker for `ARRIVED`/`WORKING`; nothing for `RESOLVED`/`CANCELLED` or an unknown position                                                                                               |
| `lib/photo.test.js`                   | 3     | A photo data URL is accepted only if it is an image and within the API's 1,500,000-character limit (checked exactly at the limit)                                                                                                                                                                        |
| `hooks/useApi.test.js`                | 9     | Polls on the interval; stops in the background and when the screen loses focus; reloads on return; keeps the last good data when a refresh fails; clears the old record when the path changes; flags "offline" only for a lost connection (not a server error) and clears it when the connection returns |
| `components/States.test.js`           | 5     | "No connection" with the reason and Try again when the server cannot be reached; the generic title for a server error; a "No connection" strip above already-loaded content, with its own Try again; no strip when online                                                                                |
| `lib/location.test.js`                | 8     | Distance calculation; first fix always posts; a fix 10 s later never posts; 20 s later but 10 m away does not; 20 s and 30 m posts; both limits exactly met posts; only the three on-the-job statuses are tracked                                                                                        |
| `lib/jobs.test.js`                    | 4     | Which job is "active": a started job first, otherwise the oldest assignment; resolved and cancelled ignored                                                                                                                                                                                              |
| `components/ActiveJobTracker.test.js` | 11    | Starts for `ON_THE_WAY` and posts with the job id; not for `ASSIGNED`; stops on `RESOLVED` and in the background; a too-early fix is retried once after 15 s; one message when permission is refused, not repeated on return; a failed post or a failed GPS start does not crash                         |
| `lib/push.test.js`                    | 9     | Where a tapped notification opens for each role, with and without a fault; no push token when permission is denied, on an emulator, or when the token request fails                                                                                                                                      |
| `hooks/usePushRegistration.test.js`   | 7     | Registers once after sign-in; again when Expo changes the token; for the new user when another signs in on the same phone; not when signed out or when no token; stops listening on sign-out                                                                                                             |

**Backend additions:** `pushService.test.js` (10 tests, with a fake Expo client: message contents, each user gets only their own, invalid tokens skipped, `DeviceNotRegistered` removes the token at send time and from a receipt, a failure never propagates). Integration tests added to `workflow.test.js`: mobile session length (12 h / 30 d, bad client value rejected), a technician posting a location for their own job and being refused for another's, and device registration, token moving between users, deletion and the push sent at each step of a fault.

**Frontend addition:** `sharedWithMobile.test.js` keeps the app's copy of `format.js` identical in content to the web's and checks its labels against the API's enums, so the two cannot drift apart.

**Results (29 Oct 2026, development laptop, Windows 11):**

| Command                                                                     | Result                                                                                                                                               |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cd mobile && npm test`                                                     | 84 / 84 passing, 11 suites                                                                                                                           |
| `cd mobile && npx expo-doctor`                                              | 20 / 20 checks passed                                                                                                                                |
| `cd mobile && npx expo export --platform android`                           | completes (one Hermes bundle, about 3 MB)                                                                                                            |
| `cd frontend && npm test` and `npm run build`                               | 11 / 11 passing; build succeeds                                                                                                                      |
| `cd backend && npm test`                                                    | 72 / 72 passing (31 Oct 2026; adds SMS service and `distanceMetres` tests)                                                                           |
| `cd backend && DATABASE_URL="$TEST_DATABASE_URL" npx prisma migrate deploy` | applies `20261028120000_add_device_tokens`; `prisma migrate diff` against `schema.prisma` reports no difference (30 Oct 2026)                        |
| `cd backend && npm run test:integration`                                    | 45 / 45 passing, 12 suites, about 7 s (31 Oct 2026), including mobile sessions, device tokens/push, arrival distance (FR11) and SMS notices (FR9)    |
| GitHub Actions (`backend`, `frontend`, `mobile`)                            | all three jobs green on `feature/android-mobile-app-continued` (31 Oct 2026), after bumping four Expo SDK 58 patch versions that expo-doctor flagged |

**Bug found by a code review and fixed (with a test where the behaviour is testable):** reused tab screens kept a finished report's form and a disabled Submit button; opening a second job briefly showed the first; the map zoomed in too far when the technician was on site; the hardware Back button went to Home; a late location fix could be posted after a job ended; and the "Sharing your location" notice appeared even when permission was refused.

### Manual device checklist

Run on a real Android phone with the development build (or the `preview` APK) against the Render API. Tick each row only after seeing it work, and note the phone model and Android version.

| #   | Check                                                                                                                                                                                                                                                                                                                                                           | Result |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Sign in as Aline: customer tabs (Home, Report, Reports, Alerts)                                                                                                                                                                                                                                                                                                 |        |
| 2   | Sign in as Jean Claude: technician tabs (Home, Jobs, Alerts)                                                                                                                                                                                                                                                                                                    |        |
| 3   | Sign in as Grace: "Coordinators use the web app." and back to login                                                                                                                                                                                                                                                                                             |        |
| 4   | Force-close and reopen: still signed in                                                                                                                                                                                                                                                                                                                         |        |
| 5   | With Render asleep: "Waking the server…" appears, then sign-in succeeds                                                                                                                                                                                                                                                                                         |        |
| 6   | The map shows tiles around Ndera with a marker, a dashed line and the attribution                                                                                                                                                                                                                                                                               |        |
| 7   | Report a fault with a gallery photo; then with a camera photo. Both submit and appear in Reports                                                                                                                                                                                                                                                                |        |
| 8   | Coordinator assigns on the web; the tracking screen shows the technician and updates with each status                                                                                                                                                                                                                                                           |        |
| 9   | Switching tabs or backgrounding the app stops requests (check the API log)                                                                                                                                                                                                                                                                                      |        |
| 10  | Technician: Start Response, Arrived, Start Work, Record Resolution all work; the customer's phone follows                                                                                                                                                                                                                                                       |        |
| 11  | The location prompt appears when the job goes On the way; the customer's map shows the technician moving; locking the phone stops the updates                                                                                                                                                                                                                   |        |
| 12  | "Navigate to Location" opens Google Maps with directions; both Call buttons open the dialer                                                                                                                                                                                                                                                                     |        |
| 13  | Each phone registers a push token after sign-in                                                                                                                                                                                                                                                                                                                 |        |
| 14  | A push arrives for each step with the app in the foreground, in the background and force-closed                                                                                                                                                                                                                                                                 |        |
| 15  | Tapping a push opens the right fault or job, including from a cold start                                                                                                                                                                                                                                                                                        |        |
| 16  | The Alerts tab matches the notifications, the badge count is right and "Mark all as read" clears it                                                                                                                                                                                                                                                             |        |
| 17  | Sign out stops pushes to that phone; signing in as the other role sends pushes only to that role                                                                                                                                                                                                                                                                |        |
| 18  | Airplane mode: every data screen shows the offline message and recovers when the connection returns                                                                                                                                                                                                                                                             |        |
| 19  | Android settings → App permissions lists only location, camera and notifications. (Checked on the generated manifest: INTERNET, fine and coarse location, CAMERA and POST_NOTIFICATIONS are requested; storage, boot-completed, overlay and microphone permissions are removed. VIBRATE, an install-time permission that does not appear in settings, remains.) |        |

## 4. Compatibility testing (manual – fill in)

| Environment                                                                      | Version | Login | Report fault | Assign | Status updates | Map | Notes                                  |
| -------------------------------------------------------------------------------- | ------- | ----- | ------------ | ------ | -------------- | --- | -------------------------------------- |
| Chrome (Windows/macOS)                                                           |         |       |              |        |                |     |                                        |
| Firefox                                                                          |         |       |              |        |                |     |                                        |
| Edge                                                                             |         |       |              |        |                |     |                                        |
| Safari (iPhone)                                                                  |         |       |              |        |                |     |                                        |
| Chrome (Android, low-end phone)                                                  |         |       |              |        |                |     |                                        |
| Android app (development build / `preview` APK): phone model and Android version |         |       |              |        |                |     | See the manual device checklist in §3b |

Use Chrome DevTools → Lighthouse (mobile) for a performance score, and the Performance panel for load time on a "Slow 4G / 4× CPU slowdown" profile to simulate a low-end phone.

## 5. Usability testing (manual)

Ask 3–5 pilot customers to report a fault and follow it without help. Record time to submit and any step where they hesitated. Feeds the Google Form evaluation.
