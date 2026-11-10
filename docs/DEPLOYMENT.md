# Deployment

| Part     | Platform                     | Address                                      |
| -------- | ---------------------------- | -------------------------------------------- |
| Frontend | **Vercel**                   | https://capstone-project-six-inky.vercel.app |
| Backend  | **Render** (web service)     | https://capstone-project-as2y.onrender.com   |
| Database | **Neon** (hosted PostgreSQL) | Private; reached only by the backend         |

## Steps

1. **Database (Neon):** create a project and copy the direct (not pooled) connection string, which ends in
   `?sslmode=require`.
2. **Backend (Render):** new Web Service from the repository.
   Root `backend`, build `npm install && npx prisma migrate deploy`, start `npm start`, health check
   `/api/health`.
3. **Sample data:** run `npm run db:seed` once with `DATABASE_URL` set to the Neon string.
4. **Frontend (Vercel):** import the repository. Root `frontend`, framework Vite, `VITE_API_URL` = the Render
   address. `vercel.json` rewrites every path to `index.html`.
5. **Connect:** set `CORS_ORIGIN` on Render to the Vercel origin (no page path, no trailing slash; several
   origins can be comma-separated).

## Production variables

| Platform | Variable                                  | Value                                                    |
| -------- | ----------------------------------------- | -------------------------------------------------------- |
| Render   | `DATABASE_URL`                            | Neon connection string (secret)                          |
| Render   | `JWT_SECRET`                              | Long random string, e.g. `openssl rand -hex 32` (secret) |
| Render   | `JWT_EXPIRES_IN`, `JWT_EXPIRES_IN_MOBILE` | `12h`, `30d`                                             |
| Render   | `CORS_ORIGIN`                             | `https://capstone-project-six-inky.vercel.app`           |
| Render   | `NODE_ENV`                                | `production`                                             |
| Vercel   | `VITE_API_URL`                            | `https://capstone-project-as2y.onrender.com`             |
| Vercel   | `VITE_DEMO_LOGIN`                         | `true` for the demo role picker; remove for a release    |

Render sets `PORT`. Secrets live only in each platform's settings and never get a `VITE_` prefix (Vite ships
those to the browser). HTTPS is provided by Vercel and Render; Neon requires encrypted connections.

## Check after deploying

- `/api/health` returns `ok` and `connected`
- All three demo accounts sign in
- The full workflow runs: report → assign → on the way → arrived → working → resolved
- Refreshing `/customer/reports` does not 404

The Android app is built separately, see [MOBILE.md](MOBILE.md).
