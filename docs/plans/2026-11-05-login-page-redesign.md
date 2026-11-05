---
date: 2026-11-05T08:19:37+00:00
git_commit: b8a8cf276c9595fac44e49bf24f02ad637e39f96
branch: main
topic: 'Redesign the web login page as a split screen'
tags: [plan, frontend, login, design]
status: draft
---

# PLAN: Redesign the web login page as a split screen

Restyle `/login` to match the "Coordinator sign in" design artifact (https://claude.ai/artifact/VRwS9W1HpycQEFuVFU28BK): the lineworker photo on the left, a white sign-in card on the right. The page stays shared by all three roles and sign-in behaves as today. The Android login screen is not part of this plan.

## Acceptance Criteria

- `/login` shows a split screen. The left panel is the lineworker photo with the Umuriro logo and the tagline "Assign technicians and keep every fault moving.". The right panel is a white sign-in card.
- The card holds, top to bottom: the "Sign in" heading and subtext, the demo role picker (only when `VITE_DEMO_LOGIN=true`), Email, Password with a Show/Hide toggle, the Sign in button, the "Need access?" footer and a "← Back to Umuriro" link to `/`.
- Sign-in behaves exactly as today: the same validation messages, the `FormError` for server errors, the role-home redirect, and the return to the page the user was heading to.
- There is no "Remember me", no "Forgot password?" and no Pilot area. The PilotBanner stays above the page.
- Below `lg` the layout stacks with the photo as a short strip on top. There is no horizontal scroll at phone width and touch targets are at least 44px.
- Every control is keyboard reachable with a visible focus ring, and the Show/Hide button reports its state to screen readers.
- `npm run check` passes and the page works in a real browser at desktop and phone widths.

## Technical Key Decisions and Tradeoffs

1. **Scope:** one shared page for all three roles, web only.
   - Why: the artifact is a web layout and the web page serves every role.
   - Impact: only `frontend/` changes. `mobile/app/login.js` is untouched.
2. **Styling:** the artifact's layout and dark mood, built from the app's tokens (`.field`, `btn btn-accent`, `Field`, the `#e30613` accent, 4px radius).
   - Why: one set of styles and one accent colour across the app.
   - Impact: one new token, `--color-night: #151111`. The card and inputs are 4px, not the artifact's 8px and 6px.
3. **Removed elements:** Remember me, Forgot password and the Pilot area.
   - Why: there is no backend for the first two, and the token is per tab by design (`frontend/src/lib/api.js:6`). The Pilot area was removed at the user's request.
   - Impact: `PilotArea` and `Backdrop` are no longer used on this page.
4. **Photo:** reuse `/landing/silhouette.jpg`, the same file the landing hero uses.
   - Why: no new asset and no new dependency.
   - Impact: none beyond an `<img>` in `Login.jsx`.
5. **Show/Hide toggle placement:** a button inside the input wrapper, not in the `Field` label.
   - Why: `Field` puts `hint` inside the `<label>`, and a button inside a label is invalid interactive nesting.
   - Impact: `Field.jsx` is not changed.
6. **Copy:** role-neutral, with the artifact's "administrator" footer kept.
   - Why: the artifact's copy is coordinator-only, and there is no self-registration flow.
   - Impact: heading "Sign in", button "Sign in" ("Signing in…" while busy).
7. **Tests:** no new unit test.
   - Why: there is no new logic for `frontend/src/lib/`, which is the only frontend code with unit tests. The toggle is local UI state.
   - Impact: verification is `npm run check`, a production build and a browser pass.

## Current State

```
/login  (frontend/src/pages/Login.jsx, routed at App.jsx:100)

┌ PilotBanner ──────────────────────────────────────────┐
│  lg: two columns            phone: one column         │
│  ┌─ left ───────────────┐  ┌─ right ───────────────┐  │
│  │ ⚡ Umuriro            │  │ [DEMO] role picker    │  │
│  │ ELECTRICITY FAULT…   │  │ Email                 │  │
│  │ "Report a fault and  │  │ Password              │  │
│  │  follow the response"│  │ [Sign in]             │  │
│  │ Pilot area card      │  └───────────────────────┘  │
│  └──────────────────────┘     paper background + art  │
└───────────────────────────────────────────────────────┘
```

- `Login.jsx` holds the role list, the email and password state, the validation and the submit handler (`onSubmit`, lines 66-88). Signed-in users are redirected by `<Navigate>` (line 56).
- `Field` (`components/Field.jsx`) renders the label, the control and the error or help line with ids for `aria-describedby`.
- `.field`, `.btn`, `.btn-accent` and `.btn-lg` come from `index.css`.

## Desired End State

```
┌ PilotBanner (unchanged) ──────────────────────────────┐
├─ photo (silhouette, fades to #151111) ─┬─ white card ─┤
│ ⚡ Umuriro                              │ Sign in      │
│                                        │ Use the acc… │
│                                        │ [DEMO picker]│
│ "Assign technicians and keep           │ Email        │
│  every fault moving."                  │ Password Show│
│                                        │ [Sign in]    │
│          dark page (night)             │ Need access? │
│                                        │ ← Back       │
└────────────────────────────────────────┴──────────────┘

below lg:
┌ PilotBanner ┐
│ photo strip │  logo + tagline over the photo
├─────────────┤
│ white card  │
└─────────────┘
```

## Abstractions and Code Reuse

- `frontend`
  - `src/index.css` - add `--color-night: #151111` to `@theme` (gives `bg-night`).
  - `src/pages/Login.jsx` - restructure the markup only.
    - `Login` - new layout, `showPassword` state, the toggle button, the footer and the back link. `chooseRole`, `onSubmit` and the validation stay as they are.
    - `PilotArea` - deleted, along with the `Backdrop` import.
  - Reused unchanged: `Field`, `FormError`, `LogoMark`, `PilotBanner`, `useAuth`, `isDemoLogin`, `.field`, `.btn`.
  - `public/landing/silhouette.jpg` - reused as the left panel photo.

## Logging & Observability

None. The page has no logging today and gains none.

## Implementation

### Phase 1: Split-screen sign-in on desktop

Dependencies: None

Deliver the new layout at `lg` and wider, with sign-in working end to end.

**Tasks**:

- [x] `frontend/src/index.css`: add `--color-night: #151111;` to the `@theme` block.
- [x] `Login.jsx`: delete `PilotArea` and the `Backdrop` import. Keep `PilotBanner`.
- [x] `Login.jsx`: make the root `bg-night`, with the PilotBanner on top and a `lg:grid-cols-2` grid filling the rest.
- [x] `Login.jsx`: build the left panel. It has an `<img src="/landing/silhouette.jpg">` with descriptive `alt` text, covering the panel with `object-cover`, and an `aria-hidden` shade that fades into the page colour. It carries a `Link` to `/` with `LogoMark` and the white wordmark, and the tagline "Assign technicians and keep every fault moving." as a `<p>`, so the page has one `<h1>`.
- [x] `Login.jsx`: build the right card (white, `text-ink`, 4px radius, shadow). It has the "Sign in" `<h1>` and the subtext "Use the account created for you by your administrator.".
- [x] `Login.jsx`: move the demo role picker into the card, directly under the heading and subtext, with its current logic and styles.
- [x] `Login.jsx`: add `const [showPassword, setShowPassword] = useState(false)`. Wrap the password input in a `relative` container with a text button "Show" / "Hide" inside it, and switch the input `type` between `password` and `text`.
- [x] `Login.jsx`: replace the card footer with a top-bordered block holding "Need access? Ask your administrator to create your account." and `<Link to="/">← Back to Umuriro</Link>`.
- [x] `Login.jsx`: keep `chooseRole`, `onSubmit`, the validation messages and the redirect code exactly as they are.

**Automated Verification**:

- [x] `npm run check` passes (lint with zero warnings, format check, type-check, all unit tests).
- [x] `npm --prefix frontend run build` succeeds.

**Manual Verification**:

- [ ] With `VITE_DEMO_LOGIN=true`, at desktop width: the picker fills the demo account, and each of the three roles signs in and lands on its own home.
- [ ] With `VITE_DEMO_LOGIN` unset: no picker and no demo password hint, and sign-in still works with typed credentials.
- [ ] Show/Hide toggles the password text. A wrong password shows the server error. An empty or malformed email shows the inline message.
- [ ] Opening `/coordinator/faults` while signed out redirects to `/login`, and signing in returns to `/coordinator/faults`.
- [ ] "← Back to Umuriro" opens the landing page.

### Phase 2: Narrow screens, states and accessibility

Dependencies: Phase 1

Make the stacked layout and the interaction states correct on a phone-sized browser.

**Tasks**:

- [x] `Login.jsx`: below `lg`, make the photo panel a short strip (about 220px) with the logo and a smaller tagline over it, then the card full width with 16-20px side gutters and no horizontal overflow.
- [x] `Login.jsx`: give the toggle, the back link and the role buttons at least 44px of touch height, and a visible `focus-visible` ring (accent outline, matching `.field:focus-visible`).
- [x] `Login.jsx`: give the toggle `aria-pressed`, `aria-controls="password"` and `aria-label="Show password"`. Keep the existing `aria-invalid` and `aria-describedby` wiring on both inputs.
- [x] `Login.jsx`: check the tagline's contrast over the photo fade at both layouts and darken the shade if needed.
- [x] Docs: search `README.md` and `docs/` for text that describes the login page layout, and update anything that is now wrong. A grep during planning found only the unchanged `VITE_DEMO_LOGIN` role-picker descriptions (`README.md:84`, `docs/SETUP.md:49`).

**Automated Verification**:

- [x] `npm run check` passes.
- [x] `npm --prefix frontend run build` succeeds.

**Manual Verification**:

- [ ] At 375px width: no horizontal scroll, the photo strip and the card stack, and every control is easy to tap.
- [ ] Tab order is photo link, role picker (demo), email, password, Show/Hide, Sign in, back link, each with a visible focus ring. Enter submits the form.
- [ ] With the API unreachable, the server error appears in `FormError` and the button returns to "Sign in".
- [ ] A screen reader announces the toggle as a pressed or unpressed button, and the field errors are read with their inputs.

## Implementation Notes

During implementation, document user feedback, problems, and decisions here.

- `npm run check`: lint (0 warnings), type-check, 128 unit tests and the frontend build pass. `format:check` reports 98 files on a clean tree (CRLF line endings from the Windows checkout, not caused by this change). `Login.jsx` and `index.css` pass Prettier on their own.
- Phases 1 and 2 were written in one pass because the narrow-screen and accessibility classes sit in the same markup. The tagline contrast check and all manual items still need a browser.
- Browser pass (Chrome, dev server on 5173, API on 4000), not yet confirmed by the user:
  - Desktop: split screen renders; the photo, logo, tagline and card look right. With `VITE_DEMO_LOGIN=true` the picker fills each account and all three roles land on their own home. With it unset there is no picker and no demo hint. Empty fields show both inline messages, a wrong password shows the server error, Show/Hide works, and the button returns to "Sign in" after an error (including when the API was unreachable).
  - Phone (375px iframe, since the window would not shrink): photo strip over the card, no horizontal overflow, tagline readable. The only control under 44px wide is the existing PilotBanner close button, which has a 44px tap area.
  - Accessibility: tab order is the planned one, the toggle flips `aria-pressed` and gets a 2px accent focus ring, and there is a single `<h1>`. A screen reader was not tried.
- **Existing bug, not from this change:** signing in after being sent to `/login` from `/coordinator/faults` lands on `/coordinator`, not `/coordinator/faults`. `login()` sets the user, so the `if (user) return <Navigate to={HOME_BY_ROLE[user.role]} />` at the top of `Login` seems to redirect before `navigate(wanted)` runs. Both lines are unchanged by this plan.

- The Show/Hide button has a constant `aria-label="Show password"` with `aria-pressed`, as planned. Its visible text changes to "Hide", so the accessible name no longer contains the visible label while the password is shown.

## References

- Design artifact: https://claude.ai/artifact/VRwS9W1HpycQEFuVFU28BK (`project/Main.dc.html`, "Coordinator sign in")
- Current page: `frontend/src/pages/Login.jsx`
- Shared pieces: `frontend/src/components/Field.jsx`, `frontend/src/components/Brand.jsx`, `frontend/src/components/States.jsx`
- Tokens and button styles: `frontend/src/index.css`
- Photo asset and its other use: `frontend/public/landing/silhouette.jpg`, `frontend/src/pages/landing/Hero.jsx`
- Out of scope: `mobile/app/login.js`
