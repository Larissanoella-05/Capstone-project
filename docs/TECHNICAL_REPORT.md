# Umuriro Response: Technical Report

Electricity fault reporting and technician response for Ndera Sector, Kigali.
Repository: https://github.com/Larissanoella-05/Capstone-project · Live app: https://capstone-project-six-inky.vercel.app

Items in `[FILL: …]` need your own evidence (a screenshot, a result from a real device or from users).

## 1. Scope alignment

When the power fails, people phone the utility and describe where they live. The technician often has to call back to find the house. Umuriro Response puts every fault into one shared record with a location: the customer reports, the coordinator assigns a technician, the technician updates the status, and the customer follows it. The full feature table, and a check against each proposal requirement FR1 to FR14, are in [SCOPE_ALIGNMENT.md](SCOPE_ALIGNMENT.md). Table 1 gives the summary.

**Table 1. Planned features and what was built**

| Planned feature                         | Status                                        | Evidence                                                          |
| --------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------- |
| Sign-in for three roles (FR1)           | Partial: email only, no self-registration     | `middleware/auth.js`, `[FILL: login screenshot]`                  |
| Report linked to a service location     | Completed                                     | `faultService.createFault`, `[FILL: report screenshot]`           |
| Report without an account               | Completed (added after feedback)              | `POST /api/public/faults`, `[FILL: guest report screenshot]`      |
| Coordinator dashboard, queue and alert  | Completed                                     | `pages/coordinator/Dashboard.jsx`, `[FILL: dashboard screenshot]` |
| Ranked technician assignment            | Completed                                     | `TechnicianRanker`, `[FILL: assign screenshot]`                   |
| Status workflow with time stamps        | Completed                                     | `FaultStatusMachine`, `[FILL: technician screenshot]`             |
| Customer and guest tracking             | Completed                                     | `pages/customer/Tracking.jsx`, `pages/public/`                    |
| Live technician position                | Real GPS on Android, simulated on web         | `ActiveJobTracker`                                                |
| Arrival distance and response analytics | Completed                                     | `statsService`, `[FILL: analytics screenshot]`                    |
| SMS to the reporter                     | Partial: built, not yet tried on a real phone | `smsService.js`, [SMS_GATEWAY.md](SMS_GATEWAY.md)                 |
| Administrator area (FR13)               | Not built                                     | Accounts come from the seed script                                |

**Where the build differs from the proposal, and why**

- _Report without an account._ Our supervisor said nobody should have to log in during an emergency. A guest gives a phone number and a place and gets an SMS with a private link to follow the report. This was not in the proposal.
- _Technology._ The proposal named TypeScript, PostGIS, Socket.IO and Google Maps. We used JavaScript checked with JSDoc and `tsc`, plain PostgreSQL, polling every 4 to 8 seconds, and Leaflet with OpenStreetMap. This removed a paid map key and a socket server from a free hosting plan. With a handful of technicians, spatial indexes are not needed.
- _Android app._ The proposal ruled out a native app. We built one because a browser tab cannot keep sending the technician's position when the screen is locked.
- _SMS._ A paid SMS account was not an option, so texts go through an Android phone running an open-source gateway app. The code and tests are done. A real text has not been sent yet.
- _Workflow._ We dropped the _Accepted_ stage (the assignment is the commitment) and added _Working_, so travel time and time on site can be told apart.
- _Evaluation._ `[FILL: how many people took part in a pilot, and when. If none, say that the results come from test faults.]`

## 2. Technical functionality

**Architecture.** One Express API and one PostgreSQL database serve the React web app and the Expo Android app. The web app runs on Vercel, the API on Render and the database on Neon. `[FILL: architecture diagram from ARCHITECTURE.md]`

**How a request flows.** A request goes through `routes/` (HTTP only), then `middleware/` (token, role and Zod validation), then `services/` (business rules and database), and `domain/` holds the rules that need no database.

1. A customer or a guest sends a report. The service finds the location, sets a default priority from the category, and in one transaction saves the report, its first history row and a notification.
2. The coordinator asks for technicians ranked for that fault and assigns one.
3. The technician moves the fault one stage at a time. Each change saves a time, a history row and a notification together.
4. At _Arrived_ the system stores how far the technician's last position was from the fault.
5. Texts and push messages go out after the transaction and can never make a request fail.

**Guest reports.** A guest report has no customer. The server makes a long random tracking token (24 random bytes) that cannot be guessed. Anyone with the link sees progress but never the phone number or meter number, and the link stops working 7 days after the fault is resolved. The server allows 3 reports per phone per hour, and a hidden form field catches simple bots.

**Algorithms and custom logic**

