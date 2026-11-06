# Deployment

| Part     | Platform                 | Address                                      |
| -------- | ------------------------ | -------------------------------------------- |
| Frontend | Vercel                   | https://capstone-project-six-inky.vercel.app |
| Backend  | Render (web service)     | https://capstone-project-as2y.onrender.com   |
| Database | Neon (hosted PostgreSQL) | Private, reached only by the backend         |

## Steps

1. **Neon:** create a project and copy the connection string (ends in `?sslmode=require`). Use the direct
   connection, not the pooled one, so Prisma migrations run reliably.
2. **Render:** new Web Service from the GitHub repo.
   - Root directory `backend`, build `npm install && npx prisma migrate deploy`, start `npm start`
   - Health check path `/api/health`
   - Environment variables from the table below
3. **Sample data:** run `npm run db:seed` once, from a computer with `DATABASE_URL` set to the Neon string.
4. **Vercel:** import the repo with root directory `frontend`, framework Vite, and `VITE_API_URL` set to the Render
   address. `frontend/vercel.json` sends every path to `index.html`, so page refreshes work.
5. **Connect:** set `CORS_ORIGIN` on Render to the Vercel address. Origin only: `https://` plus the domain, no
   `/login`, no trailing slash. Several can be listed, separated by commas.

## Environment variables

| Platform | Variable                                                      | Value                                                                    |
| -------- | ------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Render   | `DATABASE_URL`                                                | Neon connection string (secret)                                          |
| Render   | `JWT_SECRET`                                                  | Long random string, e.g. `openssl rand -hex 32` (secret)                 |
| Render   | `JWT_EXPIRES_IN`                                              | `12h`                                                                    |
| Render   | `JWT_EXPIRES_IN_MOBILE`                                       | `30d` (optional, this is the default)                                    |
| Render   | `EXPO_ACCESS_TOKEN`                                           | Optional, only if Expo "enhanced push security" is on (secret)           |
| Render   | `CORS_ORIGIN`                                                 | `https://capstone-project-six-inky.vercel.app`                           |
| Render   | `NODE_ENV`                                                    | `production`                                                             |
| Render   | `PUBLIC_WEB_URL`                                              | `https://capstone-project-six-inky.vercel.app` (the link in guest texts) |
| Render   | `SMS_PROVIDER`                                                | `log` (default) or `smsgate`, see [SMS_GATEWAY.md](SMS_GATEWAY.md)       |
| Render   | `SMS_GATEWAY_URL`, `SMS_GATEWAY_USER`, `SMS_GATEWAY_PASSWORD` | Only with `smsgate`; user and password are secret                        |
| Vercel   | `VITE_API_URL`                                                | `https://capstone-project-as2y.onrender.com`                             |
| Vercel   | `VITE_DEMO_LOGIN`                                             | `true` for the demo role picker; remove for a real release               |

Render sets `PORT` itself. Secrets live only in the platforms' settings and never get a `VITE_` prefix, because Vite
copies `VITE_` variables into the browser code. HTTPS is automatic on Vercel and Render, and Neon requires it.

## Releasing a change that adds a migration

The build command runs `npx prisma migrate deploy`, so Render applies new migrations when it builds the merged
code. Guest reports (migration `20261106090000_guest_fault_reports`) were the first release to depend on this.

1. **Restore point:** in the Neon console, create a branch of the production database (or note the point-in-time
   restore window).
2. **Settings first:** set any new variables on Render before merging. For guest reports that is `PUBLIC_WEB_URL`;
   without it, the link in each text starts with `http://localhost:5173`.
3. **Merge,** then wait for Render to show the deploy as live. The first request after a build can be slow.
4. **Check the API:**
   ```bash
   API=https://capstone-project-as2y.onrender.com
   curl -s $API/api/health
   # the public route exists: a bad phone number must give 400, and creates no data
   curl -s -X POST $API/api/public/faults -H "Content-Type: application/json"      -d '{"category":"POWER_OUTAGE","phone":"12345","placeText":"test"}'
   # a wrong tracking link must give 404
   curl -s -o /dev/null -w "%{http_code}
   ```

" $API/api/public/faults/not-a-real-token

```
5. **Check the site on a phone:** open `/report`, send one report with your own number, follow the tracking link,
and look at it as the coordinator.
6. **Roll back if needed:** redeploy the previous commit on Render. Migrations here only add things, so the old
code keeps working against the new database.

Guest reports also need a check that `app.set('trust proxy', 1)` in `backend/src/app.js` matches the number of
proxies in front of the app on Render. If it does not, the limit of 30 reports per network per hour counts the
proxy instead of the visitor. This is not yet confirmed against Render's documentation. The limit of 3 reports
per phone per hour is not affected.

## After deploying, check

- [ ] `/api/health` returns `ok` and `connected`
- [ ] All three demo accounts can sign in
- [ ] The full workflow works, from report to resolved
- [ ] Refreshing `/customer/reports` does not show a 404
- [ ] `/report` opens without signing in, and a report sent from it appears for the coordinator
- [ ] The link on the confirmation page opens the tracking page
- [ ] With `smsgate` set, the text arrives on the phone that reported (see [SMS_GATEWAY.md](SMS_GATEWAY.md))

## Problems we hit

| Problem                           | Cause                                  | Fix                                               |
| --------------------------------- | -------------------------------------- | ------------------------------------------------- |
| "Blocked by CORS policy"          | `CORS_ORIGIN` did not match the origin | Use the bare production domain                    |
| Vercel warning about a public key | `VITE_API_URL` was marked secret       | It is public by design; save it as a normal value |
| First request is slow             | Render's free tier sleeps when idle    | Open `/api/health` first                          |

The Android app is built separately, see [MOBILE.md](MOBILE.md).
```
