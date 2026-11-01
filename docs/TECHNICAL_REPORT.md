# Umuriro Response: Technical Report

Electricity fault reporting and technician response for Ndera Sector, Kigali.
Repository: https://github.com/Larissanoella-05/Capstone-project · Live web app: https://capstone-project-six-inky.vercel.app

> **Draft status.** Every `[FILL: …]` marker is something only you can supply: a screenshot, a result from a real device or from users, or a figure to re-measure. Nothing in brackets has been invented. Re-read the whole text and put it in your own words before you submit. Numbers are as of 1 November 2026 (299 automated tests). The text is about 2,700 words with five tables, which will not fit five pages once figures are added; cut Table 2 and the OOP list first.

## 1. Scope alignment

The proposal set out to link each fault report to the customer's registered service location, so that a technician no longer depends on a spoken description of where to go. The system covers one report from submission to resolution for three roles: the customer reports and tracks a fault, the coordinator assigns a technician, and the technician updates the status until the fault is resolved. The full feature table is in `docs/SCOPE_ALIGNMENT.md`; Table 1 summarises it against the proposal's functional requirements (FR).

**Table 1. Proposal requirements against the implementation**

| Planned feature (proposal)                                   | Purpose                                                          | Status                                   | Evidence                                                                          |
| ------------------------------------------------------------ | ---------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------- |
| Role-based sign-in (FR1)                                     | Each role sees only its own screens and data                     | Done for three roles; no administrator   | `middleware/auth.js`, authorization integration tests, `[FILL: login screenshot]` |
| Registered service location attached to every report (FR2–4) | Removes verbal directions; default priority from the category    | Done                                     | `faultService.createFault`, `[FILL: report-fault screenshot]`                     |
| Coordinator list, map, assignment (FR5, FR6)                 | Triage and send the nearest available technician                 | Done, with a ranked recommendation       | `TechnicianRanker`, `[FILL: assign-screen screenshot]`                            |
| Technician job view and status stages (FR7, FR8)             | Guided, time-stamped progress with a required outcome note       | Done, with a _Working_ stage added       | `FaultStatusMachine`, `[FILL: technician job screenshot]`                         |
| Customer tracking (FR9)                                      | Customer follows progress without phoning                        | Done (polling every 4 s)                 | `pages/customer/Tracking.jsx`, `[FILL: tracking screenshot]`                      |
| Live technician position (FR10)                              | Customer and coordinator see the technician approach             | Real GPS on Android; simulated on web    | `ActiveJobTracker`, `POST /technicians/me/location`                               |
| Arrival distance (FR11)                                      | Measure how close the recorded position was to the service point | Done                                     | `changeStatus`, `arrivalDistanceM`, Analytics tiles, integration tests            |
| Clarification contacts, response report (FR12, FR14)         | Count how often directions were still needed; response intervals | Done                                     | `statsService.getAnalytics`, `[FILL: analytics screenshot]`                       |
| SMS on receipt and assignment (FR9)                          | Reach customers without the app                                  | Partial: gateway interface, logging only | `services/smsService.js`                                                          |
| Administrator role and record import (FR13)                  | Manage users and service-location data                           | Not built                                | Data is loaded by the seed script                                                 |

**Where the build differs from the proposal, and why.**

- _Technology._ The proposal named TypeScript, PostGIS, Socket.IO and Google Maps. We used JavaScript checked with JSDoc and `tsc`, plain PostgreSQL with a haversine function, 4-second polling, and Leaflet with OpenStreetMap. The choices removed a paid map key and a socket server from a free-tier deployment. Distance work at pilot scale (a handful of technicians) does not need spatial indexes.
- _Android app._ The proposal ruled out a native app. We built one with Expo because the proposal also asked for live technician tracking and the compatibility requirement (NFR6) mentions low-cost Android phones; a browser tab cannot keep sending a position when the screen is locked. The web app still serves all three roles.
- _SMS and administrator._ SMS needs a gateway account and an administrator area needs its own screens; we judged the coordinator workflow and tracking more important in the ten weeks. SMS is built as an interface with a logging implementation, so a real gateway is one new class. Service-location records come from a seed script, which plays the role of the data simulator the proposal allows for when REG's data cannot be had.
- _Workflow._ The proposal's stages were Accepted, On the way, Arrived, Resolved. We dropped _Accepted_ (the coordinator's assignment is the commitment in this pilot) and added _Working_ so that travel time and on-site time can be separated.
- _Evaluation._ The proposal's measures (location-identification time, response time, communication efficiency, satisfaction) depend on a pilot with participants. `[FILL: state how many participants took part and when, or say plainly that the pilot was not run and that the results here come from scripted test faults.]`

## 2. Technical functionality

**Architecture.** One Express API and one PostgreSQL database serve the React web app and the Expo Android app (Figure 1; the diagram is in `docs/ARCHITECTURE.md`). The web app is on Vercel, the API on Render and the database on Neon. A status change made by a technician is stored once and appears for the coordinator and the customer on their next poll.

`[FILL: Figure 1, the system-context diagram exported from ARCHITECTURE.md]`