- _Technician ranking._ Sorts by availability, then distance, then workload, then name. It is O(n log n) and gives the same order every time.
- _Distance._ The haversine formula, for ranking and for arrival distance.
- _Optimistic concurrency._ `guardedUpdate` runs `UPDATE … WHERE` on the status that was read. If someone else changed it first, no row matches and the caller gets 409. This stops a double tap from creating two updates, with no database locks.
- _Coordinator work queue._ Unassigned reports first, oldest first, then the rest newest first. A report is marked late after 15 minutes. These rules are pure functions in `lib/workQueue.js`.
- _New-report alert._ The first load is the baseline; after that, any report ID not seen before is new. `lib/newReports.js` is pure and tested.
- _Photo shrinking._ A photo over 1 MB is redrawn on a canvas and re-saved as JPEG at lower quality until it fits, so phone photos work.
- _Location throttling on the phone._ A position is sent only after 20 seconds and 30 metres of movement, to save battery and requests.
- _Paging and SQL averages._ The fault list is paged, and averages are worked out in PostgreSQL (`AVG … FILTER`, `percentile_cont`).

**Error handling.** Every body is checked by a Zod schema and one handler returns `{ error: { message, details } }`. Examples from the integration tests: wrong password gives 401, a phone number that is not Rwandan gives 400, another customer's fault gives 403, skipping a stage gives 409, a fourth guest report in an hour gives 429, and a wrong tracking token gives 404.

## 3. Testing and results

We used five approaches (details and commands in [TESTING.md](TESTING.md)).

**Table 2. Testing approaches**

| Approach                    | Why this one                                           | Result                                                 |
| --------------------------- | ------------------------------------------------------ | ------------------------------------------------------ |
| Unit                        | Workflow, ranking and validation break quietly         | 452 pass (backend 196, frontend 127, mobile 129)       |
| Integration                 | The roles hand work to each other through one database | 86 pass in 21 suites, against a separate test database |
| Load                        | Every open screen polls the API                        | See Table 3                                            |
| Code review of both apps    | Finds what tests miss                                  | 8 problems fixed, no feature broken                    |
| Manual device and usability | Maps, GPS, camera and SMS need a real phone            | `[FILL: results from TESTING.md section 6]`            |

**What testing changed.** The concurrency tests showed that five quick "On the way" taps all succeeded and made duplicate history and notifications, and that two coordinators could assign the same fault. The fix was optimistic concurrency, and the tests fail without it. The load test showed the fault list returning 3 MB at 2,000 faults, so we added paging. The same run showed slow analytics, so we moved the averages into SQL.

**Table 3. Load test, 2,028 faults, local laptop**

| Request                | Before                 | After            |
| ---------------------- | ---------------------- | ---------------- |
| Fault list             | 3,105 KB, p50 3,743 ms | 28 KB, p50 72 ms |
| `GET /stats/analytics` | p50 319 ms             | p50 67 ms        |
| `GET /stats/overview`  | p50 106 ms             | p50 36 ms        |

These are single runs on a laptop and vary by up to 30%, so the sizes are more reliable than the times. `[FILL: the same test on the live Render API, including the slow first request after sleep]`

**Compatibility and usability.** `[FILL: browser and device table from TESTING.md, Lighthouse mobile score, and the usability result (people, time, where they hesitated). If not done, say it is future work.]`

## 4. Code quality

**Structure.** The repository has `backend/`, `frontend/`, `mobile/` and `docs/`. The backend keeps a one-way flow from routes to services to domain. No file mixes HTTP, business rules and queries. The largest service file is about 360 lines.

**Object-oriented design**

- _Encapsulation._ `FaultStatusMachine` holds every workflow rule and has no database code, so it is tested alone.
- _Polymorphism._ `SmsProvider` is a base class with a logging provider and `SmsGateProvider` behind it. The notice code calls `send()` and does not know which one it has. Adding the real gateway needed no change to that code.
- _Inheritance._ `HttpError` helpers (`badRequest`, `notFound`, `conflict`) all go through one error handler.
- _Open/closed._ The status machine takes its stages as constructor arguments, so the flow can change without editing the class.
- _Honest limit._ The service layer uses functions, not classes. We did not add classes just to look object-oriented.

**Consistency.** ESLint with zero warnings, Prettier and a backend type-check run on every commit and again in GitHub Actions, where one job (`ci-ok`) must pass before a merge. All web HTTP calls go through one `api.js`, and pure logic lives in `lib/` so it can be unit-tested.

**Process.** 179 commits between 26 September and 9 November 2026, written as Conventional Commits and merged through pull requests. Database changes are committed Prisma migrations, never edited after they are applied.

**Known limits.** Photos are stored as data URLs, technician positions on the web app are simulated, updates are polled, the SMS gateway is untested on a real phone, customers cannot sign themselves up, there is no administrator area, and type-checking covers the backend only. Each is a documented prototype decision.

## 5. Conclusion

The core flow from report to resolution works for three roles on web and Android, and now also for a person with no account. It is protected against double taps and wrong-role access and covered by 538 automated tests. Load testing found two slow endpoints, and both were fixed and measured again. Not built: the administrator area. Still to show: a real SMS, the device and browser table, and the usability test.
