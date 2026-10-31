# Umuriro Response

**A Location-Based Web System for Improving Electricity Fault Reporting and Technician Response Services Delivery in Rwanda**

Final-year full-stack capstone project · Pilot area: Ndera Sector, Gasabo District, Kigali

|                             |                                                          |
| --------------------------- | -------------------------------------------------------- |
| **GitHub repository**       | https://github.com/Larissanoella-05/Capstone-project.git |
| **Live application**        | https://capstone-project-six-inky.vercel.app             |
| **Live API (health check)** | https://capstone-project-as2y.onrender.com/api/health    |
| **Walkthrough video**       | _TODO: add the video link_                               |
| **Technical report (PDF)**  | _TODO: add the report link_                              |

> The API runs on Render's free tier, which sleeps after about 15 minutes without traffic. If the live app is slow to sign in, open the health-check link first and wait up to a minute for it to answer.

---

## 1. Description

### The problem

When the electricity fails at a home in Rwanda, the customer usually phones the utility and describes the fault and the location verbally. The technician sent out often has to call the customer again to find the premises. Reports are hard to track, response time is lost on directions, and the customer cannot see what is happening with their fault.

### The solution

Umuriro Response replaces that chain of phone calls with one shared, location-based record of each fault. It has a responsive **web application** (all three roles) and an **Android app** (customers and technicians), both using the same API:

**Customer reports a fault → the fault is linked to the customer's registered service location → the Service Coordinator receives it → the Coordinator assigns a technician → the Technician sees the job and navigates to the location → the Technician updates the status → the Customer tracks the progress → the Technician records the resolution.**

All three roles read and write the same record through one API and one database, so a status change made by the technician is visible to the coordinator and the customer within seconds.

### User roles

| Role                    | Main tasks                                                                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Customer**            | Report a fault (with a photo), follow its progress on a map and timeline, receive notifications. Web and Android                                   |
| **Service Coordinator** | See all faults, search and filter them, assign the nearest available technician, monitor progress. Web only                                        |
| **Technician**          | See assigned jobs, navigate to the service location, update the status, record the resolution, share live location while on a job. Web and Android |

### Fault statuses

`Reported → Assigned → On the Way → Arrived → Working → Resolved`

Every status change is time-stamped and stored, which makes it possible to measure response times (report to assignment, assignment to arrival, time on site).

## 2. Technology stack

| Layer       | Technology                                                      | Purpose                                                             |
| ----------- | --------------------------------------------------------------- | ------------------------------------------------------------------- |
| Frontend    | React 19, Vite 8                                                | User interface and development/build tool                           |
|             | Tailwind CSS 4                                                  | Styling, using the design system colours and fonts                  |
|             | React Router 7                                                  | Navigation between screens and role-based access                    |
|             | Lucide React                                                    | Icons                                                               |
|             | Leaflet + OpenStreetMap                                         | Maps (no API key or billing needed)                                 |
|             | Recharts                                                        | Charts on the analytics page                                        |
| Backend     | Node.js, Express 4                                              | REST API                                                            |
|             | Zod                                                             | Request validation                                                  |
|             | JSON Web Tokens, bcryptjs                                       | Login tokens and password hashing                                   |
| Database    | PostgreSQL                                                      | Relational database                                                 |
|             | Prisma 6                                                        | Schema, migrations and database queries                             |
| Android app | Expo SDK 58, React Native 0.88, Expo Router                     | One app for customers and technicians (plain JavaScript, `mobile/`) |
|             | MapLibre + OpenFreeMap                                          | Maps (no API key or billing needed)                                 |
|             | expo-location, expo-image-picker                                | Technician position (foreground only) and fault photos              |
|             | Expo Push Service (`expo-server-sdk`), Firebase Cloud Messaging | Push notifications                                                  |
|             | EAS Build                                                       | Cloud builds of the installable APK                                 |
| Tools       | Git, GitHub, VS Code, npm                                       | Version control and development                                     |

## 3. Technical requirements