**Main interactions.** A request passes through `routes/` (HTTP only), then `middleware/` (JWT check, role check, Zod validation), then `services/` (business rules and Prisma), then the database. Business rules that need no I/O sit in `domain/`.

1. The customer submits a report. The service finds their registered location, sets a default priority from the category, and in one transaction creates the report, its first history row and the customer's notification.
2. The coordinator requests the technicians ranked for that fault, then assigns one. The ranking orders by availability, then distance, then current workload, then name, and flags the first available technician as recommended.
3. The technician moves the fault one stage at a time. Each change stamps a time, writes a history row and a notification in the same transaction. Push notifications and SMS go out only after the transaction has committed and never make the request fail.
4. At the _Arrived_ stage the system compares the technician's last recorded position with the registered service point and stores the distance in metres.
5. The analytics endpoint turns the stored timestamps into average intervals (report to assignment, travel, on-site) and reports clarification contacts and arrival distance.

**Error handling.** Every request body and the query string of the fault list are validated by Zod schemas, and one error handler formats all failures as `{ error: { message, details } }`. Table 2 lists the behaviour that the integration tests check.

**Table 2. Inputs and expected behaviour**

| Input                                                         | Result                                                        |
| ------------------------------------------------------------- | ------------------------------------------------------------- |
| Wrong password, or an unknown email                           | 401 with the same message in both cases                       |
| Malformed email, missing category, out-of-range GPS           | 400 with a readable message and the failing field             |
| `page=0`, `pageSize=101`, `status=banana` on the fault list   | 400 (before, an unknown status quietly returned nothing)      |
| No token, or a tampered token                                 | 401                                                           |
| Customer opening another customer's fault; customer assigning | 403                                                           |
| Skipping a stage; changing a resolved fault                   | 409                                                           |
| Resolving without an outcome note                             | 400                                                           |
| Five identical status updates at the same moment              | One succeeds, four get 409; one history row, one notification |
| Arriving with no recorded position                            | Succeeds; arrival distance is stored as empty                 |
| SMS gateway failure                                           | Request still succeeds; the failure is logged                 |

**Algorithms and custom logic.** Six pieces are worth naming.

- _Technician ranking._ A multi-key sort (availability, distance, workload, name) that runs in O(n log n) and is deterministic, so two coordinators see the same order.
- _Distance._ The haversine formula, used for ranking and for arrival distance. Distances are reported in whole metres where precision matters.
- _Optimistic concurrency._ `guardedUpdate` turns each state change into an `UPDATE … WHERE` on the status and technician that were read. If another request got there first, zero rows match and the caller receives a 409. This avoids database locks and is what stops a double tap from creating two updates.
- _Location throttling on the phone._ The tracker posts a position only if at least 20 seconds have passed and the technician has moved at least 30 metres, which keeps battery use and requests down.
- _Paging._ The coordinator's fault list asks for 20 faults at a time (`?page=&pageSize=`, at most 100) and is sorted by time and then id, so reports made in the same instant never swap places between pages. It is opt-in: without the parameters the full list is returned, so the phone app and the dashboards did not change.
- _Aggregation in the database._ The analytics averages, the median arrival distance and the clarification totals are computed by PostgreSQL (`AVG … FILTER`, `percentile_cont`), so the API reads a handful of numbers instead of every fault. The old JavaScript calculation is kept in the tests as a reference the SQL must match.

## 3. Testing and results

We used five approaches, each chosen for a specific risk.

**Table 3. Testing approaches**

| Approach                    | Why this one                                                       | How it was run                                                          | Result                                        |
| --------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------- | --------------------------------------------- |
| Unit                        | Workflow rules, ranking and validation break quietly               | `node --test` (backend, frontend), Jest (mobile); no database           | Backend 125, frontend 27, mobile 87; all pass |
| Integration                 | The value is the hand-off between three roles through one database | Real API over HTTP against a separate PostgreSQL test database          | 60 of 60 pass, 14 suites                      |
| Performance (load)          | Every open screen polls the API every 4 to 6 seconds               | `npm run test:perf`, 200 requests per endpoint, 10 at a time, read-only | See Table 4                                   |
| Code review of both apps    | Finds what tests do not look for: slow sign-out, stale screens     | Two read-only reviews; each main finding re-checked in the code         | No feature broken; 8 problems fixed           |
| Manual device and usability | Maps, GPS, camera and push cannot be checked by a computer         | 19-row checklist on Android; browser matrix; task test with users       | `[FILL: results, see below]`                  |

Because the integration seed empties every table, the tests refuse to start unless `TEST_DATABASE_URL` is set explicitly, is a local database whose name ends in `_test`, differs from `DATABASE_URL`, and contains only demo accounts. Each refusal was triggered by hand once.

