# Umuriro Response

A web and Android app for reporting electricity faults and getting a technician to the door faster.
Final-year capstone for **Ndera Sector, Gasabo District, Kigali**.

|                             |                                                                        |
| --------------------------- | ---------------------------------------------------------------------- |
| **Live app**                | https://capstone-project-six-inky.vercel.app                           |
| **Live API (health check)** | https://capstone-project-as2y.onrender.com/api/health                  |
| **Repository**              | https://github.com/Larissanoella-05/Capstone-project.git               |
| **Walkthrough video**       | https://www.youtube.com/watch?v=cLlBRwPkJnk                            |
| **Technical report (PDF)**  | [docs/Umuriro-technical-report.pdf](docs/Umuriro-technical-report.pdf) |

> The API runs on Render's free tier and sleeps after about 15 minutes. If sign-in is slow, open the
> health-check link first and wait up to a minute.

## Overview

When the power goes out, people phone the utility and describe where they live, and the technician often has to
call back to find the house. Umuriro Response keeps every fault in one shared, located record:

**Customer reports → Coordinator assigns a technician → Technician updates the status → Customer follows it.**

Statuses are `Reported → Assigned → On the Way → Arrived → Working → Resolved`, each time-stamped so response
times can be measured. Changes show up for every role within seconds (polling).

| Role                    | Does                                                                                 | Where        |
| ----------------------- | ------------------------------------------------------------------------------------ | ------------ |
| **Anyone, no account**  | Reports a fault with a phone number, place and photo; gets an SMS link to follow it  | Web          |
| **Customer**            | Registers, signs in by email or phone, reports and tracks faults, gets notifications | Web, Android |
| **Service Coordinator** | Sees all faults, assigns the nearest free technician, reads the analytics            | Web          |
| **Technician**          | Sees assigned jobs, navigates, updates the status, records the fix, shares location  | Web, Android |

SMS goes out through an Android phone running a gateway app ([docs/SMS_GATEWAY.md](docs/SMS_GATEWAY.md)). It
has been tested on a real phone in a local run; the deployed app only logs texts.

## Technical requirements

| Need                | Version                                                                           |
| ------------------- | --------------------------------------------------------------------------------- |
| Node.js / npm       | 20 or newer (CI uses 20; developed on 24)                                         |
| PostgreSQL          | 14 or newer (CI uses 16; developed on 18)                                         |
| Git                 | Any recent version. On Windows use Git Bash and keep the project outside OneDrive |
| Web app             | React 19.3, Vite 8, Tailwind CSS 4.3, React Router, Leaflet, Recharts             |
| API                 | Express 4.22, Prisma 6.19, Zod, JWT + bcrypt                                      |
| Android app         | Expo SDK 58, React Native 0.88, Expo Router, MapLibre                             |
| Browser             | A current Chrome, Edge, Firefox or Safari                                         |
| Hardware (optional) | An Android phone for the app (tested on Android 11); one with a SIM for real SMS  |

Android builds run in Expo's cloud (EAS), so Android Studio is not needed. No paid map or SMS keys are needed.

## Installation

```bash
git clone https://github.com/Larissanoella-05/Capstone-project.git
cd Capstone-project
(cd backend && npm ci)
(cd frontend && npm ci)

psql -U postgres -c "CREATE DATABASE umuriro;"
cp backend/.env.example backend/.env       # set DATABASE_URL and JWT_SECRET
cp frontend/.env.example frontend/.env

cd backend
npx prisma migrate dev
npm run db:seed
npm run dev                                # API on http://localhost:4000
```

In a second terminal: `cd frontend && npm run dev`, then open http://localhost:5173. The API health check
(http://localhost:4000/api/health) should say `"database":"connected"`.

**Demo accounts** (password `demo1234`; set `VITE_DEMO_LOGIN=true` in `frontend/.env` for a role picker):
`aline@demo.rw` (customer), `jeanclaude@demo.rw` (technician), `grace@demo.rw` (coordinator).
New customers can register at `/register`.

**Android app:** needs a development build, not Expo Go. See [docs/MOBILE.md](docs/MOBILE.md).
All environment variables are in [docs/SETUP.md](docs/SETUP.md).

## Repository structure

```text
backend/            Express API
  prisma/             schema.prisma, migrations, seed
  src/routes/         HTTP only
  src/services/       business logic and database access
  src/domain/         pure rules (status machine, technician ranking)
  src/validators/     Zod request schemas
  tests/              unit and integration tests
frontend/           React web app for all three roles
  src/pages/          one folder per role, plus public pages
  src/lib/            pure, unit-tested helpers
mobile/             Expo Android app (customers, technicians)
  app/                Expo Router screens
  src/                components, context, API client
docs/               architecture, setup, testing, report, plans
.github/workflows/  CI (lint, format, type-check, tests, builds)
```

## Tests

```bash
npm run check                                # repo root: lint, format, type-check, all unit tests
npm --prefix backend run test:integration    # API + PostgreSQL, needs a separate test database
```

638 automated tests (534 unit, 104 integration) plus a load test and device checks. CI runs the checks on every
pull request. Details and results: [docs/TESTING.md](docs/TESTING.md).

## Documentation

| Document                                             | Contents                                                   |
| ---------------------------------------------------- | ---------------------------------------------------------- |
| [docs/TECHNICAL_REPORT.md](docs/TECHNICAL_REPORT.md) | Report source: scope, functionality, testing, code quality |
| [docs/SCOPE_ALIGNMENT.md](docs/SCOPE_ALIGNMENT.md)   | Planned vs. built, requirement by requirement              |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)         | System design, endpoints, data model                       |
| [docs/SETUP.md](docs/SETUP.md)                       | Environment variables and troubleshooting                  |
| [docs/MOBILE.md](docs/MOBILE.md)                     | Building the Android app, push notifications               |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)             | Vercel, Render and Neon                                    |
| [docs/TESTING.md](docs/TESTING.md)                   | Test approach and results                                  |
| [docs/SMS_GATEWAY.md](docs/SMS_GATEWAY.md)           | Real SMS through an Android phone                          |
