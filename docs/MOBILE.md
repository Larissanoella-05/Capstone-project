# Android app

`mobile/` is an Expo (React Native) app for **customers and technicians**. It talks to the same API as the web
app. Coordinators use the web app; signing in as a coordinator on the phone shows "Coordinators use the web app."

**What you need:** Node 20+, a free [Expo account](https://expo.dev) and an Android phone. You do **not** need
Android Studio: the installable app is built in Expo's cloud (EAS). Maps, the camera, location and push are native
code, so the app **cannot run in Expo Go**. It needs a _development build_ (step 2).

Just want to try it? Build the preview APK (step 5), or ask for the build link.

## 1. Install and configure

```bash
cd mobile
npm ci
cp .env.example .env
```

Edit `mobile/.env`. These values are bundled into the app, so never put a secret in an `EXPO_PUBLIC_*` variable.

| Variable                    | What it is for              | Value                                                              |
| --------------------------- | --------------------------- | ------------------------------------------------------------------ |
| `EXPO_PUBLIC_API_URL`       | API address, without `/api` | Live API: `https://capstone-project-as2y.onrender.com`             |
| `EXPO_PUBLIC_MAP_STYLE_URL` | Map style                   | `https://tiles.openfreemap.org/styles/liberty` (no key or account) |

Metro reads `.env` when it bundles the JavaScript, so restart it with `--clear` after changing it. The
`eas.json` build profiles set `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_DEMO_LOGIN` (the demo role picker on the
login screen) for installed builds.

**Using your own local API instead:** run the backend (`npm run dev` in `backend/`) and set
`EXPO_PUBLIC_API_URL=http://<your computer's LAN address>:4000`. Never use `localhost`: on a phone that is the
phone itself. Keep the phone and computer on the same Wi-Fi and allow port 4000 through the firewall. See
[SETUP.md](SETUP.md) for how to find the LAN address on your OS. The Android app is not subject to CORS. If
sign-in says it cannot reach the server, open the address in the phone's browser first. If that works but the app
still cannot connect, Android may be blocking plain `http://` for that build, so use the HTTPS Render address.

## 2. Build and install the development build

Do this once, and again after adding any native package.

```bash
npx eas-cli login
npx eas-cli build --profile development --platform android
```

Answer **yes** to "Generate a new Android Keystore". When the build finishes, open the link or scan the QR code
on the phone and install the APK (allow "install unknown apps" for the browser if asked).

The Expo project id is in `mobile/app.config.js` (`extra.eas.projectId`). To build under your own Expo account,
run `npx eas-cli init`, copy the id it prints into that file by hand (EAS cannot edit a dynamic config), and
change `slug` and `android.package` if you want your own app id.

## 3. Run it

```bash
cd mobile
npx expo start --dev-client --clear
```

Open the installed **Umuriro** app and scan the QR code (or enter the address shown). JavaScript changes reload
instantly. Adding a package with native code or a config plugin needs a new development build.

Demo accounts (password `demo1234` for all): `aline@demo.rw` (customer), `jeanclaude@demo.rw` (technician).
`grace@demo.rw` (coordinator) is refused by the app by design.

## 4. Push notifications (one-time Firebase setup)

Push needs Firebase Cloud Messaging. Without these steps the app and API still work; only the phone alerts are
missing (the Alerts tab still lists every notification).

1. Create a Firebase project, add an **Android app** with package name `rw.umuriro.response`, and download
   `google-services.json`.
2. Store it in EAS as a file variable so cloud builds can use it. The file is ignored by Git and must never be
   committed.
   ```bash
   cd mobile
   npx eas-cli env:set --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --visibility sensitive --environment development --environment preview
   ```
   For a local build only, put the file at `mobile/google-services.json` instead.
3. In Firebase → Project settings → Service accounts, generate a private key, then upload it to Expo with
   `npx eas-cli credentials -p android` → Google Service Account → FCM V1 key. Keep the key file out of the
   repository.
4. Deploy the backend (`prisma migrate deploy` applies the `DeviceToken` migration), then rebuild the app so it
   includes the Firebase file.

**How it works:** after sign-in the app registers its Expo push token with `POST /api/devices`. The backend sends
a push through the Expo Push Service after each notification it creates (report received, technician assigned, on
the way, arrived, resolved, cancelled, new job). Tapping a push opens the fault (customer) or job (technician).
Signing out removes the token, and signing in as someone else on the same phone moves it to them. The backend
removes tokens that Expo reports as no longer registered. Push failures are logged as `[push] …` and never fail an
API request.

## 5. Installable build for a demo

```bash
npx eas-cli build --profile preview --platform android
```

This produces an APK that points at the Render API and runs on its own (no Metro needed). Share the build link;
testers install it like any APK.

## How the technician's location works

While a technician's active job is _On the way_, _Arrived_ or _Working_ **and the app is open on screen**, the
phone shares its position. The first fix is sent at once, then at most one every 15 seconds and only after
moving 25 metres or more. The app asks only for foreground location (no background permission). Locking the phone
or leaving the app stops the updates. This is a deliberate limit of the prototype and keeps the app out of extra
store review.

## Maps

The map uses [MapLibre](https://maplibre.org) with the free [OpenFreeMap](https://openfreemap.org) style, so no
key or billing account is needed. OpenFreeMap has no service guarantee. To switch provider, change
`EXPO_PUBLIC_MAP_STYLE_URL` (for example a MapTiler style URL with your key) and rebuild. A key in an
`EXPO_PUBLIC_*` variable is visible to anyone who unpacks the app, so restrict it in the provider's dashboard. The
map attribution stays visible, as the OpenFreeMap and OpenStreetMap licences require.

## Tests

```bash
cd mobile
npm test                              # Jest: API client, sign-in, polling, location rules, tracker, push
npx expo-doctor                       # checks the project and its dependency versions
npx expo export --platform android    # proves the whole app bundles (also run by CI)
```

Device behaviour (maps, GPS, camera, push) cannot be unit tested. The manual checklist and results are in
[TESTING.md](TESTING.md).

## Troubleshooting

| Problem                                                                                  | Cause                                                                                           | Fix                                                                                                                                     |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| "Cannot reach the server" on the login screen                                            | `EXPO_PUBLIC_API_URL` missing or `localhost`, so the phone calls itself                         | Create `mobile/.env`, then `npx expo start --dev-client --clear`                                                                        |
| "Waking the server…" for up to a minute on first sign-in                                 | Render's free tier sleeps when idle                                                             | Wait; the app allows 70 seconds                                                                                                         |
| `TurboModuleRegistry … 'MLRNCameraModule' could not be found` (or another native module) | The installed APK was built before that package was added                                       | Build and install a new development build                                                                                               |
| Map area says "Map unavailable in this build"                                            | Same as above, for MapLibre                                                                     | Rebuild the development build                                                                                                           |
| `npm error ECONNRESET` during `npm install` or `expo export`                             | Unstable network                                                                                | Retry; `npm cache verify`; check proxy settings                                                                                         |
| `npx expo install <package>` fails to run npm on Windows                                 | Known quirk on some Windows setups                                                              | Run `npm install <package>@<version>` using the version `npx expo-doctor` expects, and add any config plugin to `app.config.js` by hand |
| No push arrives                                                                          | Firebase steps not done, notifications blocked in Android settings, or the phone is an emulator | Check the steps; look for `[push]` lines in the Render logs                                                                             |
| The 15-minute push receipt check does not run                                            | It uses an in-process timer and Render's free tier sleeps                                       | Tokens that are invalid at send time are still removed                                                                                  |
