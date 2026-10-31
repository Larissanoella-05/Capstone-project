import { env } from '../config/env.js';

// An SMS is a courtesy on top of the in-app notification row: nothing in here ever throws to the caller.
// The proposal asks for an SMS when a report is received and when a technician is assigned (FR11, FR12).

/** The notification types that are also sent by SMS. */
export const SMS_NOTIFICATION_TYPES = new Set(['FAULT_SUBMITTED', 'TECHNICIAN_ASSIGNED']);

/**
 * What the service needs from a gateway. Providers are interchangeable, so a real gateway can replace
 * the logging one without touching the workflow code.
 */
export class SmsProvider {
  /** @param {{ to: string, text: string }} _message */
  async send(_message) {
    throw new Error('SmsProvider.send must be implemented by a subclass.');
  }
}

/** Default provider: writes the message to the log and sends nothing. Used for the pilot and for tests. */
export class LogSmsProvider extends SmsProvider {
  async send({ to, text }) {
    console.log(`[sms] to ${to}: ${text}`);
  }
}

/** Placeholder for Africa's Talking, the gateway named in the proposal. It needs an account, so it is not wired up yet. */
export class AfricasTalkingSmsProvider extends SmsProvider {
  /** @param {{ to: string, text: string }} _message */
  async send(_message) {
    throw new Error("The Africa's Talking provider is not implemented yet.");
  }
}

const PROVIDERS = {
  log: LogSmsProvider,
  africastalking: AfricasTalkingSmsProvider,
};

/** @param {string} name one of the keys of PROVIDERS */
export function createSmsProvider(name) {
  const Provider = PROVIDERS[name];
  if (!Provider) {
    throw new Error(
      `Unknown SMS_PROVIDER "${name}". Use one of: ${Object.keys(PROVIDERS).join(', ')}.`
    );
  }
  return new Provider();
}

let provider = createSmsProvider(env.smsProvider);

/** Tests inject a fake provider with the same `send` method. */
export function setSmsProvider(replacement) {
  provider = replacement;
}

const inFlight = new Set();

/** Resolves when every SMS started so far has finished (used by tests, which cannot await a background send). */
export function whenSmsIdle() {
  return Promise.allSettled([...inFlight]);
}

async function send(notifications, phone) {
  if (!phone || !notifications?.length) return;
  for (const notification of notifications) {
    if (!SMS_NOTIFICATION_TYPES.has(notification.type)) continue;
    try {
      await provider.send({ to: phone, text: notification.message });
    } catch (error) {
      console.error('[sms] send failed:', error.message);
    }
  }
}

/**
 * Sends the customer an SMS for the notification rows just created, if they are of a type that is sent by SMS.
 * Call it AFTER the database transaction commits, and do not await it: the response must not wait for the gateway.
 * @param {{ type: string, message: string }[]} notifications
 * @param {string | null | undefined} phone the customer's phone number
 */
export function sendSmsForNotifications(notifications, phone) {
  const task = send(notifications, phone).finally(() => inFlight.delete(task));
  inFlight.add(task);
  return task;
}
