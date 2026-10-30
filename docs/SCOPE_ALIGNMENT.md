# Scope alignment: planned features vs. implementation

> **Draft for the technical report (Section 1).** Built from what the code actually does.
> Check the *Planned Feature* column against the approved proposal and add any proposal feature that is missing here.
> Replace the evidence notes with screenshots where the report needs them.

| Planned feature | Intended purpose | Current status | Evidence |
|---|---|---|---|
| Role-based sign-in (Customer, Technician, Coordinator) | Each role sees only its own screens and data | Completed | `backend/src/middleware/auth.js` (JWT + `requireRole`), `frontend/src/App.jsx`; integration tests *authorization between roles* |
| Fault reporting linked to the registered service location | Removes verbal directions: the report carries meter number, cell, landmark and GPS point | Completed | `POST /api/faults`, `faultService.createFault`, `pages/customer/ReportFault.jsx` |
| Optional fault photo | Gives the technician a visual of the problem | Completed (prototype storage) | Stored as a data URL, max ~1 MB (`validators/fault.schemas.js`); object storage is future work |
| Automatic starting priority by category | Damaged connections handled first | Completed | `DEFAULT_PRIORITY` in `utils/constants.js`; coordinator can change it (`PATCH /api/faults/:id`) |
| Coordinator fault list with search and filters | Find and triage reports quickly | Completed | `faultService.listFaults`, `pages/coordinator/Faults.jsx` |
| Technician assignment with ranked recommendation | Send the nearest *available* technician | Completed | `domain/TechnicianRanker.js` (availability → distance → workload), `pages/coordinator/Assign.jsx`; unit + integration tests |
| Controlled status workflow (Reported → … → Resolved, Cancel) | Stages cannot be skipped; every change is time-stamped | Completed | `domain/FaultStatusMachine.js`, `FaultStatusHistory` table; unit tests |
| Safe concurrent updates | A double-tap or two coordinators cannot create duplicate updates | Completed | Optimistic concurrency in `faultService.guardedUpdate`; integration tests *data integrity* |
| Map of fault and technician positions | See where the fault and technicians are | Completed | `components/MapView.jsx` (Leaflet + OpenStreetMap) |
| Live technician GPS from the device | Real-time technician position | Partial | API `POST /api/technicians/me/location` exists and is validated; the UI uses simulated positions, as planned for the pilot (technicians are simulated) |
| Customer progress tracking (timeline + map) | Customer sees what is happening without phoning | Completed | `pages/customer/Tracking.jsx`, polling every 4 s (`hooks/useApi.js`) |
| In-app notifications | Customer and technician are told about each change | Completed | `notificationService.js`, written in the same DB transaction as the change; `pages/Notifications.jsx` |
| Resolution record (outcome, work done, clarification contacts) | Evidence of the fix and of how often directions were still needed | Completed | `PATCH /api/faults/:id/status` with `RESOLVED`; `pages/technician/ResolveJob.jsx` |
| Response-time analytics | Measure report→assign, assign→arrive, on-site time | Completed | `statsService.getAnalytics`, `pages/coordinator/Analytics.jsx` |
| Responsive web app (no native app) | Works on customers' and technicians' phones | Completed | `MobileShell.jsx` (customer/technician), `CoordinatorShell.jsx` (desktop) |
| Deployment | Publicly reachable pilot | Completed | Vercel (frontend), Render (API), Neon (PostgreSQL); see README §5 |
| SMS notifications | *Add only if it is in the approved proposal* | Not implemented | Would need an SMS provider account; in-app notifications are used instead |

## Scope changes to justify in the report

- **Technician positions are simulated** in the pilot (decided for the evaluation); the device-location endpoint is ready for real GPS later.
- **Photos are stored in the database** as data URLs to keep the prototype simple; production should move them to object storage.
- **Polling instead of WebSockets** for live updates: simpler to host on free tiers; fast enough for 4–6 s refresh.