| Requirement       | Version / detail                                                                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Node.js           | 20 or newer (the CI workflow uses 20; development tests ran on 22)                                                                                                       |
| PostgreSQL        | 14 or newer (tested on 16)                                                                                                                                               |
| Browsers          | Current Chrome, Edge, Firefox and Safari (desktop and mobile)                                                                                                            |
| Devices           | Customer and technician screens are designed for phones (from 360 px wide); the coordinator screens for a laptop or desktop                                              |
| Network           | Internet access for the OpenStreetMap tiles (web) and the OpenFreeMap tiles (Android app)                                                                                |
| Android app       | An Android phone to install the APK on. The Android version and phone models tested are recorded in [docs/TESTING.md](docs/TESTING.md)                                   |
| External accounts | None needed to run the web app locally (no paid map or SMS keys). The Android app needs a free Expo account to build, and a free Firebase project for push notifications |

## 4. Setting up the environment and the project

### Prerequisites

Install these first and check the versions:

| Tool                                               | Version     | Check            |
| -------------------------------------------------- | ----------- | ---------------- |
| [Node.js](https://nodejs.org) (includes npm)       | 20 or newer | `node -v`        |
| [PostgreSQL](https://www.postgresql.org/download/) | 14 or newer | `psql --version` |
| [Git](https://git-scm.com)                         | any recent  | `git --version`  |
| [VS Code](https://code.visualstudio.com)           | recommended |                  |

On Windows, run the commands below in **Git Bash**. Keep the project **outside OneDrive**: OneDrive locks files inside `node_modules` and causes `EPERM` errors.

### Step 1: Clone the repository

```bash
git clone https://github.com/Larissanoella-05/Capstone-project.git
cd Capstone-project
```

### Step 2: Install dependencies

```bash
cd backend
npm install
cd ../frontend
npm install
cd ..
```

Exact versions are recorded in each `package-lock.json`, so everyone installs the same ones.

### Step 3: Create the database

```bash
psql -U postgres -c "CREATE DATABASE umuriro;"
```

(Or create a database called `umuriro` in pgAdmin.)

### Step 4: Configure environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Then edit `backend/.env`:

| Variable                | Purpose                                                                       | Example                                                                    |
| ----------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `DATABASE_URL`          | PostgreSQL connection                                                         | `postgresql://postgres:YOUR_PASSWORD@localhost:5432/umuriro?schema=public` |
| `PORT`                  | API port                                                                      | `4000`                                                                     |
| `JWT_SECRET`            | Signs login tokens: any long random string                                    |                                                                            |
| `JWT_EXPIRES_IN`        | Web session length                                                            | `12h`                                                                      |
| `JWT_EXPIRES_IN_MOBILE` | Android app session length (the app sends `client: "mobile"` when signing in) | `30d`                                                                      |
| `EXPO_ACCESS_TOKEN`     | Optional. Only if "enhanced push security" is on in your Expo account         |                                                                            |
| `CORS_ORIGIN`           | Frontend address allowed to call the API (no trailing slash)                  | `http://localhost:5173`                                                    |

`frontend/.env`:

| Variable       | Purpose                                                  | Example                 |
| -------------- | -------------------------------------------------------- | ----------------------- |
| `VITE_API_URL` | API address, without `/api` and without a trailing slash | `http://localhost:4000` |

The `.env` files contain secrets and are ignored by Git. Only the `.env.example` templates are committed.

### Step 5: Create the tables and load the sample data

```bash
cd backend
npx prisma migrate dev
npm run db:seed
```

`migrate dev` applies the migrations in `backend/prisma/migrations/`. `db:seed` loads the Ndera sample customers, technicians and faults; running it again resets the data.

### Step 6: Run the application

Use two terminals.

```bash
# Terminal 1: API on http://localhost:4000
cd backend
npm run dev
```

```bash
# Terminal 2: frontend on http://localhost:5173
cd frontend
npm run dev
```

Open http://localhost:5173. To check the API on its own: http://localhost:4000/api/health should return `"database":"connected"`.

### Useful commands (in `backend/`)

| Command                    | What it does                                             |
| -------------------------- | -------------------------------------------------------- |
| `npm run dev`              | Start the API, restarting on file changes                |
| `npm run db:seed`          | Reset the sample data                                    |
| `npx prisma studio`        | Browse the database tables in the browser                |
| `npm test`                 | Unit tests (no database needed)                          |
| `npm run test:integration` | API + database tests (needs `TEST_DATABASE_URL`, see §6) |
| `npm run test:perf`        | Load test of the read endpoints against a running API    |

### Project structure

```text
├── backend/
│   ├── prisma/          schema.prisma, migrations/, seed.js
│   ├── src/
│   │   ├── config/      environment variables
│   │   ├── domain/      FaultStatusMachine (workflow rules), TechnicianRanker (assignment ranking)
│   │   ├── lib/         shared Prisma client
│   │   ├── middleware/  login check, roles, validation, errors
│   │   ├── routes/      API endpoints (HTTP only, no business rules)
│   │   ├── services/    use cases and database access
│   │   ├── validators/  request-body schemas (Zod)
│   │   └── utils/       constants, distance calculation, HTTP errors
│   └── tests/
│       ├── unit/        domain, validators, middleware
│       ├── integration/ full workflow over HTTP against PostgreSQL
│       └── performance/ load test script
├── frontend/
│   └── src/
│       ├── components/  layouts, map, status pills, loading/error states
│       ├── context/     signed-in user, messages
│       ├── hooks/       data loading and live refresh
│       ├── lib/         API client, labels and formatting (+ unit tests)
│       └── pages/       customer/, technician/, coordinator/, Login
├── mobile/              Android app (Expo, React Native), see "Mobile app (Android)" below
│   ├── app/             screens as files (Expo Router): login, customer/, technician/
│   ├── src/
│   │   ├── components/  map, tracker, status pills, loading/error states
│   │   ├── context/     signed-in user, messages, notifications, tracking state
│   │   ├── hooks/       data loading and polling, push registration
│   │   └── lib/         API client, token store, formatting (+ Jest tests)
│   ├── app.config.js    app name, package id, permissions and plugins
│   ├── assets/          app icon, adaptive icon, splash and notification icon (regenerate with `node scripts/make-icons.js`)
│   └── eas.json         build profiles (development, preview)
├── docs/                SCOPE_ALIGNMENT.md, TESTING.md
└── .github/workflows/   CI: runs all tests, the frontend build and the Android bundle on every push
```

### Code design

- **Layers:** routes (HTTP) → validators (input) → services (use cases, transactions) → Prisma (data). Routes contain no business rules.
- **Encapsulated domain rules:** `FaultStatusMachine` owns which status may follow which and who may make each change; `TechnicianRanker` owns how technicians are ordered. Both are plain classes with no database code, so they are unit tested directly.
- **Inheritance / polymorphism:** `HttpError` subclasses `Error`; every layer throws it and one error handler turns any of them into the right HTTP response.
- **Algorithms:** haversine great-circle distance (`utils/geo.js`); multi-key ranking (availability, distance, workload, name; O(n log n)); response-time averages computed from the stored stage timestamps (`services/statsService.js`).
- **Data integrity:** each status change, its history row and its notifications are written in one transaction; updates only apply if the fault is still in the status that was checked, so double-taps and simultaneous assignments cannot create duplicates.

### Main API endpoints

| Method        | Endpoint                                                                 | Used by                                                                                          |
| ------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| POST          | `/api/auth/login`                                                        | All (the Android app adds `"client": "mobile"` for a 30-day session)                             |
| GET           | `/api/faults` · `/api/faults/:id`                                        | All (each role sees only what it may)                                                            |
| POST          | `/api/faults`                                                            | Customer: report a fault                                                                         |
| POST          | `/api/faults/:id/assign`                                                 | Coordinator: assign a technician                                                                 |
| PATCH         | `/api/faults/:id/status`                                                 | Technician: next stage · Coordinator: cancel                                                     |
| GET           | `/api/technicians?faultId=`                                              | Coordinator: technicians ranked available → nearest → least busy, best one flagged `recommended` |
| POST          | `/api/technicians/me/location`                                           | Technician: update position                                                                      |
| GET           | `/api/notifications` · PATCH `/api/notifications/read-all` · `/:id/read` | Customer, Technician                                                                             |
| POST · DELETE | `/api/devices`                                                           | Android app: register / remove this phone's push token (sign-in / sign-out)                      |

### Mobile app (Android)

`mobile/` is an Expo (React Native) app for **customers and technicians**. It talks to the same API as the web app. Coordinators use the web app; signing in as a coordinator on the phone shows "Coordinators use the web app."

**What you need:** Node 20+, a free [Expo account](https://expo.dev) and an Android phone. You do **not** need Android Studio: the installable app is built in Expo's cloud (EAS). Maps, the camera, location and push are native code, so the app **cannot run in Expo Go**; it needs a _development build_ (steps below).

#### 1. Install and configure

```bash
cd mobile
npm install
cp .env.example .env
```

Edit `mobile/.env` (these values are bundled into the app, so never put a secret in an `EXPO_PUBLIC_*` variable):

| Variable                    | Purpose                     | Value                                                              |
| --------------------------- | --------------------------- | ------------------------------------------------------------------ |
| `EXPO_PUBLIC_API_URL`       | API address, without `/api` | Live API: `https://capstone-project-as2y.onrender.com`             |
| `EXPO_PUBLIC_MAP_STYLE_URL` | Map style                   | `https://tiles.openfreemap.org/styles/liberty` (no key or account) |

Metro reads `.env` when it bundles the JavaScript, so restart it with `--clear` after changing it. The `eas.json` build profiles set `EXPO_PUBLIC_API_URL` for installed builds.

**Using your own local API instead:** run the backend (`npm run dev` in `backend/`), set `EXPO_PUBLIC_API_URL=http://<your computer's LAN address>:4000` (never `localhost`: on a phone that is the phone itself), keep the phone and computer on the same Wi-Fi, and allow port 4000 through the firewall. The Android app is not subject to CORS. If sign-in says it cannot reach the server, check the address in a phone browser first; if that works but the app still cannot connect, Android may be blocking plain `http://` for that build, so use the HTTPS Render address instead.

#### 2. Build and install the development build (once, and after adding any native package)

```bash
npx eas-cli login
npx eas-cli build --profile development --platform android
```

Answer **yes** to "Generate a new Android Keystore". When the build finishes, open the link or scan the QR code on the phone and install the APK (allow "install unknown apps" for the browser if asked). The Expo project id is in `mobile/app.config.js` (`extra.eas.projectId`); to build under your own Expo account, create a project with `npx eas-cli init`, copy the id it prints into that file by hand (EAS cannot edit a dynamic config), and change `slug` and `android.package` if you want your own app id.

#### 3. Run it

```bash
cd mobile
npx expo start --dev-client --clear
```

Open the installed **Umuriro** app and scan the QR code (or enter the address shown). Changes to JavaScript reload instantly; adding a package with native code or a config plugin needs a new development build.

Demo accounts (password `demo1234` for all): `aline@demo.rw` (customer), `jeanclaude@demo.rw` (technician). `grace@demo.rw` (coordinator) is refused by the app by design.

#### 4. Push notifications (one-time Firebase setup)

Push needs Firebase Cloud Messaging. Without these steps the app and API still work; only the phone alerts are missing (the Alerts tab still lists every notification).

1. Create a Firebase project, add an **Android app** with package name `rw.umuriro.response`, and download `google-services.json`.
2. Store it in EAS as a file variable so cloud builds can use it (the file is ignored by Git and must never be committed):
   ```bash
   cd mobile
   npx eas-cli env:set --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --visibility sensitive --environment development --environment preview
   ```
   For a local build only, put the file at `mobile/google-services.json` instead.
3. In Firebase → Project settings → Service accounts, generate a private key, then upload it to Expo: `npx eas-cli credentials -p android` → Google Service Account → FCM V1 key. Keep the key file out of the repository.
4. Deploy the backend (the `DeviceToken` migration is applied by `prisma migrate deploy`), then rebuild the app so it includes the Firebase file.

How it works: after sign-in the app registers its Expo push token with `POST /api/devices`; the backend sends a push through the Expo Push Service after each notification it creates (report received, technician assigned, on the way, arrived, resolved, cancelled, new job). Tapping a push opens the fault (customer) or job (technician). Signing out removes the token, and signing in as someone else on the same phone moves it to them. The backend removes tokens that Expo reports as no longer registered. Push failures are logged as `[push] …` and never fail an API request.

#### 5. Installable build for a demo

```bash
npx eas-cli build --profile preview --platform android
```

This produces an APK that points at the Render API and runs on its own (no Metro needed). Share the build link; testers install it like any APK.

#### How the technician's location works

While a technician's active job is _On the way_, _Arrived_ or _Working_ **and the app is open on screen**, the phone shares its position: the first fix is sent at once, then at most one every 15 seconds and only after moving 25 metres or more. The app asks only for foreground location (no background permission). Locking the phone or leaving the app stops the updates; this is a deliberate limit of the prototype and keeps the app out of extra store review.

#### Maps

The map uses [MapLibre](https://maplibre.org) with the free [OpenFreeMap](https://openfreemap.org) style, so no key or billing account is needed. OpenFreeMap has no service guarantee. To switch to another provider, change `EXPO_PUBLIC_MAP_STYLE_URL` (for example a MapTiler style URL with your key; a key in an `EXPO_PUBLIC_*` variable is visible to anyone who unpacks the app, so restrict it in the provider's dashboard) and rebuild. The map attribution stays visible, as the OpenFreeMap and OpenStreetMap licences require.

#### Mobile tests

```bash
cd mobile
npm test                                  # Jest: API client, sign-in, polling, location rules, tracker, push
npx expo-doctor                           # checks the project and its dependency versions
npx expo export --platform android        # proves the whole app bundles (also run by CI)
```

Device behaviour (maps, GPS, camera, push) cannot be unit tested; the manual checklist and the results are in [docs/TESTING.md](docs/TESTING.md).

#### Known limits and troubleshooting

| Problem                                                                                  | Cause                                                                                                 | Fix                                                                                                                                     |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| "Cannot reach the server" on the login screen                                            | `EXPO_PUBLIC_API_URL` missing or `localhost`, so the phone calls itself                               | Create `mobile/.env`, then `npx expo start --dev-client --clear`                                                                        |
| "Waking the server…" for up to a minute on first sign-in                                 | Render's free tier sleeps when idle                                                                   | Wait; the app allows 70 seconds                                                                                                         |
| `TurboModuleRegistry … 'MLRNCameraModule' could not be found` (or another native module) | The installed APK was built before that package was added                                             | Build and install a new development build                                                                                               |
| Map area says "Map unavailable in this build"                                            | Same as above, for MapLibre                                                                           | Rebuild the development build                                                                                                           |
| `npm error ECONNRESET` during `npm install` or `expo export`                             | Unstable network                                                                                      | Retry; `npm cache verify`; check proxy settings                                                                                         |
| `npx expo install <package>` fails to run npm on Windows                                 | Known quirk on some Windows setups                                                                    | Run `npm install <package>@<version>` using the version `npx expo-doctor` expects, and add any config plugin to `app.config.js` by hand |
| No push arrives                                                                          | Firebase steps above not done, notifications blocked in Android settings, or the phone is an emulator | Check the steps; look for `[push]` lines in the Render logs                                                                             |
| The 15-minute push receipt check does not run                                            | It uses an in-process timer and Render's free tier sleeps                                             | Tokens that are invalid at send time are still removed                                                                                  |

---

## 5. Deployment plan

The application is deployed and publicly reachable:

| Part     | Platform                     | Address                                      |
| -------- | ---------------------------- | -------------------------------------------- |
| Frontend | **Vercel**                   | https://capstone-project-six-inky.vercel.app |
| Backend  | **Render** (web service)     | https://capstone-project-as2y.onrender.com   |
| Database | **Neon** (hosted PostgreSQL) | Private; reached only by the backend         |

| Part     | What the platform does                                                                        |
| -------- | --------------------------------------------------------------------------------------------- |
| Frontend | Builds `frontend/` with `npm run build` and serves `dist/` over HTTPS from a global CDN       |
| Backend  | Runs `backend/` with `npm start`; checks `/api/health` to confirm the API and database are up |
| Database | Managed PostgreSQL with encrypted (TLS) connections                                           |

### Steps

1. **Database (Neon):** create a project and copy its connection string (ends in `?sslmode=require`). Use the direct connection, not the pooled one, so Prisma migrations run reliably.
2. **Backend (Render):** new Web Service from the GitHub repository.
   - Root directory: `backend`
   - Build command: `npm install && npx prisma migrate deploy`
   - Start command: `npm start`
   - Health check path: `/api/health`
   - Environment variables: `DATABASE_URL` (Neon), `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN` (the Vercel address), `NODE_ENV=production`
3. **Sample data:** run `npm run db:seed` once from a computer with `DATABASE_URL` set to the Neon connection string.
4. **Frontend (Vercel):** import the repository.
   - Root directory: `frontend`
   - Framework: Vite
   - Environment variable: `VITE_API_URL` = the Render address (non-secret: it is visible in the browser by design)
   - `frontend/vercel.json` sends every path to `index.html` so page refreshes work
5. **Connect:** set `CORS_ORIGIN` on Render to the Vercel production address, for example `https://capstone-project-six-inky.vercel.app`. It must be the origin only: `https://` plus the domain, with no page path such as `/login` and no trailing slash. Several addresses can be listed, separated by commas.

### Production environment variables

| Platform | Variable                | Value                                                                |
| -------- | ----------------------- | -------------------------------------------------------------------- |
| Render   | `DATABASE_URL`          | Neon connection string (secret)                                      |
| Render   | `JWT_SECRET`            | Long random string, for example from `openssl rand -hex 32` (secret) |
| Render   | `JWT_EXPIRES_IN`        | `12h`                                                                |
| Render   | `JWT_EXPIRES_IN_MOBILE` | `30d` (optional: this is the default)                                |
| Render   | `EXPO_ACCESS_TOKEN`     | Optional, only if Expo "enhanced push security" is on (secret)       |
| Render   | `CORS_ORIGIN`           | `https://capstone-project-six-inky.vercel.app`                       |
| Render   | `NODE_ENV`              | `production`                                                         |
| Vercel   | `VITE_API_URL`          | `https://capstone-project-as2y.onrender.com`                         |

Render sets `PORT` itself. Secrets are stored only on Render and never with a `VITE_` prefix, because Vite copies `VITE_` variables into the code sent to the browser.

### Environment and security

- **Environment variables:** secrets live only in each platform's settings, never in the repository.
- **HTTPS:** Vercel and Render provide and renew certificates automatically, and Neon requires an encrypted connection.
- **API configuration:** the frontend reads the API address from `VITE_API_URL` at build time. The API accepts browser requests only from the origins in `CORS_ORIGIN`.
- **Migrations:** `prisma migrate deploy` applies committed migrations without resetting data.

### After deploying, check

- [ ] `/api/health` on Render returns `ok` and `connected`
- [ ] All three demo accounts can sign in
- [ ] The full workflow works: report → assign → on the way → arrived → working → resolved
- [ ] Refreshing a page such as `/customer/reports` does not show a 404

### Issues met during deployment

| Problem                                | Cause                                                 | Fix                                                                       |
| -------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------- |
| Browser error "blocked by CORS policy" | `CORS_ORIGIN` did not exactly match the site's origin | Use the production domain, without `/login` or a trailing slash           |
| Vercel warning about a public prefix   | `VITE_API_URL` was marked as a secret                 | It is a public address by design; saved as a normal (non-secret) variable |
| First request is slow                  | Render's free tier sleeps when idle                   | Open `/api/health` first; a paid instance would stay awake                |

---

## 6. Testing

Full method and results: [docs/TESTING.md](docs/TESTING.md). Scope evidence: [docs/SCOPE_ALIGNMENT.md](docs/SCOPE_ALIGNMENT.md).

Run these in **Git Bash** from the project folder.

```bash
# Unit tests (no database needed)
cd backend && npm test && cd ..
cd frontend && npm test && npm run build && cd ..

# Integration tests: they WIPE and reseed their database, so they need a SEPARATE one.
# 1. Create the test database once (asks for the postgres password)
psql -U postgres -h localhost -c "CREATE DATABASE umuriro_test;"

# 2. Type the test connection URL without it showing on screen or in your shell history:
#    postgresql://postgres:YOUR_PASSWORD@localhost:5432/umuriro_test?schema=public
read -rsp "Test database URL: " TEST_DATABASE_URL && export TEST_DATABASE_URL && echo

# 3. Create the tables in the TEST database (once, and after each new migration)
cd backend
DATABASE_URL="$TEST_DATABASE_URL" npx prisma migrate deploy

# 4. Run them
npm run test:integration

# Load test (read-only), against an API started on the TEST database in a second Git Bash window:
#   cd backend && DATABASE_URL="$TEST_DATABASE_URL" PORT=4100 npm start
API_URL=http://localhost:4100 npm run test:perf
```

**Safety checks.** Before the integration tests change anything, `backend/tests/integration/testDatabaseGuard.js` stops the run unless `TEST_DATABASE_URL` is set (there is no fallback to `DATABASE_URL`), its database name ends in `_test`, it is not the same database as `DATABASE_URL` in `backend/.env`, it is on `localhost`, the server confirms that database name, and every existing account in it is a demo (`@demo.rw`) account. Your development database and the deployed database can never be wiped by the tests.

The Android app has its own tests (`cd mobile && npm test`, `npx expo-doctor`, `npx expo export --platform android`); see "Mobile tests" above and [docs/TESTING.md](docs/TESTING.md).

The same tests run automatically on GitHub Actions for every push (`.github/workflows/test.yml`: `backend`, `frontend` and `mobile` jobs).
