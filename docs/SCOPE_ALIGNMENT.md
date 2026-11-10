# Scope alignment: planned vs. built

Status: Completed, Partial or Not built. Evidence points to code or tests.

## Features

| Planned feature                                     | Status    | Evidence                                                                           |
| --------------------------------------------------- | --------- | ---------------------------------------------------------------------------------- |
| Customer sign-up and sign-in by email or phone      | Completed | `authService.js`, `pages/Register.jsx`, `app/register.js`; web and Android         |
| Sign-in for three roles, role-scoped data           | Completed | `middleware/auth.js`, `App.jsx`; integration tests                                 |
| Fault report linked to a service location           | Completed | `faultService.createFault`, `pages/customer/ReportFault.jsx`                       |
| Report without an account (added after feedback)    | Completed | `POST /api/public/faults`, `pages/public/`                                         |
| Automatic starting priority                         | Completed | `DEFAULT_PRIORITY` in `utils/constants.js`                                         |
| Coordinator dashboard, work queue, new-report alert | Completed | `pages/coordinator/`, `lib/workQueue.js`, `lib/newReports.js`                      |
| Ranked technician assignment                        | Completed | `domain/TechnicianRanker.js`, `pages/coordinator/Assign.jsx`                       |
| Controlled, time-stamped status workflow            | Completed | `domain/FaultStatusMachine.js`, `FaultStatusHistory` table                         |
| Safe concurrent updates                             | Completed | `faultService.guardedUpdate`; integration tests                                    |
| Map of faults and technicians                       | Completed | `components/MapView.jsx` (Leaflet, OpenStreetMap)                                  |
| Live technician GPS                                 | Partial   | Real on Android, simulated on web                                                  |
| Customer tracking (timeline and map)                | Completed | `pages/customer/Tracking.jsx`                                                      |
| In-app and push notifications                       | Completed | `notificationService.js`, same transaction as the change                           |
| SMS on received, assigned and updated               | Partial   | `SmsGateProvider`; tried on a real phone locally, deployed app only logs           |
| Resolution record (outcome, work, clarification)    | Completed | `pages/technician/ResolveJob.jsx`                                                  |
| Arrival distance and response-time analytics        | Completed | `arrivalDistanceM`, `statsService.getAnalytics`, `pages/coordinator/Analytics.jsx` |
| Responsive web app and Android app                  | Completed | `MobileShell.jsx`, `CoordinatorShell.jsx`, `mobile/`                               |
| Public deployment                                   | Completed | Vercel, Render, Neon ([DEPLOYMENT.md](DEPLOYMENT.md))                              |
| Administrator area and record import                | Not built | Accounts and locations come from the seed script                                   |

## Proposal requirements FR1 to FR14

| Requirement                                                | Status    | Note                                           |
| ---------------------------------------------------------- | --------- | ---------------------------------------------- |
| FR1 Register and sign in (email or phone); roles           | Completed | Customers self-register; staff are seeded      |
| FR2 Service locations with meter, phone, coordinates       | Completed | `ServiceLocation`; a customer can have several |
| FR3 Report with location, category, description, reference | Completed | Also without an account                        |
| FR4 Automatic coordinates and default priority             | Completed | Guests use phone location or a written place   |
| FR5 Coordinator sees open reports on list and map          | Completed |                                                |
| FR6 Assign, reassign, change priority, cancel              | Completed | `Assign.jsx`, `PATCH /api/faults/:id`          |
| FR7 Technician sees job, contact, directions link          | Completed | `JobDetails.jsx`                               |
| FR8 Stages with times and an outcome note                  | Completed | _Accepted_ dropped, _Working_ added            |
| FR9 Customer sees status; SMS on receipt, assignment       | Partial   | Tracking done; SMS not yet on the deployed app |
| FR10 Live technician position while on the way             | Partial   | Real on Android, simulated on web              |
| FR11 Position and distance at Arrived                      | Completed | `arrivalDistanceM`                             |
| FR12 Clarification contacts recorded                       | Completed | Recorded when resolving                        |
| FR13 Administrator manages users, categories, locations    | Not built | Seed script instead                            |
| FR14 Response-performance report                           | Completed | Analytics page                                 |

The proposal also planned a pilot (about 20 customers, 5 technicians, 3 coordinators). It has not run yet.

## Changes from the plan

- **Report without an account.** Supervisor feedback: nobody should log in during an emergency. A guest gives a
  phone number and place and gets an SMS with a private tracking link. Limit: 3 reports an hour per phone.
- **SMS** goes through an Android phone running an open-source gateway, because a provider account costs money.
  On 10 Nov 2026 a local run delivered texts to a real iPhone and the link opened the right report. Render cannot
  reach the phone's local server, so the deployed app only logs texts.
- **Customers sign themselves up** (phone, optional email, meter, first location). Staff stay seeded, because a
  self-registered staff account would see other people's faults. Several customers may share a meter (tenants), so the
  meter number is a label; the GPS point places the fault.
- **Technician positions** are simulated on web; Android sends real ones.
- **Photos** are stored in the database (prototype). Production should use file storage.
- **Polling, not WebSockets**: simpler on free hosting, and 4 to 15 seconds is fast enough.
