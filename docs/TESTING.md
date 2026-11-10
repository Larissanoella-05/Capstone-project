# Testing

We use five kinds of testing. Each one was chosen for a specific risk. The counts below were taken on 9 Nov 2026 on the development laptop (Windows 11, Node 24, PostgreSQL 18).

| Kind                        | Why                                                          | Result                                          |
| --------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| Unit                        | Workflow rules, ranking and validation break quietly         | 534 pass: backend 222, frontend 148, mobile 164 |
| Integration                 | The value is the hand-off between roles through one database | 104 pass, 27 suites, about 26 s                 |
| Load                        | Every open screen asks the API for data every 4 to 8 seconds | See below                                       |
| Code review of both apps    | Finds what tests do not look for                             | No feature broken; 8 problems fixed             |
| Manual device and usability | Maps, GPS, camera and push need a real phone                 | Checklist and tables below, to be filled in     |

That is 638 automated tests. GitHub Actions runs lint, formatting, type-check and the unit tests on every pull request.

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

**Safety:** the tests wipe their database, so they refuse to start unless `TEST_DATABASE_URL` is set, ends in `_test`, is on localhost, is not the development database, and holds only demo accounts. The registration tests delete the accounts they create, so the database still holds only demo accounts for the next run. Each refusal was triggered by hand once.

**What they check:**

| Area                      | Inputs                                                                                                                               | Expected                                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sign-in                   | wrong password, unknown email or phone, bad identifier, no token, tampered token                                                     | 401 (same message for the first two), 400 for a bad identifier                                                                                           |
| Sign-in by phone          | `078…`, `+25078…`, spaced forms, a seeded customer's phone, the old `email` field                                                    | 200 with the same user as sign-in by email                                                                                                               |
| Customer registration     | valid sign-up, a `role` field, short password, phone or email already taken, twice at once                                           | customer created and signed in; the bad ones 400; the taken ones 409 naming the field, nothing half-created                                              |
| Shared meter              | tenant and landlord on one meter, one customer adding the same meter twice                                                           | both register and report faults; the database refuses the second copy                                                                                    |
| Sign-up limit             | 11 valid sign-ups from one network in an hour                                                                                        | the 11th gets 429                                                                                                                                        |
| Full workflow             | report, rank, assign, on the way, arrived, working, resolved                                                                         | every status and time stored; customer notified at each step                                                                                             |
| Permissions               | another customer's fault, customer assigning, unassigned technician                                                                  | 403                                                                                                                                                      |
| Assigning technicians     | a busy technician, the same technician twice, an unknown technician, a reassignment, an off-duty technician                          | busy: allowed and still listed ON_JOB; twice: 409; unknown: 404; reassigned: moves to the other technician; off duty: 409 and the fault stays unassigned |
| Priority and audit trail  | a coordinator, a customer, a technician and an invalid value changing priority; a fault reported, assigned and moved by three people | only the coordinator can change it (others 403, invalid 400); history lists who made each change, in order, with a time                                  |
| Bad input                 | missing category, `abc` as id, unknown id, bad JSON, GPS out of range                                                                | 400 or 404 with a readable message                                                                                                                       |
| Workflow rules            | skipping a stage, blank outcome note, changing a resolved fault                                                                      | 409 or 400                                                                                                                                               |
| Double taps               | five identical updates at once; two assignments at once                                                                              | one succeeds, the rest get 409; no duplicate history or notifications                                                                                    |
| Report without an account | no sign-in, phone not Rwandan, no place, guest sets a priority, hidden field filled                                                  | accepted with a reference and token; the bad ones get 400                                                                                                |
| Private tracking link     | right token, wrong token, wrong shape, registered customer, 7 days after resolved                                                    | guest sees progress (no phone, no meter); the rest get 404                                                                                               |
| Guest limits              | 4 reports from one phone in an hour                                                                                                  | the fourth gets 429                                                                                                                                      |
| SMS                       | received, assigned, on the way, arrived, resolved, gateway down                                                                      | one short text each; a failing gateway never fails the report                                                                                            |
| Paging and analytics      | pages, last page, bad `page`, 300 generated faults compared with plain JavaScript                                                    | same numbers, no gaps or overlap                                                                                                                         |

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

The first run showed the fault list was the slowest endpoint, so the list is now paged (20 per page). The same run showed the analytics endpoints slowing down, so the averages are now calculated in PostgreSQL.

