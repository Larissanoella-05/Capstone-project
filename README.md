# Umuriro Response

**A Location-Based Web System for Improving Electricity Fault Reporting and Technician Response Services Delivery in Rwanda**

Final-year full-stack capstone project · Pilot area: Ndera Sector, Gasabo District, Kigali

| | |
|---|---|
| **GitHub repository** | https://github.com/Larissanoella-05/Capstone-project.git|
| **Live application** | https://capstone-project-six-inky.vercel.app |
| **Live API (health check)** | https://capstone-project-as2y.onrender.com/api/health |


> The API runs on Render's free tier, which sleeps after about 15 minutes without traffic. If the live app is slow to sign in, open the health-check link first and wait up to a minute for it to answer.

---

## 1. Description

### The problem

When the electricity fails at a home in Rwanda, the customer usually phones the utility and describes the fault and the location verbally. The technician sent out often has to call the customer again to find the premises. Reports are hard to track, response time is lost on directions, and the customer cannot see what is happening with their fault.

### The solution

Umuriro Response is a responsive web application that replaces that chain of phone calls with one shared, location-based record of each fault:

**Customer reports a fault → the fault is linked to the customer's registered service location → the Service Coordinator receives it → the Coordinator assigns a technician → the Technician sees the job and navigates to the location → the Technician updates the status → the Customer tracks the progress → the Technician records the resolution.**

All three roles read and write the same record through one API and one database, so a status change made by the technician is visible to the coordinator and the customer within seconds.

### User roles

| Role | Main tasks |
|---|---|
| **Customer** | Report a fault, follow its progress on a map and timeline, receive notifications |
| **Service Coordinator** | See all faults, search and filter them, assign the nearest available technician, monitor progress |
| **Technician** | See assigned jobs, navigate to the service location, update the status, record the resolution |

### Fault statuses

`Reported → Assigned → On the Way → Arrived → Working → Resolved`

Every status change is time-stamped and stored, which makes it possible to measure response times (report to assignment, assignment to arrival, time on site).



## 2. Technology stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 19, Vite 8 | User interface and development/build tool |
| | Tailwind CSS 4 | Styling, using the design system colours and fonts |
| | React Router 7 | Navigation between screens and role-based access |
| | Lucide React | Icons |
| | Leaflet + OpenStreetMap | Maps (no API key or billing needed) |
| | Recharts | Charts on the analytics page |
| Backend | Node.js, Express 4 | REST API |
| | Zod | Request validation |
| | JSON Web Tokens, bcryptjs | Login tokens and password hashing |
| Database | PostgreSQL | Relational database |
| | Prisma 6 | Schema, migrations and database queries |
| Tools | Git, GitHub, VS Code, npm | Version control and development |



## 4. Setting up the environment and the project

### Prerequisites

Install these first and check the versions:

| Tool | Version | Check |
|---|---|---|
| [Node.js](https://nodejs.org) (includes npm) | 20 or newer | `node -v` |
| [PostgreSQL](https://www.postgresql.org/download/) | 14 or newer | `psql --version` |
| [Git](https://git-scm.com) | any recent | `git --version` |
| [VS Code](https://code.visualstudio.com) | recommended | |

On Windows, run the commands below in **Git Bash**. Keep the project **outside OneDrive**: OneDrive locks files inside `node_modules` and causes `EPERM` errors.

### Step 1: Clone the repository

```bash
git clone https://github.com/Larissanoella-05/Capstone-project.git
cd capstone-project
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

| Variable | Purpose | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://postgres:YOUR_PASSWORD@localhost:5432/umuriro?schema=public` |
| `PORT` | API port | `4000` |
| `JWT_SECRET` | Signs login tokens: any long random string | |
| `JWT_EXPIRES_IN` | Session length | `12h` |
| `CORS_ORIGIN` | Frontend address allowed to call the API (no trailing slash) | `http://localhost:5173` |

`frontend/.env`:

| Variable | Purpose | Example |
|---|---|---|
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

| Command | What it does |
|---|---|
| `npm run dev` | Start the API, restarting on file changes |
| `npm run db:seed` | Reset the sample data |
| `npx prisma studio` | Browse the database tables in the browser |

### Project structure

```text
├── backend/
│   ├── prisma/          schema.prisma, migrations/, seed.js
│   └── src/
│       ├── config/      environment variables
│       ├── lib/         shared Prisma client
│       ├── middleware/  login check, roles, validation, errors
│       ├── routes/      API endpoints
│       ├── services/    business rules and database access
│       └── utils/       constants, distance calculation
├── frontend/
│   └── src/
│       ├── components/  layouts, map, status pills, loading/error states
│       ├── context/     signed-in user, messages
│       ├── hooks/       data loading and live refresh
│       ├── lib/         API client, labels and formatting
│       └── pages/       customer/, technician/, coordinator/, Login
└── 
```

### Main API endpoints

| Method | Endpoint | Used by |
|---|---|---|
| POST | `/api/auth/login` | All |
| GET | `/api/faults` · `/api/faults/:id` | All (each role sees only what it may) |
| POST | `/api/faults` | Customer: report a fault |
| POST | `/api/faults/:id/assign` | Coordinator: assign a technician |
| PATCH | `/api/faults/:id/status` | Technician: next stage · Coordinator: cancel |
| GET | `/api/technicians?faultId=` | Coordinator: technicians sorted by distance |
| POST | `/api/technicians/me/location` | Technician: update position |
| GET | `/api/notifications` | Customer, Technician |

---

## 5. Deployment plan

The application is deployed and publicly reachable:

| Part | Platform | Address |
|---|---|---|
| Frontend | **Vercel** | https://capstone-project-six-inky.vercel.app |
| Backend | **Render** (web service) | https://capstone-project-as2y.onrender.com |
| Database | **Neon** (hosted PostgreSQL) | Private; reached only by the backend |

| Part | What the platform does |
|---|---|
| Frontend | Builds `frontend/` with `npm run build` and serves `dist/` over HTTPS from a global CDN |
| Backend | Runs `backend/` with `npm start`; checks `/api/health` to confirm the API and database are up |
| Database | Managed PostgreSQL with encrypted (TLS) connections |



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

| Platform | Variable | Value |
|---|---|---|
| Render | `DATABASE_URL` | Neon connection string (secret) |
| Render | `JWT_SECRET` | Long random string, for example from `openssl rand -hex 32` (secret) |
| Render | `JWT_EXPIRES_IN` | `12h` |
| Render | `CORS_ORIGIN` | `https://capstone-project-six-inky.vercel.app` |
| Render | `NODE_ENV` | `production` |
| Vercel | `VITE_API_URL` | `https://capstone-project-as2y.onrender.com` |

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

| Problem | Cause | Fix |
|---|---|---|
| Browser error "blocked by CORS policy" | `CORS_ORIGIN` did not exactly match the site's origin | Use the production domain, without `/login` or a trailing slash |
| Vercel warning about a public prefix | `VITE_API_URL` was marked as a secret | It is a public address by design; saved as a normal (non-secret) variable |
| First request is slow | Render's free tier sleeps when idle | Open `/api/health` first; a paid instance would stay awake |

---

