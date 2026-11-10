# Umuriro Response

A web and Android app for reporting electricity faults and getting a technician to the door faster.
Built as a final-year capstone for **Ndera Sector, Gasabo District, Kigali**.

|                             |                                                          |
| --------------------------- | -------------------------------------------------------- |
| **Live app**                | https://capstone-project-six-inky.vercel.app             |
| **Live API (health check)** | https://capstone-project-as2y.onrender.com/api/health    |
| **Repository**              | https://github.com/Larissanoella-05/Capstone-project.git |
| **Walkthrough video**       |                                                          |
| **Technical report (PDF)**  |                                                          |

> The API runs on Render's free tier and falls asleep after about 15 minutes. If sign-in is slow, open the
> health-check link first and give it up to a minute to wake up.

**On this page:** [The idea](#the-idea) · [Quick start](#quick-start) · [Try it](#try-it) · [Tech stack](#tech-stack) ·
[Project layout](#project-layout) · [Tests](#tests) · [More documentation](#more-documentation)

## The idea

When the power goes out, most people in Rwanda phone the utility and describe the fault and where they live. The
technician then often has to call back to find the house. Nobody can see what is happening, and time is lost on
directions.

Umuriro Response puts every fault into one shared, location-based record:

**Customer reports a fault → Coordinator assigns a technician → Technician drives there and updates the status →
Customer follows along until it is resolved.**

In an emergency nobody has to sign up: the report page asks only for a phone number and a place. The
coordinator sees it at once and the reporter gets a text with a private link to follow progress. The texts go
out through an Android phone running a gateway app ([docs/SMS_GATEWAY.md](docs/SMS_GATEWAY.md)). They have been
sent to a real phone in a local run, but the deployed app only logs them for now.

Everyone reads and writes the same record, so a change by the technician shows up for the coordinator and the
customer within seconds. Statuses are `Reported → Assigned → On the Way → Arrived → Working → Resolved`, and each
change is time-stamped so response times can be measured.

| Role                    | What they do                                                                                                                    | Where        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| **Anyone, no account**  | Report a fault with a phone number, location and photo; get an SMS link to follow it                                            | Web          |
| **Customer**            | Create an account, sign in by email or phone, report a fault (with a photo), follow it on a map and timeline, get notifications | Web, Android |
| **Service Coordinator** | See all faults, filter them, assign the nearest free technician, watch the analytics                                            | Web only     |
| **Technician**          | See assigned jobs, navigate there, update the status, record the fix, share location                                            | Web, Android |

## Quick start

You need **Node.js 20+**, **PostgreSQL 14+** and **Git**. On Windows use **Git Bash** and keep the project outside
OneDrive. Other systems and the details are in [docs/SETUP.md](docs/SETUP.md).

```bash
# 1. Get the code and install
git clone https://github.com/Larissanoella-05/Capstone-project.git
cd Capstone-project
(cd backend && npm ci)
(cd frontend && npm ci)

# 2. Create a database
psql -U postgres -c "CREATE DATABASE umuriro;"

# 3. Configure
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# open backend/.env and set DATABASE_URL (your Postgres password) and JWT_SECRET (any long random string)

# 4. Create the tables and load sample data
cd backend
npx prisma migrate dev
npm run db:seed

# 5. Run the API (leave this terminal open)
npm run dev
```

In a second terminal:

```bash
cd frontend
npm run dev
```

Open http://localhost:5173. To check the API on its own, http://localhost:4000/api/health should say
`"database":"connected"`.

Every variable in the `.env` files is explained in [docs/SETUP.md](docs/SETUP.md#environment-variables).

## Try it

Set `VITE_DEMO_LOGIN=true` in `frontend/.env` to get a role picker on the sign-in page. All demo accounts use the
password `demo1234`:

| Role        | Email                |
| ----------- | -------------------- |
| Customer    | `aline@demo.rw`      |
| Technician  | `jeanclaude@demo.rw` |
| Coordinator | `grace@demo.rw`      |

A new customer can also create an account at `/register`; technicians and coordinators are seeded.

Tip: open three browser tabs, sign in as a different role in each, and watch one fault move through the whole
workflow.

**Android app:** it needs a development build (it cannot run in Expo Go). Full steps are in
[docs/MOBILE.md](docs/MOBILE.md).

## Tech stack

- **Web:** React 19, Vite, Tailwind CSS 4, React Router, Leaflet + OpenStreetMap, Recharts
- **API:** Node.js, Express 4, Zod validation, JWT + bcrypt
- **Database:** PostgreSQL with Prisma 6
- **Android:** Expo SDK 58 (React Native), Expo Router, MapLibre + OpenFreeMap, Firebase push
- **Hosting:** Vercel (web), Render (API), Neon (database), EAS Build (APK)

No paid map or SMS keys are needed to run any of it. Real texts need a phone with a SIM running a free gateway
app, set up in [docs/SMS_GATEWAY.md](docs/SMS_GATEWAY.md).

## Project layout

```text
backend/    Express API, Prisma schema and migrations, tests
frontend/   React web app for all three roles
mobile/     Android app (Expo) for customers and technicians
docs/       Architecture, testing, deployment and the rest of the documentation
```

The backend is split into `routes` (HTTP) → `services` (business logic, database) → `domain` (pure rules such as
the status machine). The folder-by-folder map, the API endpoints and the data model are in
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Tests

```bash
npm run check                           # from the repo root: lint, format, type-check and all unit tests
npm --prefix backend run test:integration   # API + PostgreSQL tests, need a separate test database
```

The integration tests wipe and reseed their database, so they refuse to run against your real one. How to set up
the test database, what is covered and the results are in [docs/TESTING.md](docs/TESTING.md). CI runs everything on
every pull request (`.github/workflows/ci.yml`).

## More documentation

| Document                                             | What is in it                                                        |
| ---------------------------------------------------- | -------------------------------------------------------------------- |
| [docs/SETUP.md](docs/SETUP.md)                       | Full setup, all environment variables, notes for Windows/macOS/Linux |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)         | How the system fits together, endpoints, data model                  |
| [docs/MOBILE.md](docs/MOBILE.md)                     | Building and running the Android app, push notifications             |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)             | Deploying to Vercel, Render and Neon                                 |
| [docs/TESTING.md](docs/TESTING.md)                   | Test method, commands and results                                    |
| [docs/SMS_GATEWAY.md](docs/SMS_GATEWAY.md)           | Sending real texts through an Android phone                          |
| [docs/SCOPE_ALIGNMENT.md](docs/SCOPE_ALIGNMENT.md)   | How the build matches the project scope                              |
| [docs/TECHNICAL_REPORT.md](docs/TECHNICAL_REPORT.md) | The technical report                                                 |
|                                                      |
