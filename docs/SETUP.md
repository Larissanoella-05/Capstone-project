# Setup

Extends the [README](../README.md) installation. Needs Node.js 20+, PostgreSQL 14+ and Git.

## Operating system

|                     | Windows                                          | macOS                        | Linux                               |
| ------------------- | ------------------------------------------------ | ---------------------------- | ----------------------------------- |
| Terminal            | **Git Bash** (not PowerShell)                    | Terminal                     | Any shell                           |
| Install PostgreSQL  | Installer from postgresql.org                    | `brew install postgresql@16` | `sudo apt install postgresql`       |
| Create the database | `psql -U postgres -c "CREATE DATABASE umuriro;"` | `createdb umuriro`           | `sudo -u postgres createdb umuriro` |
| Your LAN address    | `ipconfig`                                       | `ipconfig getifaddr en0`     | `ip a`                              |

On Windows keep the project outside OneDrive (it causes `EPERM` errors). On macOS and Linux a fresh PostgreSQL
often has no password, so `DATABASE_URL` can be `postgresql://YOUR_USER@localhost:5432/umuriro?schema=public`.

## Environment variables

Copy each `.env.example` to `.env`. The `.env` files are never committed.

**`backend/.env`**

| Variable                | Purpose                                                  | Example                                                                    |
| ----------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------- |
| `DATABASE_URL`          | PostgreSQL connection                                    | `postgresql://postgres:YOUR_PASSWORD@localhost:5432/umuriro?schema=public` |
| `PORT`                  | API port                                                 | `4000`                                                                     |
| `JWT_SECRET`            | Signs login tokens: any long random string               |                                                                            |
| `JWT_EXPIRES_IN`        | Web session length                                       | `12h`                                                                      |
| `JWT_EXPIRES_IN_MOBILE` | Android session length                                   | `30d`                                                                      |
| `CORS_ORIGIN`           | Frontend origin allowed to call the API, no trailing `/` | `http://localhost:5173`                                                    |
| `EXPO_ACCESS_TOKEN`     | Optional: only if Expo "enhanced push security" is on    |                                                                            |

SMS variables are in [SMS_GATEWAY.md](SMS_GATEWAY.md).

**`frontend/.env`**

| Variable          | Purpose                                                       | Example                 |
| ----------------- | ------------------------------------------------------------- | ----------------------- |
| `VITE_API_URL`    | API address, without `/api` or a trailing slash               | `http://localhost:4000` |
| `VITE_DEMO_LOGIN` | `true` shows the demo role picker. Leave unset for a release. | `true`                  |

## Commands

| Command                             | Does                                     |
| ----------------------------------- | ---------------------------------------- |
| `npm run dev` (in `backend/`)       | Start the API, restarting on changes     |
| `npm run db:seed` (in `backend/`)   | Reset the sample data                    |
| `npx prisma studio` (in `backend/`) | Browse the tables                        |
| `npm run check` (repo root)         | Lint, format, type-check, all unit tests |

## If something fails

- **"Blocked by CORS policy":** `CORS_ORIGIN` must match the site's origin exactly, with no path or trailing slash.
- **Sign-in fails:** open http://localhost:4000/api/health. If it does not say `"database":"connected"`, check
  `DATABASE_URL` and that PostgreSQL is running.
