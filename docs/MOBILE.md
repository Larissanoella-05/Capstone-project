# Android app

`mobile/` is an Expo (React Native) app for customers and technicians, using the same API as the web.
Coordinators use the web. It cannot run in Expo Go (maps, camera, location and push are native code), so it
needs a development build. You need Node 20+, a free [Expo account](https://expo.dev) and an Android phone.
Builds run in the cloud (EAS); Android Studio is not needed.

## 1. Install and configure

```bash
cd mobile
npm ci
cp .env.example .env
```

| Variable                    | Purpose                     | Value                                          |
| --------------------------- | --------------------------- | ---------------------------------------------- |
| `EXPO_PUBLIC_API_URL`       | API address, without `/api` | `https://capstone-project-as2y.onrender.com`   |
| `EXPO_PUBLIC_MAP_STYLE_URL` | Map style (free, no key)    | `https://tiles.openfreemap.org/styles/liberty` |

These values are bundled into the app, so never put a secret in them. For a local API use
`http://<your LAN address>:4000`, never `localhost`, and keep both devices on the same Wi-Fi.

## 2. Build and run

```bash
npx eas-cli login
npx eas-cli build --profile development --platform android   # once, and after adding a native package
npx expo start --dev-client --clear
```

Install the APK from the build link or QR code, open **Umuriro** and scan the Metro QR code. Demo accounts
(password `demo1234`): `aline@demo.rw` (customer), `jeanclaude@demo.rw` (technician).

For a standalone demo APK that talks to the Render API: `npx eas-cli build --profile preview --platform android`.

## 3. Push notifications (optional)

Without them everything works except phone alerts; the Alerts tab still lists every notification.

1. Create a Firebase project, add an Android app with package `rw.umuriro.response`, download
   `google-services.json` (never commit it).
2. `npx eas-cli env:set --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --visibility sensitive --environment development --environment preview`
3. In Firebase → Service accounts, generate a private key and upload it with
   `npx eas-cli credentials -p android` → Google Service Account → FCM V1 key.
4. Deploy the backend and rebuild the app.

## Notes

- **Location:** while a job is _On the way_, _Arrived_ or _Working_ and the app is open, the phone sends its
  position (foreground only). Throttled to protect the battery.
- **Checks:** `npm test`, `npx expo-doctor`, `npx expo export --platform android` (all run in CI).

## Troubleshooting

| Problem                                                          | Fix                                                                         |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------- |
| "Cannot reach the server"                                        | `EXPO_PUBLIC_API_URL` missing or `localhost`. Fix `.env`, restart `--clear` |
| "Waking the server…" for up to a minute                          | Render's free tier was asleep. Wait                                         |
| `TurboModuleRegistry … could not be found`, or "Map unavailable" | APK is older than that package. Build a new development build               |
| `npx expo install` fails on Windows                              | `npm install <package>@<version>` with the version `expo-doctor` expects    |
| No push arrives                                                  | Firebase steps not done, or an emulator. Look for `[push]` in the API logs  |
