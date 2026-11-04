# Deployment

The app is live and publicly reachable:

| Part     | Platform                     | Address                                      |
| -------- | ---------------------------- | -------------------------------------------- |
| Frontend | **Vercel**                   | https://capstone-project-six-inky.vercel.app |
| Backend  | **Render** (web service)     | https://capstone-project-as2y.onrender.com   |
| Database | **Neon** (hosted PostgreSQL) | Private; reached only by the backend         |

Vercel builds `frontend/` with `npm run build` and serves `dist/` over HTTPS. Render runs `backend/` with
`npm start` and checks `/api/health` to confirm the API and database are up. Neon is managed PostgreSQL with
encrypted connections.

## Steps

1. **Database (Neon):** create a project and copy its connection string (it ends in `?sslmode=require`). Use the
   direct connection, not the pooled one, so Prisma migrations run reliably.
2. **Backend (Render):** new Web Service from the GitHub repository.
   - Root directory: `backend`
   - Build command: `npm install && npx prisma migrate deploy`
   - Start command: `npm start`
   - Health check path: `/api/health`
   - Environment variables: see the table below.
3. **Sample data:** run `npm run db:seed` once from a computer with `DATABASE_URL` set to the Neon connection
   string.
4. **Frontend (Vercel):** import the repository.
   - Root directory: `frontend`
   - Framework: Vite
   - Environment variable: `VITE_API_URL` = the Render address
   - `frontend/vercel.json` sends every path to `index.html`, so refreshing a page works.
5. **Connect them:** set `CORS_ORIGIN` on Render to the Vercel address. It must be the origin only: `https://`
   plus the domain, with no page path such as `/login` and no trailing slash. Several addresses can be listed,
   separated by commas.

## Production environment variables

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
| Vercel   | `VITE_DEMO_LOGIN`       | `true` (demo role picker; remove for a real release)                 |

Render sets `PORT` itself. Secrets live only on Render and never get a `VITE_` prefix, because Vite copies
`VITE_` variables into the code sent to the browser.

## Security notes

- Secrets live only in each platform's settings, never in the repository.
- Vercel and Render provide and renew HTTPS certificates; Neon requires an encrypted connection.
- The frontend reads the API address from `VITE_API_URL` at build time. The API accepts browser requests only
  from the origins in `CORS_ORIGIN`.
- `prisma migrate deploy` applies committed migrations without resetting data.

## After deploying, check

- [ ] `/api/health` on Render returns `ok` and `connected`
- [ ] All three demo accounts can sign in
- [ ] The full workflow works: report → assign → on the way → arrived → working → resolved
- [ ] Refreshing a page such as `/customer/reports` does not show a 404

## Problems we hit

| Problem                                | Cause                                                 | Fix                                                                       |
| -------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------- |
| Browser error "blocked by CORS policy" | `CORS_ORIGIN` did not exactly match the site's origin | Use the production domain, without `/login` or a trailing slash           |
| Vercel warning about a public prefix   | `VITE_API_URL` was marked as a secret                 | It is a public address by design; saved as a normal (non-secret) variable |
| First request is slow                  | Render's free tier sleeps when idle                   | Open `/api/health` first; a paid instance would stay awake                |

The Android app is built separately with EAS, see [MOBILE.md](MOBILE.md).
