---
date: 2026-11-05
git_commit: 4b449c1
branch: fix/login-return-to-page
topic: 'Guest fault reporting with phone, live location, camera and SMS'
tags: [plan, backend, frontend, sms, guest-reporting]
status: draft
---

# PLAN: Guest fault reporting with phone, live location, camera and SMS

Let anyone report a fault from `/report` without an account, using a phone number, their live location and an optional camera photo. The ticket is acknowledged on screen and by SMS, and the guest follows it through an unguessable tracking link. Coordinators see guest reports flagged as unverified and assign them like any other. Registered customers and the Android app keep working as today.

Background and sources: `docs/agents/research/2026-11-05-guest-reporting-and-customer-accounts.md` (Follow-up Research 2 and 3). This answers the supervisor's feedback that mandatory login is counterproductive in an emergency.

## Acceptance Criteria

- `/report` works signed out. Required: a category, a phone number, and a place (live location or a written place). Optional: a meter number, a description, a photo.
- "Use my location" fills the place from the browser, shows the accuracy in metres, and the user can replace it with a written place if permission is denied or the position is poor.
- On a phone, "Take a photo" opens the camera. A gallery choice is still possible.
- After sending, the page shows the reference and a tracking link on screen, with a copy button, and tells the guest to call 2727 if they lose the link. The reference and link are visible even if the SMS fails.
- An SMS carrying the reference and the link is sent when the report is received, and an SMS follows on assigned, on the way, arrived, resolved and cancelled. With no gateway configured, the send is logged and the confirmation page labels the text as simulated.
- `/track/:token` shows status, the technician's first name and position, the timeline and the resolution. It shows no technician phone number, no reporter phone number and no meter number.
- A coordinator sees a guest report in the list and detail with a "Guest · unverified" label, the phone, the claimed meter, the place and the location accuracy. Assigning, status changes and arrival distance work on it.
- A guest cannot read, list or change any report except through its own token. A token stops working 7 days after the report is resolved or cancelled.
- Guest submission is rate limited per address and per phone number, and a filled honeypot field is rejected quietly.
- `npm run check` passes. Integration tests are added and run if `TEST_DATABASE_URL` is available; if it is not, they are reported as not run.

## Technical Key Decisions and Tradeoffs

1. **Data model:** `FaultReport.customerId` and `serviceLocationId` become optional. New nullable columns: `latitude`, `longitude`, `accuracyM`, `locationSource` (`GPS`, `TYPED`), `placeText`, `claimedMeter`, `trackingToken` (unique). A report is a guest report when `customerId` is null.
   - Why: a fault is a place, not a meter, and REG cannot confirm meter ownership. A `ServiceLocation` cannot be made from a typed meter, because it needs a customer and `meterNumber` is unique.
   - Impact: one additive migration. Existing rows are unchanged.
2. **Serializer keeps its shape:** for a guest report `serializeFault` still returns a `serviceLocation` object built from the report's own point (`id: null`, `meterNumber` from `claimedMeter`, `landmark` from `placeText`), and `customer` stays null.
   - Why: about 85 reads of `serviceLocation` and `fault.customer` across 34 files in backend, web and mobile. Keeping the shape means the technician screens on web and in the Android app, the map parts and the distance code need little or no change.
   - Impact: formatting helpers such as `locationLine` must cope with a null cell and a null meter. Tests cover this. The cell stays empty until boundary data is added later.
3. **A guest has no user, so no `Notification` row:** `Notification.userId` is required and is left alone.
   - Why: the in-app feed is per user. For a guest, the SMS text is built from `customerMessageFor` and sent through `sendSmsForNotifications`, which already accepts plain `{ type, message }` objects.
   - Impact: the "notification in the same transaction" rule applies to registered users only. Guest SMS is still sent after the commit and never throws.
