# Setup guide

The full version of the quick start in the [README](../README.md): what to install, every environment
variable, and notes for Windows, macOS and Linux.

## What you need

| Tool                                               | Version     | Check            |
| -------------------------------------------------- | ----------- | ---------------- |
| [Node.js](https://nodejs.org) (includes npm)       | 20 or newer | `node -v`        |
| [PostgreSQL](https://www.postgresql.org/download/) | 14 or newer | `psql --version` |
| [Git](https://git-scm.com)                         | any recent  | `git --version`  |

Node 20 is what CI uses; development was done on 22. PostgreSQL was tested on 16. The web app works in current
Chrome, Edge, Firefox and Safari. Customer and technician screens are designed for phones (from 360 px wide),
coordinator screens for a laptop. No paid keys are needed to run the web app locally.

## Notes for your operating system

Cloning is the same everywhere (`git clone`). The differences start after that.

|                                                                     | Windows                                          | macOS                                         | Linux                                    |
| ------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------- | ---------------------------------------- |
| Terminal                                                            | Use **Git Bash** for every command in these docs | Terminal                                      | Any shell                                |
| Install PostgreSQL                                                  | The installer from postgresql.org, or pgAdmin    | `brew install postgresql@16`, or Postgres.app | `sudo apt install postgresql` (or `dnf`) |
| Create the database                                                 | `psql -U postgres -c "CREATE DATABASE umuriro;"` | `createdb umuriro`                            | `sudo -u postgres createdb umuriro`      |
| Find your computer's LAN address (for a phone to reach a local API) | `ipconfig`                                       | `ipconfig getifaddr en0`                      | `ip a`                                   |

Things to watch for:

- **Windows:** keep the project **outside OneDrive**. OneDrive locks files inside `node_modules` and causes
  `EPERM` errors.
- **macOS and Linux:** a fresh PostgreSQL often has no `postgres` password. If so, your `DATABASE_URL` can leave
  it out: `postgresql://YOUR_USER@localhost:5432/umuriro?schema=public`.
- **PowerShell or cmd:** the commands here are written for a POSIX shell. If you must use PowerShell, replace
  `cp a b` with `Copy-Item a b`, and set a variable on its own line (`$env:DATABASE_URL = "..."`) instead of
  putting it in front of a command. Git Bash is simpler.

## Environment variables

Copy the templates first:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

The `.env` files hold secrets and are ignored by Git. Only the `.env.example` templates are committed.

### `backend/.env`

| Variable                | What it is for                                                                | Example                                                                    |
| ----------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `DATABASE_URL`          | PostgreSQL connection                                                         | `postgresql://postgres:YOUR_PASSWORD@localhost:5432/umuriro?schema=public` |
| `PORT`                  | API port                                                                      | `4000`                                                                     |
| `JWT_SECRET`            | Signs login tokens: any long random string                                    |                                                                            |
| `JWT_EXPIRES_IN`        | Web session length                                                            | `12h`                                                                      |
| `JWT_EXPIRES_IN_MOBILE` | Android app session length (the app sends `client: "mobile"` when signing in) | `30d`                                                                      |
| `EXPO_ACCESS_TOKEN`     | Optional. Only if "enhanced push security" is on in your Expo account         |                                                                            |
| `CORS_ORIGIN`           | Frontend address allowed to call the API (no trailing slash)                  | `http://localhost:5173`                                                    |

### `frontend/.env`

| Variable          | What it is for                                                                                                     | Example                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------- |
| `VITE_API_URL`    | API address, without `/api` and without a trailing slash                                                           | `http://localhost:4000` |
| `VITE_DEMO_LOGIN` | `true` shows the demo role picker and a prefilled password on the sign-in page. Leave it unset for a real release. | `true`                  |

Tip: with `VITE_DEMO_LOGIN` on, open three browser tabs and sign in with a different role in each to watch the
workflow update live.

## Database

```bash
cd backend
npx prisma migrate dev   # applies the migrations in backend/prisma/migrations/
npm run db:seed          # loads the Ndera sample customers, technicians and faults
```

Running `db:seed` again resets the data.

## Useful commands

From `backend/`:

| Command                    | What it does                                          |
| -------------------------- | ----------------------------------------------------- |
| `npm run dev`              | Start the API, restarting on file changes             |
| `npm run db:seed`          | Reset the sample data                                 |
| `npx prisma studio`        | Browse the database tables in the browser             |
| `npm test`                 | Unit tests (no database needed)                       |
| `npm run test:integration` | API + database tests, see [TESTING.md](TESTING.md)    |
| `npm run test:perf`        | Load test of the read endpoints against a running API |

From the repo root, `npm run check` runs lint, format check, type-check and all unit tests together.

## Something not working?

- **`EPERM` during `npm ci` on Windows:** the project is probably inside OneDrive. Move it.
- **Browser says "blocked by CORS policy":** `CORS_ORIGIN` must match the site's origin exactly, with no path and
  no trailing slash.
- **Sign-in fails right after starting:** open `http://localhost:4000/api/health`. It should show
  `"database":"connected"`. If not, check `DATABASE_URL` and that PostgreSQL is running.
