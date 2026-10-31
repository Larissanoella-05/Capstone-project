import { Expo } from 'expo-server-sdk';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';

// A push is a courtesy on top of the in-app notification row: nothing in here ever throws to the caller.

let expo = new Expo({ accessToken: env.expoAccessToken });

/** Tests inject a fake client with the same methods as the real one. */
export function setExpoClient(client) {
  expo = client;
}

const RECEIPT_DELAY_MS = 15 * 60 * 1000;
const inFlight = new Set();

/** Resolves when every push started so far has finished (used by tests, which cannot await a background send). */
export function whenPushIdle() {
  return Promise.allSettled([...inFlight]);
}

/** Registers a phone's token for the signed-in user. If the token was another user's, it moves (shared phone). */
export async function registerDevice(user, { token, platform = 'android' }) {
  await prisma.deviceToken.upsert({
    where: { token },
    create: { userId: user.id, token, platform },
    update: { userId: user.id, platform },
  });
}

/** Removes the signed-in user's own copy of a token; another user's token with the same text is left alone. */
export async function removeDevice(user, token) {
  const result = await prisma.deviceToken.deleteMany({ where: { token, userId: user.id } });
  return result.count;
}

async function dropToken(token, reason) {
  try {
    const result = await prisma.deviceToken.deleteMany({ where: { token } });
    if (result.count) console.log(`[push] removed device token (${reason})`);
  } catch (error) {
    console.error('[push] could not remove token:', error.message);
  }
}

/** Asks Expo, a while after sending, whether each message reached the phone; unregistered tokens are removed. */
export async function checkReceipts(sent) {
  try {
    const tokenByTicket = new Map(sent.map(({ id, to }) => [id, to]));
    for (const chunk of expo.chunkPushNotificationReceiptIds([...tokenByTicket.keys()])) {
      const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
      for (const [id, receipt] of Object.entries(receipts)) {
        if (receipt.status === 'error' && receipt.details?.error === 'DeviceNotRegistered') {
          console.log('[push] receipt error DeviceNotRegistered');
          await dropToken(tokenByTicket.get(id), 'receipt DeviceNotRegistered');
        } else if (receipt.status === 'error') {
          console.error(`[push] receipt error ${receipt.details?.error ?? receipt.message}`);
        }
      }
    }
  } catch (error) {
    console.error('[push] receipt check failed:', error.message);
  }
}

async function send(notifications) {
  try {
    if (!notifications?.length) return;
    const tokens = await prisma.deviceToken.findMany({
      where: { userId: { in: [...new Set(notifications.map((n) => n.userId))] } },
    });
    if (!tokens.length) return;

    const messages = [];
    for (const notification of notifications) {
      for (const device of tokens.filter((t) => t.userId === notification.userId)) {
        if (!Expo.isExpoPushToken(device.token)) continue;
        messages.push({
          to: device.token,
          title: notification.title,
          body: notification.message,
          sound: 'default',
          channelId: 'default',
          priority: 'high',
          data: { faultId: notification.faultId ?? null, type: notification.type },
        });
      }
    }
    if (!messages.length) return;

    const sent = [];
    for (const chunk of expo.chunkPushNotifications(messages)) {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      tickets.forEach((ticket, index) => {
        const to = chunk[index].to;
        if (ticket.status === 'ok') {
          sent.push({ id: ticket.id, to });
        } else if (ticket.details?.error === 'DeviceNotRegistered') {
          dropToken(to, 'ticket DeviceNotRegistered');
        } else {
          console.error(`[push] ticket error ${ticket.details?.error ?? ticket.message}`);
        }
      });
    }
    console.log(
      `[push] sent ${sent.length} message(s) (${[...new Set(notifications.map((n) => n.type))].join(', ')})`
    );

    if (sent.length) setTimeout(() => checkReceipts(sent), RECEIPT_DELAY_MS).unref();
  } catch (error) {
    console.error('[push] send failed:', error.message);
  }
}

/**
 * Pushes the notification rows just created for an event to their recipients' phones.
 * Call it AFTER the database transaction commits, and do not await it: the response must not wait for Expo.
 */
export function sendPushForNotifications(notifications) {
  const task = send(notifications).finally(() => inFlight.delete(task));
  inFlight.add(task);
  return task;
}
