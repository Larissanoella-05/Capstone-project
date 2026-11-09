# Testing

We use five kinds of testing. Each one was chosen for a specific risk. The counts below were taken on 9 Nov 2026 on the development laptop (Windows 11, Node 24, PostgreSQL 18).

| Kind                        | Why                                                          | Result                                          |
| --------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| Unit                        | Workflow rules, ranking and validation break quietly         | 452 pass: backend 196, frontend 127, mobile 129 |
| Integration                 | The value is the hand-off between roles through one database | 86 pass, 21 suites, about 17 s                  |
| Load                        | Every open screen asks the API for data every 4 to 8 seconds | See below                                       |
| Code review of both apps    | Finds what tests do not look for                             | No feature broken; 8 problems fixed             |
| Manual device and usability | Maps, GPS, camera and push need a real phone                 | Checklist and tables below, to be filled in     |

That is 538 automated tests. GitHub Actions runs lint, formatting, type-check and the unit tests on every pull request.

## 1. Unit tests

**Why:** the status machine, the technician ranking, phone and photo rules and the validators are plain logic, so they can be tested fast without a database.

```bash
npm test          # from the repo root: backend, frontend and mobile
```

**What changed because of them:** one validator meant to turn empty text into "no value" never did, and a fault list that accepted `?status=banana` and silently returned nothing. Both were fixed.

## 2. Integration tests

**Why:** only a test through the real API and a real database shows that the roles, permissions and notifications work together.

**How:** the tests reset a separate test database, start the app on a random port and call it over HTTP.

```bash
psql -U postgres -c "CREATE DATABASE umuriro_test;"
export TEST_DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/umuriro_test?schema=public"
cd backend
DATABASE_URL="$TEST_DATABASE_URL" npx prisma migrate deploy
npm run test:integration
```

**Safety:** the tests wipe their database, so they refuse to start unless `TEST_DATABASE_URL` is set, ends in `_test`, is on localhost, is not the development database, and holds only demo accounts. Each refusal was triggered by hand once.

**What they check:**

| Area                      | Inputs                                                                              | Expected                                                              |
| ------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Sign-in                   | wrong password, unknown email, bad email, no token, tampered token                  | 401 (same message for the first two), 400 for a bad email             |
| Full workflow             | report, rank, assign, on the way, arrived, working, resolved                        | every status and time stored; customer notified at each step          |
| Permissions               | another customer's fault, customer assigning, unassigned technician                 | 403                                                                   |
| Bad input                 | missing category, `abc` as id, unknown id, bad JSON, GPS out of range               | 400 or 404 with a readable message                                    |
| Workflow rules            | skipping a stage, blank outcome note, changing a resolved fault                     | 409 or 400                                                            |
| Double taps               | five identical updates at once; two assignments at once                             | one succeeds, the rest get 409; no duplicate history or notifications |
| Report without an account | no sign-in, phone not Rwandan, no place, guest sets a priority, hidden field filled | accepted with a reference and token; the bad ones get 400             |
| Private tracking link     | right token, wrong token, wrong shape, registered customer, 7 days after resolved   | guest sees progress (no phone, no meter); the rest get 404            |
| Guest limits              | 4 reports from one phone in an hour                                                 | the fourth gets 429                                                   |
| SMS                       | received, assigned, on the way, arrived, resolved, gateway down                     | one short text each; a failing gateway never fails the report         |
| Paging and analytics      | pages, last page, bad `page`, 300 generated faults compared with plain JavaScript   | same numbers, no gaps or overlap                                      |

**What changed because of them:** simultaneous "On the way" taps used to all succeed and create duplicate history and notifications, and two coordinators could both assign a technician. With the fix removed both tests failed 3 times out of 3; with it they pass. A first version of the test passed even without the fix, because the first request finished before the others connected; warming the connections first made the race real.

## 3. Load test

**Why:** many open dashboards mean many requests.

**How:** `npm run test:perf` sends read-only requests, 200 per endpoint, 10 at a time. `npm run test:perf:seed` first adds 2,000 synthetic faults to the test database only.

Local API, 2,028 faults, no errors, single runs (times vary by about 30% on a laptop, so trust the sizes more than the times):

| Request                | Before                               | After                            |
| ---------------------- | ------------------------------------ | -------------------------------- |
| Fault list             | 3,105 KB, p50 3,743 ms, 3 requests/s | 28 KB, p50 72 ms, 130 requests/s |
| `GET /stats/analytics` | p50 319 ms, 31 requests/s            | p50 67 ms, 121 requests/s        |
| `GET /stats/overview`  | p50 106 ms, 91 requests/s            | p50 36 ms, 255 requests/s        |

The first run showed the fault list was the slowest endpoint, so the list is now paged (20 per page). The same run showed the analytics endpoints slowing down, so the averages are now calculated in PostgreSQL. `[FILL: the same test against the live Render API, and how long the first request took after the server was asleep]`

## 4. Android app

```bash
cd mobile
npm test                                # 129 tests, 19 suites
npx expo-doctor                         # 20 of 20 checks
npx expo export --platform android      # bundles the whole app; fails on any import error
```

The Jest tests cover the API client (token, errors, timeouts), sign-in, polling that stops in the background, the location throttle (a position is sent at most every 20 seconds and only after 30 metres of movement), push registration and where a tapped notification opens.

## 5. Review of both apps

Two read-only reviews found no broken feature. Eight problems were fixed, for example: signing out on the phone could freeze for 70 seconds while a sleeping server was contacted (now 3 seconds at most, with a test that fails on the old code), and a short network drop on the web app signed the user out.

## 6. Manual checks (to fill in)

**Devices.** Tested on `[FILL: phone model, Android or iOS version]`. Tick each row only after seeing it work.

| #   | Check                                                                                      | Result |
| --- | ------------------------------------------------------------------------------------------ | ------ |
| 1   | Report a fault with no sign-in on a phone browser: location, camera photo, phone number    |        |
| 2   | The SMS with the tracking link arrives and the link opens the right report                 |        |
| 3   | A photo over 1 MB is accepted (it is shrunk in the browser)                                |        |
| 4   | The coordinator sees the new report within about 8 seconds (banner and tab title)          |        |
| 5   | The coordinator assigns a technician; the technician sees the job                          |        |
| 6   | Technician: on the way, arrived, working, resolved; the guest's page follows               |        |
| 7   | Android app: sign in as customer and as technician; force-close and reopen stays signed in |        |
| 8   | Android app: location is shared while on the way, and stops when the phone is locked       |        |
| 9   | Android app: push arrives with the app open, in the background and closed                  |        |
| 10  | Airplane mode shows an offline message and recovers                                        |        |

**Browsers.**

| Environment                    | Version | Guest report | Sign-in | Assign | Status updates | Map | Notes |
| ------------------------------ | ------- | ------------ | ------- | ------ | -------------- | --- | ----- |
| Chrome (computer)              |         |              |         |        |                |     |       |
| Firefox                        |         |              |         |        |                |     |       |
| Edge                           |         |              |         |        |                |     |       |
| Safari (iPhone)                |         |              |         |        |                |     |       |
| Chrome (low-end Android phone) |         |              |         |        |                |     |       |

Also add a Lighthouse mobile score for the live site, and its load time on the "Slow 4G, 4x CPU slowdown" setting in Chrome DevTools.

**Usability.** Ask 3 to 5 people to report a fault from their own phone without help. Note how long it took and where they stopped. `[FILL: number of people, average time, what confused them]`
