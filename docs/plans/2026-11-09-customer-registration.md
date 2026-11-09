---
date: 2026-11-09T09:30:00+00:00
git_commit: 6eb5c14
branch: docs/rubric-alignment (implement on a new branch feat/customer-registration from main)
topic: 'FR1: customer self-registration and phone sign-in'
tags: [plan, auth, backend, frontend, mobile]
status: ready
---

# PLAN: Customer self-registration and phone sign-in (FR1)

The proposal's FR1 says users "register and sign in using an email address or a phone number". Today there is no
registration and sign-in is by email only (`SCOPE_ALIGNMENT.md`: FR1 Partial). This plan lets a customer create an
account on the web and the Android app, and sign in with an email or a phone number.

## Acceptance Criteria

- A visitor can create a customer account with name, phone (required), email (optional), password and a first service
  location (meter number, cell, village, landmark, GPS point) on the web app and on the Android app, and is signed in
  straight away.
- A customer can sign in with an email address or a phone number in one "Email or phone" box. An unknown account and a
  wrong password give the same message.
- Registration can only create a CUSTOMER. A `role` in the request body is rejected.
- A duplicate phone or email returns 409 with a message that names the field, and nothing is half-created.
- Several customers can register on the same meter (a tenant on the landlord's meter). The same customer cannot
  register the same meter twice.
- Existing seeded accounts keep working (email sign-in unchanged), and their phone numbers also work for sign-in.
- Registration is rate limited, and the password has at least 8 characters.
- `npm run check` passes, and the scope doc, report, architecture doc and testing doc match the code.

## Technical Key Decisions and Tradeoffs

1. **Customers only register themselves:** technicians and coordinators stay seeded.
   - Why: a self-registered technician or coordinator would see other people's data (NFR5).
   - Impact: the register schema is `.strict()` and has no role field. FR13 stays "Not built".
2. **First service location is created at sign-up:** one transaction creates `User`, `Customer` and `ServiceLocation`.
   - Why: a customer cannot report a fault without a location (FR2, FR3), and this needs no extra screen or endpoint.
   - Impact: the form needs a GPS point, because `ServiceLocation.latitude` and `longitude` are required. The pin is
     set with "Use my location" and shown on `MapView`, as in the guest report. It is not draggable.
3. **A meter can be shared:** tenants often use their landlord's meter, so the meter number is no longer unique.
   - Why: a global unique meter would reject a tenant, or lock out the landlord if the tenant registered first. No
     code looks up a location by meter, and nothing can check a meter belongs to the person typing it without REG's
     records, so uniqueness protected nothing.
   - Impact: the migration drops `ServiceLocation_meterNumber_key` and adds `@@unique([customerId, meterNumber])`, so
     one customer cannot add the same meter twice. The meter is stored as digits only (the seeded `0421 5583 019`
     style is cleaned in the same migration). The location's GPS point, not the meter, places the fault on the map.
     The register form says "Shared meter? Enter your landlord's meter number."
4. **Phone required and unique, email optional and unique when given:**
   - Why: it matches how people in Ndera use phones, and SMS needs the number.
   - Impact: migration makes `User.email` nullable and `User.phone` unique. Existing phone values such as
     `+250 788 300 114` hold spaces, so the same migration strips whitespace first. Postgres allows many NULLs in a
     unique column, so seeded accounts are unaffected. The seed script writes normalised numbers.
5. **One login box:** an input containing `@` is looked up by email, anything else by `normaliseRwandanPhone`.
   - Why: no second endpoint and no second form on either client.
   - Impact: `loginSchema` takes `identifier` and still accepts `email` for older installed apps.
6. **Web first, then Android, in separate phases.**
   - Why: the web is deployed automatically and the API change is the same for both. Android needs a new APK.
   - Impact: the mobile screen reuses rules copied from `frontend/src/lib`, guarded by `sharedWithMobile.test.js`.
7. **Defaults:** no SMS verification code (the gateway is untested on a real phone), password of at least 8
   characters, a per-IP rate limit through `createRateLimiter`, and a token returned on success.

## Current State

```
Login.jsx / mobile login.js  --{ email, password }-->  POST /api/auth/login (auth.routes.js:25)
                                                         findUnique({ where: { email } })
                                                         bcrypt.compare → signToken

User { email @unique (required), phone String? (free text, not unique), passwordHash, role }
Customer ──< ServiceLocation { meterNumber @unique (one customer per meter), cell, village?, landmark?, latitude, longitude }
Accounts and locations come only from prisma/seed.js; seeded phones contain spaces.
```

## Desired End State

```
Register.jsx / register.js ──> POST /api/auth/register  (rate limited, validated)
                                 registerCustomer(): one transaction
                                   User(role CUSTOMER) + Customer + ServiceLocation
                                 → 201 { token, user }  → client stores the token, goes to /customer

Login box "Email or phone" ──> POST /api/auth/login { identifier, password }
                                 contains "@" → where { email }
                                 else         → where { phone: normaliseRwandanPhone(identifier) }
```

## Abstractions and Code Reuse

- `backend/`
  - `prisma/schema.prisma` - `User.email String?`, `User.phone String? @unique`, `ServiceLocation.meterNumber`
    without `@unique` plus `@@unique([customerId, meterNumber])`
  - `prisma/migrations/<ts>_customer_registration/migration.sql` - strip spaces from `User.phone` and
    `ServiceLocation.meterNumber`, make `email` nullable, add the unique index on `phone`, drop the meter index and
    add the customer and meter pair (generated by `prisma migrate dev`, then the two `UPDATE`s added by hand before
    it is applied)
  - `prisma/seed.js` - store phones through `normaliseRwandanPhone` and meters as digits only
  - `src/validators/auth.schemas.js` - `loginSchema` (identifier or email), new `registerSchema` (reuses
    `normaliseRwandanPhone` and the 11 or 13 digit meter rule from `fault.schemas.js`)
  - `src/services/authService.js` (new) - `registerCustomer`, `findUserByIdentifier`; pre-checks give a named 409
    for phone and email, and a P2002 race falls back to the same message. The meter is not checked for other
    customers
  - `src/routes/auth.routes.js` - `POST /register`, login uses `findUserByIdentifier`; `publicUser` keeps working
    with a null email
  - `src/middleware/rateLimit.js` - the 429 text says "reports"; take the message as an option so registration can say
    "registrations"
  - `src/services/technicianService.js:9` - `email` may now be null, check callers
  - `src/utils/phone.js` - reused as is
- `frontend/`
  - `src/lib/registration.js` (new) - `validateRegisterForm`, `buildRegisterPayload`, `looksLikeEmail`; reuses
    `normalisePhone` and `isMeterNumber` from `guestReport.js`
  - `src/pages/Register.jsx` (new), route `/register` in `App.jsx`, links from `Login.jsx` and the landing page
  - `src/context/AuthContext.jsx` - `register()` next to `login()`; `login(identifier, password)`
  - `src/pages/Login.jsx` - field becomes "Email or phone"; the "ask your administrator" text points to Register
- `mobile/`
  - `src/lib/registration.js` (new, verbatim copy of the web file) and a guard in `sharedWithMobile.test.js`
  - `app/register.js` (new) - Expo Router screen, location with the existing foreground-location helper
  - `src/context/AuthContext.js` - `register()`; `login` sends `identifier`
  - `app/login.js` - "Email or phone" field and a link to register, for the customer role only

## Logging & Observability

No new logging. A failed registration is an ordinary 4xx through `middleware/error.js`. The password and the full phone
number are never logged.

## Implementation

### Phase 1: Backend registration and phone sign-in

Dependencies: None. Work on branch `feat/customer-registration`.

**Tasks**:

- [x] Write the failing tests first (`tests/unit/authSchemas.test.js`, new `tests/unit/authService.test.js`, new
      `tests/integration/registration.test.js`).
- [x] `schema.prisma`: `email String?`, `phone String? @unique`, meter unique per customer only; run
      `npx prisma migrate dev --name customer_registration --create-only`, then add
      `UPDATE "User" SET "phone" = regexp_replace("phone", '\s', '', 'g')` and the same for
      `"ServiceLocation"."meterNumber"` before the index changes, and apply it.
- [x] `seed.js`: normalise phones; check that `npm --prefix backend run seed` still works on an empty database.
- [x] `auth.schemas.js`: `registerSchema` (strict, no role; name, phone, optional email, password min 8, location
      fields, latitude and longitude ranges) and `loginSchema` with `identifier`.
- [x] `authService.js`: `findUserByIdentifier`, `registerCustomer` (one `prisma.$transaction`).
- [x] `auth.routes.js`: `POST /register` behind a rate limiter (for example 10 per hour per IP) that returns
      `201 { token, user }`; login switches to `findUserByIdentifier` and keeps the single error message.
- [x] `rateLimit.js`: optional `message` option, with a unit test in `rateLimit.test.js`.
- [x] `technicianService.js` and `publicUser`: tolerate `email === null`.
- [x] `ARCHITECTURE.md`: add `POST /auth/register` to the endpoint table, update the roles and sign-in text.

**Automated Verification**:

- [x] Unit: register schema rejects a `role` field, a short password, a bad phone, a bad meter number, out-of-range
      coordinates; accepts a phone-only registration; the phone is stored normalised.
- [x] Integration: registration creates the three rows and returns a working token; then `POST /faults` works for that
      customer with the new location.
- [x] Integration: duplicate phone and duplicate email each return 409 with their own message and leave no new rows.
- [x] Integration: two customers register on the same meter (also written with spaces) and both can report faults;
      the database refuses the same meter twice for one customer.
- [x] Integration: sign-in works with email, with the phone in `078…`, `+25078…` and spaced forms, and a seeded
      customer's phone; wrong password and unknown account give identical 401 bodies.
- [x] Integration: 11th registration from one IP in an hour returns 429.
- [x] `npm run check` passes. `npm --prefix backend run test:integration` passes (needs `TEST_DATABASE_URL`).
      _Checked 9 Nov 2026 on Windows: lint, type-check, unit tests (222 + 146 + 129) and integration (104) pass; `format:check` fails only on CRLF line endings (checkout has `autocrlf=true`), and `prettier --check --end-of-line auto .` is clean._

### Phase 2: Web registration and "Email or phone" sign-in

Dependencies: Phase 1.

**Tasks**:

- [x] Failing tests first in `frontend/src/lib/registration.test.js`.
- [x] `lib/registration.js`: form rules and payload builder.
- [x] `Register.jsx`: single page form with the mockup below, "Use my location" with the guest report's geolocation
      error messages, `MapView` preview, errors per field, a 409 shown on the right field.
- [x] `AuthContext.jsx` `register()`, `App.jsx` route (redirect signed-in users like `Login.jsx` does), links from the
      login page and the landing page.
- [x] `Login.jsx`: field label, `type="text"`, `inputMode="email"`, `autoComplete="username"`, validation message for
      both forms.
- [x] `SCOPE_ALIGNMENT.md` (FR1 row, the "No sign-up for customers" bullet, the first table row), `TECHNICAL_REPORT.md`
      table 1 (FR1 row), `TESTING.md` counts (re-run all suites and use the real numbers), `README.md` if it mentions
      the login.

```
 Create your account
 ┌──────────────────────────────────┐
 │ Full name        [______________]│
 │ Phone            [078 …_________]│
 │ Email (optional) [______________]│
 │ Password         [_________][Show]│
 │ ── Your meter ───────────────────│
 │ Meter number     [______________]│
 │ Shared meter? Use your landlord's│
 │ Cell [_______]  Village [_______]│
 │ Landmark (optional) [___________]│
 │ [ Use my location ]  (map)       │
 │ [        Create account        ] │
 │ Already registered? Sign in      │
 └──────────────────────────────────┘
```

**Automated Verification**:

- [x] `registration.test.js`: every error, the phone forms, the payload leaves out an empty email and landmark.
- [x] `npm run check` passes (lint, format, type-check, all unit tests, `vite build` in CI).

**Manual Verification**:

- [x] On the deployed or local web app: register with a phone only, land on the customer home, report a fault using the
      new location, sign out, sign in with the phone, sign in again with a seeded email account.

### Phase 3: Android registration and sign-in

Dependencies: Phase 1 (Phase 2 for the shared rules file).

**Tasks**:

- [x] Failing Jest tests: `src/lib/registration.test.js` and the new `sharedWithMobile.test.js` entry.
- [x] `src/lib/registration.js` copy, `app/register.js` screen with the shared look (`Backdrop`, `Eyebrow`, `FormError`),
      `AuthContext.js` `register()`, and `login` sending `identifier`.
- [x] `app/login.js`: "Email or phone", and a "Create an account" link shown for the customer role only.
- [x] Check the SDK 58 docs for the location call before using it.
- [x] Docs: FR1 becomes Completed on web and Android in `SCOPE_ALIGNMENT.md` and the report; test counts in
      `TESTING.md` and the report; `MOBILE.md` if it describes sign-in.

**Automated Verification**:

- [x] `cd mobile && npm test`, `npx expo-doctor`, `npx expo export --platform android` pass.
      _Checked 9 Nov 2026: Jest 164 pass in 20 suites, `expo-doctor` 20/20, `expo export --platform android` bundles (the new strings are in the bundle)._
- [x] `npm run check` passes.
      _Same caveat as Phase 1: `format:check` fails locally only on CRLF line endings and is clean with `--end-of-line auto`. Unit tests: 222 + 148 + 164._

**Manual Verification**:

- [ ] On an Android build: register, report a fault, sign out, sign in by phone. Needs a new APK; there is no
      Android phone yet, so this stays unticked until one is available.

## Implementation Notes

- The earlier discussion said "drag the pin". The guest report only uses "Use my location", so this plan does the same.
  A draggable pin is future work.
- `mobile/CLAUDE.md` points to `mobile/AGENTS.md`, which does not exist. The root `AGENTS.md` mobile section was used.
- Deploying Phase 1 runs the migration on Neon. It rewrites phone numbers and meter numbers, so take a Neon branch or
  backup first.
- Shared meters (a tenant on a landlord's meter) are allowed on purpose. Nothing verifies a meter number, so it is a
  label for the coordinator. If REG's records are ever available, claiming a verified meter is the next step.
- `SCOPE_ALIGNMENT.md` gets one line about shared meters in Phase 2, in the changes-from-the-plan list.

## References

- Proposal PDF, FR1, FR2, NFR4, NFR5 (`docs/_Proposal_mission Capstone (1).pdf`)
- `docs/SCOPE_ALIGNMENT.md`, `docs/ARCHITECTURE.md`, `docs/plans/2026-11-05-guest-fault-reporting.md`
- `backend/src/routes/auth.routes.js`, `backend/src/utils/phone.js`, `backend/src/middleware/rateLimit.js`,
  `frontend/src/lib/guestReport.js`, `frontend/src/pages/public/GuestReport.jsx`
