import { env } from '../config/env.js';
import { GUEST_SMS_TYPES } from '../domain/guestSms.js';

// An SMS is a courtesy on top of the in-app notification row: nothing in here ever throws to the caller.

export const SMS_NOTIFICATION_TYPES = new Set(['FAULT_SUBMITTED', 'TECHNICIAN_ASSIGNED']);

/** What the service needs from a gateway; providers are interchangeable. */
export class SmsProvider {
  /** @param {{ to: string, text: string }} _message */
  async send(_message) {
    throw new Error('SmsProvider.send must be implemented by a subclass.');
  }
}

/** Default provider: logs the message and sends nothing. */
export class LogSmsProvider extends SmsProvider {
  async send({ to, text }) {
    console.log(`[sms] to ${to}: ${text}`);
  }
}

/** Placeholder for Africa's Talking; it needs an account, so it is not wired up yet. */
export class AfricasTalkingSmsProvider extends SmsProvider {
  /** @param {{ to: string, text: string }} _message */
  async send(_message) {
    throw new Error("The Africa's Talking provider is not implemented yet.");
  }
}

const GATEWAY_TIMEOUT_MS = 10_000;

/**
 * Sends through an Android phone running SMS Gateway for Android (local server or its cloud relay),
 * so the text goes out on the phone's own SIM and needs no registered sender ID.
 */
export class SmsGateProvider extends SmsProvider {
  /** @param {{ url: string, user: string, password: string }} [config] */
  constructor(config = env.smsGateway) {
    super();
    if (!config.user || !config.password) {
      throw new Error(
        'SMS_PROVIDER=smsgate needs SMS_GATEWAY_USER and SMS_GATEWAY_PASSWORD (the login the phone app shows).'
      );
    }
    this.url = config.url;
    this.authorization = `Basic ${Buffer.from(`${config.user}:${config.password}`).toString('base64')}`;
  }

  /** @param {{ to: string, text: string }} message */
  async send({ to, text }) {
    const response = await fetch(`${this.url}/message`, {
      method: 'POST',
      headers: { Authorization: this.authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify({ textMessage: { text }, phoneNumbers: [to] }),
      signal: AbortSignal.timeout(GATEWAY_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`The SMS gateway answered ${response.status}.`);
  }
}

const PROVIDERS = {
  log: LogSmsProvider,
  africastalking: AfricasTalkingSmsProvider,
  smsgate: SmsGateProvider,
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

/** Resolves when every SMS started so far has finished; tests cannot await a background send. */
export function whenSmsIdle() {
  return Promise.allSettled([...inFlight]);
}

/** True while messages are only logged, so a page can say the text was not really sent. */
export function isSmsSimulated() {
  return provider instanceof LogSmsProvider;
}

async function send(notifications, phone, types = SMS_NOTIFICATION_TYPES) {
  if (!phone || !notifications?.length) return;
  for (const notification of notifications) {
    if (!types.has(notification.type)) continue;
    try {
      await provider.send({ to: phone, text: notification.message });
    } catch (error) {
      console.error('[sms] send failed:', error.message);
    }
  }
}

/**
 * Call AFTER the transaction commits and do not await it: the response must not wait for the gateway.
 * @param {{ type: string, message: string }[]} notifications
 * @param {string | null | undefined} phone the customer's phone number
 */
export function sendSmsForNotifications(notifications, phone) {
  const task = send(notifications, phone).finally(() => inFlight.delete(task));
  inFlight.add(task);
  return task;
}

/**
 * The same, for a guest report: a guest has no app, so every stage of the report is texted.
 * @param {{ type: string, message: string }[]} messages
 * @param {string | null | undefined} phone the number the guest gave
 */
export function sendGuestSms(messages, phone) {
  const task = send(messages, phone, GUEST_SMS_TYPES).finally(() => inFlight.delete(task));
  inFlight.add(task);
  return task;
}