4. **Access by capability link:** `trackingToken` is 24 random bytes (`crypto.randomBytes`, base64url). `GET /api/public/faults/:token` is the only guest read. The page sets `Referrer-Policy: no-referrer`.
   - Why: a typed meter number or a reference is not secret, so neither can open a report. This follows the W3C TAG guidance on capability URLs: treat links like passwords, expire them, avoid leaking them.
   - Impact: anyone holding the link sees that report. Recovery is calling 2727 or the coordinator.
5. **Public endpoints:** `POST /api/public/faults` and `GET /api/public/faults/:token` in a new `routes/public.routes.js`, mounted without `requireAuth`. Everything else stays behind `requireAuth`.
6. **Abuse limits without a new dependency:** a small in-memory limiter in `middleware/rateLimit.js` (per address, and per normalised phone number: 3 guest reports per hour), plus a hidden honeypot field. `app.set('trust proxy', 1)` is added so the address is the client's, not the proxy's.
   - Why: no rate-limit package is installed (nothing in `backend/` references one). An in-memory limiter is about 25 lines and is enough for a one-instance pilot.
   - Impact: limits reset on restart and are not shared between instances. Cloudflare Turnstile is a later option if spam appears.
7. **SMS: wider triggers, swappable sender.** `SMS_NOTIFICATION_TYPES` grows to cover on the way, arrived, resolved and cancelled. `changeStatus` starts sending SMS (it sends only push today). Messages stay short plain text. A new `PUBLIC_WEB_URL` setting in `config/env.js` builds the link.
   - Why: the supervisor asked for follow-up messages. The gateway choice is not settled (see Open Questions), so the sender stays a provider behind `createSmsProvider`.
   - Impact: only guest reports get the extra status texts (decided by the user). Registered customers keep today's behaviour: SMS on received and assigned, the in-app feed and push for the rest.
8. **Location:** a pure helper in `frontend/src/lib/` turns a `GeolocationPositionError` or a position into `{ latitude, longitude, accuracyM }` or a message, with a 15 s timeout and no cached position. The page shows the point and its accuracy, and a written place is always possible.
   - Why: phone accuracy ranges from about 10 m with GPS to hundreds of metres without it, and Chrome on Android can share only an approximate location. The reporter also may not be standing at the fault.
   - Impact: a map tap or draggable pin is not in this plan. It would need changes to `MapView` and is a follow-up.
9. **Camera:** `capture="environment"` on a second "Take a photo" input, next to the existing "Choose a photo". The 1 MB limit and the data-URL storage stay as they are (documented scope decision).
10. **Landing page:** the "Report a fault" actions link to `/report`. The sign-in link is kept for customers who want their history. Signed-in customers keep `/customer/report`.
11. **Not in this plan:** the real gateway provider (own short phase once chosen), the Android app's guest flow, cell and village from boundary data, Turnstile, accounts claimed by phone code, web push, the proposal text.

## Current State

- Reporting needs a customer account and a registered service location: `faults.routes.js:40-47` (`requireRole('CUSTOMER')`) and `faultService.js:84-92`.
- The tracking page is `Tracking.jsx` behind the customer shell, reading `/faults/:id` with polling; the Call link and `fault.serviceLocation.meterNumber` are read directly (`Tracking.jsx:36-37`, `:88-96`, `:126-127`).
- SMS is sent on create and assign only (`faultService.js:133`, `:189`). The provider is `log` unless `SMS_PROVIDER` says otherwise; the Africa's Talking class throws "not implemented" (`smsService.js:22-28`).
- These places fail for a report without a customer: `fault.customer.userId` and `fault.customer.user.phone` (`faultService.js:172`, `:189`, `:255`), `loadFault`'s customer check (`:68-72`), `scopeFor` (`faultQuery.js:5`).
- Arrival distance and position rows read `fault.serviceLocation.latitude/longitude` (`faultService.js:208`, `:233`, `:243-245`); the technician ranking reads it in `technicianService.js:57-62`.
- The landing page sends report actions to sign-in (`landingContent.js:23,28,75,111,121`).
- There is no `trust proxy` setting and no rate limiting in the backend.

