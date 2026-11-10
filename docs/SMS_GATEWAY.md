# SMS through an Android phone

By default no text is really sent: `SMS_PROVIDER=log` writes the message to the API log, and the guest confirmation page shows it labelled as simulated. To send real texts, put a Rwandan SIM in an Android phone running [SMS Gateway for Android](https://github.com/capcom6/android-sms-gateway). The text leaves on the phone's own SIM, so no sender ID has to be registered.

## Set up the phone

1. Install the app and allow the SMS permission.
2. Choose a mode:
   - **Cloud:** the phone registers with the app's relay, and the deployed backend can reach it from anywhere. Use this for the live app.
   - **Local server:** the phone runs a server on your network. Your backend must be on the same network, so this suits a demo from a laptop.
3. Copy the username and password the app shows (and, for local mode, the address, for example `http://192.168.1.20:8080`).
4. Turn off battery optimisation for the app. Keep the phone charged, switched on and connected.

## Configure the backend

In `backend/.env` locally, and in the host's environment settings when deployed:

```
SMS_PROVIDER=smsgate
SMS_GATEWAY_URL=https://api.sms-gate.app/3rdparty/v1
SMS_GATEWAY_USER=<from the app>
SMS_GATEWAY_PASSWORD=<from the app>
```

For local mode, set `SMS_GATEWAY_URL` to the phone's bare address instead (for example `http://192.168.1.20:8080`, with no `/3rdparty/v1`). Also set `PUBLIC_WEB_URL` to where the web app can be opened, because the tracking link in the text starts with it. It defaults to `http://localhost:5173`, which a phone cannot open. The backend refuses to start with `smsgate` selected if the user or password is missing. Never commit these values.

The relay address has appeared in two forms (`sms.capcom.me` and `api.sms-gate.app`). Use the one the app shows.

## Check it works

1. Restart the backend.
2. Open `/report`, report a fault with your own number, and send it.
3. The confirmation page should say the text was queued, not simulated, and the text should arrive within a minute.
4. Assign the report as a coordinator and check that the second text arrives.

If nothing arrives, look for `[sms] send failed:` in the API log. A `401` means the user or password is wrong; a timeout means the phone is off or unreachable. A failed text never fails the report.

## Limits

- The phone must stay on. A text sent while it is off is lost; there is no retry. The report and the tracking page still work.
- Each text uses airtime or bundle from the SIM.
- The app paces its own sending and discourages large batches. The backend allows 3 reports per phone per hour.