**Live Render API** (9 November 2026, run from a laptop, 200 requests per endpoint, 10 at a time, 1,600 requests, 0 errors). This is the small demo database, not 2,000 faults, so compare the shape and not the local table above:

| Request                          | KB  | p50 (ms) | p95 (ms) | Requests/s |
| -------------------------------- | --- | -------- | -------- | ---------- |
| `GET /health`                    | 0   | 345      | 553      | 25         |
| `GET /faults?status=ALL` (paged) | 28  | 616      | 765      | 15         |
| `GET /stats/overview`            | 0   | 409      | 553      | 23         |
| `GET /stats/analytics`           | 1   | 408      | 551      | 23         |
| `GET /notifications`             | 0   | 405      | 453      | 24         |
| `GET /technicians?faultId=…`     | 2   | 481      | 686      | 19         |
| `GET /faults/:id`                | 717 | 869      | 1,856    | 10         |

The times include the network from my laptop to Render, so they are slower than local. The slowest request is one fault, because it carries its photos as data URLs (717 KB), which is a documented scope decision. **Cold start:** the first request after the free-tier server had been asleep took **24.4 s**; the next one took 0.6 s.

## 4. Android app

```bash
cd mobile
npm test                                # 164 tests, 20 suites
npx expo-doctor                         # 20 of 20 checks
npx expo export --platform android      # bundles the whole app; fails on any import error
```

The Jest tests cover the API client (token, errors, timeouts), sign-in and sign-up (the account is created and stored, a refusal stores nothing, the form rules match the web app), polling that stops in the background, the location throttle (a position is sent at most every 20 seconds and only after 30 metres of movement), push registration and where a tapped notification opens.

## 5. Review of both apps

Two read-only reviews found no broken feature. Eight problems were fixed, for example: signing out on the phone could freeze for 70 seconds while a sleeping server was contacted (now 3 seconds at most, with a test that fails on the old code), and a short network drop on the web app signed the user out.

## 6. Manual checks (to fill in)

**Devices.** Tested on a TECNO KG5j on Android 11, with the EAS `preview` build of commit `74fcfaa` (installed over USB-debugging with `adb`, talking to the live Render server). Tick each row only after seeing it work.

| #   | Check                                                                                      | Result                                                                                                                                                                                                                                   |
| --- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Report a fault with no sign-in on a phone browser: location, camera photo, phone number    |                                                                                                                                                                                                                                          |
| 2   | The SMS with the tracking link arrives and the link opens the right report                 | Pass in a local run (10 Nov 2026): real texts for "received" and "assigned" reached an iPhone from the TECNO's SIM, and the tracking link opened FR-1022 on the iPhone over Wi-Fi. Not tried on the deployed app, which still logs texts |
| 3   | A photo over 1 MB is accepted (it is shrunk in the browser)                                |                                                                                                                                                                                                                                          |
| 4   | The coordinator sees the new report within about 8 seconds (banner and tab title)          |                                                                                                                                                                                                                                          |
| 5   | The coordinator assigns a technician; the technician sees the job                          | Pass for the phone side: FR-1029 assigned to Jean Claude (sent through the API as the coordinator, not on the web page) and it appeared in the technician's jobs within seconds. The web assign screen is not yet checked                |
| 6   | Technician: on the way, arrived, working, resolved; the guest's page follows               | Pass on the phone for a signed-in customer: Assigned, On the way, Arrived, Working, Resolved, each saved with the technician's name and time (server history checked). The guest page is not yet checked                                 |
| 7   | Android app: sign in as customer and as technician; force-close and reopen stays signed in | Pass: customer and technician (Jean Claude) both signed in on this build. The technician session also reopened after a force-close on the older build                                                                                    |
| 7a  | Android app: create a customer account, report a fault, sign out, sign in with the phone   | Pass for create (meter, cell and GPS location, accurate to 20 m) and report (FR-1029, location added automatically). Phone sign-in passed for the seeded customer; the new account was not signed back in                                |
| 8   | Android app: location is shared while on the way, and stops when the phone is locked       |                                                                                                                                                                                                                                          |
| 9   | Android app: push arrives with the app open, in the background and closed                  | Open: pass ("Fault received" arrived after submitting). Background and closed: not checked                                                                                                                                               |
| 10  | Airplane mode shows an offline message and recovers                                        |                                                                                                                                                                                                                                          |

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