## Desired End State

```
Guest phone                         Backend                          Coordinator
┌──────────────┐  POST /public/faults  ┌──────────────────────┐
│ /report      │ ───────────────────▶ │ validate, rate limit │
│ category     │                       │ create report +      │      sees "Guest ·
│ phone        │                       │ trackingToken        │ ───▶  unverified" in the
│ place (GPS)  │ ◀── ref + link ───── │ SMS after commit     │      list, assigns as usual
│ photo        │                       └──────────────────────┘
└──────┬───────┘                                │ SMS: ref + link, then status texts
       ▼                                        ▼
 /track/:token  ◀── GET /public/faults/:token (trimmed payload, no phones)
```

## Phase 1: Data model and the guest report API

Tests first, then code. Files:

- `backend/prisma/schema.prisma` and a new migration (`npx prisma migrate dev --name guest-fault-reports`): optional `customerId` and `serviceLocationId`, the new columns, `LocationSource` enum, an index on `trackingToken`.
- `backend/src/domain/faultPoint.js` (new, pure): the point of a fault, from its registered location or its own coordinates. Used by `changeStatus` (arrival distance and position rows), `technicianService` ranking and the serializer.
- `backend/src/domain/FaultSerializer.js`: guest `serviceLocation` shim; a second function `serializePublicFault` for the trimmed payload (no phones, no meter, technician first name and position only).
- `backend/src/utils/phone.js` (new, pure): normalise Rwandan numbers (`07x…`, `+2507x…`, `2507x…`) to `+2507XXXXXXXX`; reject anything else. Prefixes accepted: 072, 073, 078, 079.
- `backend/src/validators/fault.schemas.js`: `guestCreateSchema` (category, phone, point or place text, optional meter of 11 or 13 digits, description, photo, honeypot).
- `backend/src/middleware/rateLimit.js` (new) and `backend/src/app.js` (`trust proxy`).
- `backend/src/services/faultService.js`: `createGuestFault`, `getFaultByToken`; `loadFault`, `assignTechnician` and `changeStatus` handle a null customer; `listFaults` is unchanged for coordinators.
- `backend/src/routes/public.routes.js` (new) mounted in `app.js`.

Tests:

- Unit: `faultPoint`, `phone`, `rateLimit`, serializer guest shape and public shape (no phone leaks), `guestCreateSchema`.
- Integration (`TEST_DATABASE_URL`): guest create returns a reference and token; the token reads only that report; a wrong token is 404; an expired token is 404; assign and the full status flow work on a guest report; a registered customer cannot read a guest report; rate limit returns 429.

Success criteria: `npm test` and `npm run typecheck` pass; integration tests pass or are reported as not run.

## Phase 2: SMS for guests and follow-up messages

- `backend/src/config/env.js` and `backend/.env.example`: `PUBLIC_WEB_URL`.
- `backend/src/services/smsService.js`: guest messages use their own type set (received, assigned, on the way, arrived, resolved, cancelled) so `SMS_NOTIFICATION_TYPES` for registered customers stays as it is; keep `LogSmsProvider` as the default.
- `backend/src/services/notificationService.js`: a plain-text SMS builder (ASCII only, under 160 characters, reference plus link).
- `faultService.js`: send the received SMS from `createGuestFault`; send assign and status SMS for guest reports from `customerMessageFor` without a notification row; `changeStatus` sends SMS only when the report is a guest report.
- Response of `POST /public/faults` includes `sms: { delivery: 'simulated' | 'queued', text }`, so the confirmation page can show the text when no gateway is connected.

Tests: SMS builder length and characters; fake-provider tests (as in the existing `smsService` tests) that a guest report gets the received, assigned, on-the-way, arrived and resolved texts and that a provider that throws does not fail the request; registered customers still get an in-app row.

Success criteria: `npm test` passes; manual check that `[sms]` lines appear in the backend log for each status.

## Phase 3: The web pages

