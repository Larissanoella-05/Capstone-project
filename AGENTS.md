# Umuriro Response: agent instructions

Electricity fault reporting for Ndera Sector, Kigali. A customer reports a fault, a coordinator assigns a
technician, the technician resolves it, the customer tracks it. Read `docs/ARCHITECTURE.md` before any
non-trivial work, and `mobile/AGENTS.md` before touching `mobile/`.

## Workflow (mandatory)

1. **Plan before implementing.** For anything beyond a one-line fix, reply with a plan first: the files to
   change, the approach, the tests to add or change, and the risks. Wait for the user's approval before
   editing. For features and refactors use the `rpi-plan` skill. A plan that is long enough to need
   revisiting goes in `docs/plans/<yyyy-mm-dd>-<slug>.md`. Otherwise keep it in the conversation.
2. **Read before writing.** Open the neighbouring files and copy their patterns. Do not introduce a second way
   of doing something the codebase already does.
3. **Tests come with the change.** New behaviour gets a test. A bug fix starts with a failing test.
4. **Verify before saying "done".** Run `npm run check` from the repo root (lint, format check, type-check,
   all unit tests) and report the real output. Say plainly what failed or what you could not run (for
   example the backend integration tests, which need `TEST_DATABASE_URL`).
5. **The user owns PRs and merges.** Work on a feature branch, never push to `main`, never merge. Commit
   only when asked. Use Conventional Commits (`feat:`, `fix:`, `build:`, `ci:`, `docs:`, `style:`, `test:`).

## Feedback loop (backpressure)

| Command (repo root)                         | What it enforces                                            |
| ------------------------------------------- | ----------------------------------------------------------- |
| `npm run lint`                              | ESLint, zero warnings allowed                               |
| `npm run format:check` / `format`           | Prettier (`.prettierrc.json`)                               |
| `npm run typecheck`                         | `tsc --checkJs` on `backend/` (see `backend/jsconfig.json`) |
| `npm test`                                  | Backend unit + frontend + mobile tests                      |
| `npm --prefix backend run test:integration` | API + PostgreSQL tests (needs `TEST_DATABASE_URL`)          |
| `npm run check`                             | Lint, format, type-check and tests together                 |

- A hook in `.claude/` formats and lints every file you edit and feeds the errors back to you. Fix them
  immediately, do not move on with a red file.
- A pre-commit hook (husky + lint-staged) lints and formats staged files.
- CI (`.github/workflows/ci.yml`) runs all of the above on every pull request. The `ci-ok` job is the one
  required check.
- Never disable a lint rule, add `@ts-ignore`, skip a test or loosen a config to get green. Fix the cause, or
  stop and ask. A `@ts-expect-error` with a reason is acceptable in a test that breaks a rule on purpose.

## Layout

- `backend/`: Express 4 + Prisma 6 + PostgreSQL, ESM, plain JavaScript checked with JSDoc types
- `frontend/`: React 19 + Vite + Tailwind 4 web app for all three roles (coordinators use it only here)
- `mobile/`: Expo SDK 58 Android app for customers and technicians, plain JavaScript, Expo Router in `mobile/app/`
- `docs/`: `ARCHITECTURE.md`, `TESTING.md`, `SCOPE_ALIGNMENT.md`

Each package has its own `package-lock.json`. Install with `npm ci` inside the package. The root only holds
the shared tooling (ESLint, Prettier, husky).

## Backend patterns

- Layers: `routes/` (HTTP only, auth + validation + call a service) → `services/` (business logic and Prisma)
  → `domain/` (pure logic, no I/O). Keep the direction one-way.
- Every request body is validated by a Zod schema in `validators/` through `middleware/validate.js`.
- Throw the helpers in `utils/httpError.js` (`badRequest`, `notFound`, `conflict`, ...). `middleware/error.js`
  formats every error as `{ error: { message, details } }`. Do not build error responses by hand.
- Wrap async route handlers in `asyncHandler`.
- Role checks use `requireAuth` then `requireRole(...)`. The signed-in user is on `req.user`, with its
  `customer` / `technician` / `coordinator` profile loaded.
- Status changes go through `domain/FaultStatusMachine.js`. Never write a fault's `status` directly.
- Fault updates use `guardedUpdate` in `faultService.js` (optimistic concurrency, a stale update returns 409).
  Keep every state-changing write behind it.
- A notification row is written in the same database transaction as the change it describes.
  Push notifications are sent after the transaction and must never throw to the caller.
- Config comes from `config/env.js`, never `process.env` in feature code.
- Schema changes: edit `prisma/schema.prisma`, run `npx prisma migrate dev --name <what>`, commit the migration.
  Never edit a migration that has been applied.
- New Prisma `include`/`select` objects that are shared are marked `/** @satisfies {Prisma.XInclude} */` so
  their literal types survive.
- The integration tests refuse to run if `TEST_DATABASE_URL` equals `DATABASE_URL`. Never weaken that guard,
  and never point tests at a real database.

## Frontend patterns

- All HTTP goes through `src/lib/api.js`. Components get data with `useApi(path, { interval })`, which polls.
  Do not call `fetch` in a component.
- Role areas are guarded in `App.jsx` with `RequireRole`. Customer and technician pages render inside
  `MobileShell`, coordinator pages inside `CoordinatorShell`.
- Memoise derived arrays or objects that are used as `useMemo` / `useEffect` dependencies.
- Pure helpers live in `src/lib/` and are the only frontend code with unit tests. Put new logic there when you
  can, so it can be tested. `sharedWithMobile.test.js` keeps behaviour in step with the mobile app.
- Styling is Tailwind with the project's design tokens in `src/index.css`.

## Mobile patterns

See `mobile/AGENTS.md`. In short: Expo Router file routes in `mobile/app/`, everything else in `mobile/src/`,
add packages with `npx expo install`, and check the SDK 58 docs before using any Expo API.

## Don'ts

- Add no new dependency without saying why in the plan.
- Never commit `.env`, `google-services.json` or any secret. `.env.example` files are the contract.
- Do not edit generated or applied files: migrations that have run, `package-lock.json` by hand, `android/`, `ios/`.
- Do not reformat code you are not changing. Formatting is enforced by Prettier, not by hand.
- These are documented scope decisions, so do not "fix" them unprompted: photos stored as data URLs,
  simulated technician positions on web, polling instead of WebSockets, no SMS.