**What testing changed.** The unit tests showed that the validator meant to turn empty strings into "no value" never did, and it was fixed. The concurrency tests showed that five simultaneous "On the way" taps all succeeded, creating duplicate history rows and notifications, and that two coordinators could both assign a technician. With the optimistic-concurrency fix removed, both tests failed in three of three runs; with it, both pass. A first version of the test passed even without the fix, because the first request finished before the others had connected; warming the connections first made the race real. Later work followed the same habit. The tests for the analytics rewrite passed against the old code first, then against the SQL version, so the change altered speed and not results. The review of the two apps found, among other things, that signing out on the phone could freeze for up to 70 seconds while a sleeping server was contacted (now at most 3 seconds, with a test that fails on the old code) and that a short network drop on the web app signed the user out.

**Performance.** The first load test (about 50 faults, 1,400 requests, no errors) showed `GET /faults` as the slowest endpoint because it returns every fault with its history. We then added a script that fills the test database with 2,000 synthetic faults (the same safety checks as the integration tests apply) and compared the old behaviour with the new on the development laptop (Windows 11, Node 24, PostgreSQL 18, local API, 2,028 faults, 200 requests per endpoint, 10 at a time, no errors).

**Table 4. Load test with 2,028 faults, before and after**

| Request                   | Before                               | After                            |
| ------------------------- | ------------------------------------ | -------------------------------- |
| Fault list, all vs a page | 3,105 KB, p50 3,743 ms, 3 requests/s | 28 KB, p50 72 ms, 130 requests/s |
| `GET /stats/analytics`    | p50 319 ms, 31 requests/s            | p50 67 ms, 121 requests/s        |
| `GET /stats/overview`     | p50 106 ms, 91 requests/s            | p50 36 ms, 255 requests/s        |

Paging cut the response by about 110 times, and calculating the averages in SQL made the analytics endpoint about four times faster. These are single runs on a laptop and vary by up to about 30% between runs (one endpoint moved from 72 to 97 ms with no code change), so the sizes are more reliable than the times. `[FILL: the same test against the deployed Render API, noting the wake-up delay on the first request.]`

**Compatibility.** `[FILL: Table 5, one row each for Chrome, Firefox, Edge, Safari on iPhone, Chrome on a low-end Android phone, and the Android app with phone model and Android version, marking sign-in, report, assign, status updates and map. Add a Lighthouse mobile score and the load time under the "Slow 4G, 4× CPU slowdown" profile.]` The Android build was also checked by `expo-doctor` (20 of 20 checks) and by exporting the full bundle.

**Usability.** `[FILL: number of participants, the task they were given (report a fault and follow it), time to submit, and where they hesitated. If this was not done, write that it is future work and do not report numbers.]`

## 4. Code quality practices

**Structure.** The repository has four packages (`backend/`, `frontend/`, `mobile/`, `docs/`). The backend keeps a one-way flow from routes to services to domain, and no file mixes HTTP handling, business rules and database queries.

**Object-oriented design.**

- _Encapsulation and single responsibility._ `FaultStatusMachine` holds every workflow rule and has no database code, so the service layer only asks it whether a change is allowed and the rules can be tested alone.
- _Dependency injection and open/closed._ The machine takes its stage list as constructor arguments with defaults, so the flow can change without editing the class. `TechnicianRanker` keeps its comparison rules in static methods.
- _Inheritance and polymorphism._ `HttpError` is specialised by `badRequest`, `notFound`, `conflict` and so on, and one error handler treats them all alike. `SmsProvider` is an abstract base with `LogSmsProvider` and an Africa's Talking class behind it; the notice code calls `provider.send()` and does not know which one it has. This is what makes a real gateway a one-class change.
- _Modularity and limits._ `faultService.js` used to mix query building, serialising and three write workflows in about 390 lines. The pure serialiser now sits in `domain/FaultSerializer.js` and the list filters, role scope and paging maths in `services/faultQuery.js`, both unit-tested without a database; the service is about 280 lines of database work. The service layer is still written as functions rather than classes, which we kept because adding classes only to look object-oriented would not make the code clearer.

**Naming and consistency.** Files are named for their job (`FaultStatusMachine`, `smsService`), constants live in one file, and all HTTP from the web app goes through one `api.js`. ESLint with zero warnings allowed, Prettier and a backend type-check run on every commit through a hook, and again in GitHub Actions, where one job (`ci-ok`) gates merges.

**Process.** The history has 126 commits between 26 September and 1 November 2026, written as Conventional Commits and developed on feature branches and merged through pull requests, with CI (lint, format, type-check, tests) set up to run on each. Schema changes go through committed Prisma migrations, never edited after they are applied.

**Known limits.** Photos are stored as data URLs in the database, technician positions on the web app are simulated, updates are polled rather than pushed, SMS is a stub, customers cannot register themselves (accounts and service locations come from the seed script; a production rollout would import them from the utility's customer records and add an administrator area), and type-checking covers the backend only. Each is a documented prototype decision, not an oversight.

## 5. Conclusion

The core flow from report to resolution works for three roles on web and Android, is protected against double submission and wrong-role access, and is covered by 299 automated tests. Load testing with 2,028 faults found two slow endpoints, and both were fixed and re-measured. The proposal features not built are the administrator area and a real SMS gateway. The evidence still missing is the user pilot and the device and browser matrix; those two items carry most of what remains to be shown.
