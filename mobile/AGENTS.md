# Mobile app (Expo, Android): agent instructions

The repo-wide rules in `../AGENTS.md` apply here (plan first, `npm run check` before "done").
This file only adds what is specific to `mobile/`.

Expo SDK 58, React Native 0.88, **plain JavaScript** (no TypeScript), Jest with `jest-expo`.

## Expo changes every release: do not trust memory

Before writing code that touches an Expo, EAS or React Native API:

1. Confirm the `expo` major version in `package.json` (currently 58).
2. Read the matching docs: `https://docs.expo.dev/versions/v58.0.0/`.
3. For anything else start from `https://docs.expo.dev/llms.txt`. Do not answer from memory.

## Structure

- `app/`: Expo Router routes. Every file is a screen and `_layout.js` files define navigators.
  Roles live in `app/customer/` and `app/technician/`; `login.js` and `welcome.js` are public.
- `src/components/`: shared UI. `src/context/`: auth, notifications, tracking, toast.
  `src/hooks/`: `useApi` (polling) and push registration. `src/lib/`: API client, push, location, photos,
  secure token storage, map helpers. `src/theme.js`: colours and type.
- Keep non-route code out of `app/`.
- API calls go through `src/lib/api.js`, with data loaded through `useApi`. The base URL comes from
  `EXPO_PUBLIC_API_URL` (see `.env.example` and `eas.json`).
- The JWT is kept in `expo-secure-store` through `src/lib/tokenStore.js`, never in plain storage.

## Rules

- Add packages with `npx expo install <package>` so the SDK-compatible version is chosen.
  Then run `npx expo-doctor`; CI runs it too.
- `android/` and `ios/` are generated (Continuous Native Generation). Never create or edit them by hand.
  Configure native behaviour in `app.config.js` and config plugins.
- Native modules need a development build, not Expo Go: `eas build --profile development`.
- Prefer Expo modules over third-party libraries.
- Location is foreground-only and photos are downscaled before upload. Keep both behaviours.
- Tests: `npm test` (Jest). Mock native modules in the test file or `jest.setup.js`. Never assign to an
  imported module; use `jest.mock` or `jest.replaceProperty`.
- Before declaring a task done, `npx expo export --platform android` must still bundle (CI runs it).