- `frontend/src/lib/guestReport.js` (new, with tests): phone check, geolocation result mapper, form validation, accuracy wording.
- `frontend/src/pages/public/GuestReport.jsx` (new): the form. Category cards (reuse `CategoryOption`), phone, "Use my location" with accuracy and a written-place fallback, optional meter, description, "Take a photo" and "Choose a photo", the 2727 safety notice already used in `ReportFault.jsx`, a short consent line ("Your phone number is used to text updates about this fault only"). Follows the existing form patterns (`Field`, `ErrorSummary`, `FormError`).
- `frontend/src/pages/public/GuestSubmitted.jsx` (new): reference, link with a copy button, the simulated SMS box when relevant, "call 2727 if you lose this link", and a "Reports on this phone" list kept in browser storage (wrapped in try/catch).
- `frontend/src/pages/public/GuestTracking.jsx` (new) and a shared presentational part extracted from `Tracking.jsx`; the guest variant hides the Call link and the meter line.
- `frontend/src/App.jsx`: public routes `/report`, `/report/sent/:token`, `/track/:token`. A public shell (check whether `MobileShell` renders without a user; if not, a small `PublicShell`).
- `frontend/src/lib/landingContent.js`: report actions go to `/report`.
- Coordinator pages (`Faults.jsx`, `FaultDetails.jsx`, `Assign.jsx`, `Monitoring.jsx`): show "Guest · unverified", the phone, the claimed meter, the place and the accuracy where they now read `customer.name`.

Tests: unit tests for `guestReport.js` and the landing links; `sharedWithMobile.test.js` untouched unless shared helpers change. A browser pass in Chrome at desktop and 375 px: report with location allowed, location denied, a photo, a bad phone, a second report from the same phone, the tracking page through each status, and the coordinator view. The iPhone is useful for the real camera and location prompts.

Success criteria: `npm run check`; the browser pass; a production build.

## Phase 4: the local-SIM Android gateway (once the borrowed phone is in hand)

The user will borrow an Android phone and use their own Rwandan SIM. Steps:

1. Pick a gateway app that runs on the phone and exposes an HTTP endpoint to send a text. Check its documented request format, whether it needs the phone and the backend on the same network or works through a cloud relay, and its daily limit. I have not verified any specific app, so this is a short check before writing code. A phone on a home network cannot be reached by a deployed backend, so a cloud relay is likely needed for anything other than a laptop demo.
2. Add a provider class in `smsService.js` registered in `PROVIDERS`, chosen with `SMS_PROVIDER`, with its URL and key in `config/env.js` and `.env.example` (never committed).
3. Test with a fake HTTP server: success, non-2xx response and timeout (the send must log and never throw to the caller).
4. Send a real text from the phone to a second number and record the result in the plan.

The simulated SMS box on the confirmation page stays whenever `SMS_PROVIDER=log`, so Phases 1 to 3 can be built and demonstrated before this phase.

## Risks

- **SMS gateway lead time.** A registered sender ID takes about three weeks. The page works without SMS, and the simulated box covers the demo. A local-SIM Android gateway or a provider that sends without a registered sender ID are the cheap routes; neither is verified yet.
- **Large cross-cutting change.** The serializer shim limits it, but 34 files read the fields. Mitigation: Phase 1 ends with a test that serializes a guest report through every shape the three clients read, and the Android technician screens are checked against a guest job before merging.
- **Phone location accuracy.** It can be hundreds of metres off, and it can be approximate on Chrome for Android. Mitigation: show accuracy, always allow a written place, keep the coordinator's phone callback.
- **Spam and fake reports.** Limits and the honeypot reduce it, and guest reports are flagged unverified. Not eliminated; Turnstile is the next step.
- **`trust proxy`.** If the hosting proxy count is not 1, the limiter keys on the wrong address. Check the deployed hop count before relying on it.
- **Arrival distance (FR11).** For guests it is measured to the reported point, not a registered meter, so it is not comparable with registered reports. Show it as such in analytics, or exclude guests from that measure.
- **Privacy.** Phone and location are personal data (Law 058/2021). The consent line, no phone in public payloads, link expiry and `no-referrer` are in scope; the exact legal wording needs the official text.
- **Estimates:** Phase 1 about 1 to 2 days, Phase 2 about half a day, Phase 3 about 1 to 2 days. These are my estimates, not measured.

