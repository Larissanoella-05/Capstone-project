# SMS through an Android phone

By default `SMS_PROVIDER=log` only writes messages to the API log. For real texts, put a SIM in an Android phone
running [SMS Gateway for Android](https://github.com/capcom6/android-sms-gateway). The text leaves on the
phone's own SIM, so no sender ID is needed.

## Set up

1. Install the app, allow the SMS permission, turn off battery optimisation, keep the phone on and connected.
2. Pick a mode: **Cloud** (works with the deployed backend) or **Local server** (backend on the same network).
3. Copy the username and password the app shows (and, for local mode, its address such as `http://192.168.1.20:8080`).
4. Set these in `backend/.env` or the host's environment, then restart:

```
SMS_PROVIDER=smsgate
SMS_GATEWAY_URL=https://api.sms-gate.app/3rdparty/v1
SMS_GATEWAY_USER=<from the app>
SMS_GATEWAY_PASSWORD=<from the app>
PUBLIC_WEB_URL=<where the web app opens, used in the tracking link>
```

For local mode, `SMS_GATEWAY_URL` is the phone's bare address. `PUBLIC_WEB_URL` defaults to
`http://localhost:5173`, which a phone cannot open. The backend refuses to start if `smsgate` is selected without a
user or password. Never commit these values.

## Check

Report a fault at `/report` with your own number. The confirmation should say the text was queued, and it
should arrive within a minute. Assigning it as a coordinator sends a second text.

If nothing arrives, look for `[sms] send failed:` in the API log (`401` = wrong credentials, timeout = phone off).
A failed text never fails the report.

## Limits

The phone must stay on (a text sent while it is off is lost, with no retry). Each text uses SIM airtime. The
backend allows 3 reports per phone per hour.