## Decisions Made (2026-11-06, by the user)

1. **SMS route:** a borrowed Android phone with the user's Rwandan SIM as a local-SIM gateway (Phase 4). Until then the SMS is simulated and labelled.
2. **Extra status texts:** guests only. Registered customers are unchanged.
3. **Link lifetime:** 7 days after the report is resolved or cancelled. The guest page shows the technician's first name only.

## Open Questions

- The approved proposal text, to confirm guest reporting and SMS are in scope and to fix the FR9 labels.
- Which gateway app to use (Phase 4, step 1), and whether it works through a cloud relay.

## Manual Verification (to be ticked by the user)

- [ ] Report from a phone with no account, with location allowed and with it denied
- [ ] Take a photo with the phone camera
- [ ] Tracking link opens and updates as a coordinator and technician move the report along
- [ ] The coordinator sees the report flagged as unverified and can assign it
- [ ] The Android technician app shows a guest job without crashing

## Implementation Notes (2026-11-06)

Built on `feat/guest-fault-reports`. Phases 1 to 3 are written; Phase 4 (the real gateway) waits for the borrowed Android phone.

Changes from the plan:

- **Optional `cell` column** added to `FaultReport`. Every screen builds "<cell> Cell, <sector> Sector", so a guest report shows cell `Unknown` until one is set, and `locationLine` (shared by web and Android) shows only "Ndera Sector" then, with the described place shown as the landmark.
- **`onDelete: Restrict`** on `customerId` and `serviceLocationId`. The default for an optional relation is `SetNull`, which would have turned a registered customer's reports into guest reports if the customer was ever deleted.
- **Network rate limit is 30 an hour, not 10.** Mobile carriers share one address between many people; the 3-per-phone-per-hour limit is the real guard.
- **Referrer policy is `strict-origin`, not `no-referrer`.** Found in the browser: with `no-referrer` the OpenStreetMap tile server refuses the map tiles ("Access blocked"). `strict-origin` still never sends the tracking path to other sites. The API also sends `Referrer-Policy: no-referrer` on the JSON response, which is harmless.
- **Guest texts use their own type set** and a plain ASCII builder (`domain/guestSms.js`), so registered customers are unchanged. The honeypot returns a 400, not a quiet success.
- **Web landing copy is overridden** in `landingContent.js` (the CTA and three FAQ answers) because the shared `landingCopy.js` must stay identical to the Android app's, which still asks for sign-in.

Found and fixed in the browser pass (the unit tests did not catch them):

- The map tiles were blocked by the `no-referrer` policy (above).
- `JobDetails.jsx` (web) and `jobs/[id].js` (Android) called `.toFixed` on null coordinates for a guest who only described the place, which blanked the technician's screen. Fixed with a shared, tested `coordinatesText` in `format.js`.

Browser pass (Chrome, local backend on port 4001, SMS provider `log`): empty-form validation; location found (the browser's location call was stubbed, so the real permission prompt is untested); send; confirmation page with the simulated text; refresh of the confirmation page; tracking page updating through assigned, on the way, arrived and resolved with no phone or meter number shown; five texts logged in order and none for "working"; coordinator list, detail, assign and monitoring pages for a guest report with and without coordinates; technician job screen for a guest report; invalid link page; landing buttons go to `/report`; no horizontal overflow at 375 px; camera input has `capture="environment"`; photo preview works.

Not yet checked: the real browser location prompt and camera on a phone, the Android app opening a guest job, the backend integration tests (`TEST_DATABASE_URL`), the 429 message in the browser, and the `trust proxy` hop count on the hosting platform.
