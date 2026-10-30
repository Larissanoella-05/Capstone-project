import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../../src/lib/prisma.js';
import { checkReceipts, sendPushForNotifications, setExpoClient, whenPushIdle } from '../../src/services/pushService.js';

// The real Expo service is never contacted: a fake client records what would be sent.
function fakeExpo({ tickets, receipts, sendError } = {}) {
  const sent = [];
  return {
    sent,
    chunkPushNotifications: (messages) => [messages],
    sendPushNotificationsAsync: async (chunk) => {
      if (sendError) throw sendError;
      sent.push(...chunk);
      return tickets ?? chunk.map((_, i) => ({ status: 'ok', id: `ticket-${sent.length}-${i}` }));
    },
    chunkPushNotificationReceiptIds: (ids) => [ids],
    getPushNotificationReceiptsAsync: async () => receipts ?? {},
  };
}

const TOKEN_A = 'ExponentPushToken[aaaaaaaaaaaaaaaaaaaaaa]';
const notice = (userId, extra = {}) => ({ userId, faultId: 12, type: 'TECHNICIAN_ASSIGNED', title: 'Technician Assigned', message: 'Jean Claude has been assigned.', ...extra });

let deviceRows;
let deleted;
let findMany;
const realDelegate = prisma.deviceToken;

// The Prisma delegate has no own methods to spy on, so swap the whole delegate for a fake one.
function useDevices(delegate) {
  Object.defineProperty(prisma, 'deviceToken', { value: delegate, configurable: true, writable: true });
}

beforeEach(() => {
  deviceRows = [{ userId: 1, token: TOKEN_A }];
  deleted = [];
  findMany = async ({ where }) => deviceRows.filter((row) => where.userId.in.includes(row.userId));
  useDevices({
    findMany: (args) => findMany(args),
    deleteMany: async ({ where }) => {
      deleted.push(where.token);
      return { count: 1 };
    },
  });
  mock.method(console, 'log', () => {});
  mock.method(console, 'error', () => {});
});

afterEach(() => {
  mock.restoreAll();
  useDevices(realDelegate);
});

describe('pushService', () => {
  it('sends one message per device with the fault id and type in its data', async () => {
    const expo = fakeExpo();
    setExpoClient(expo);

    await sendPushForNotifications([notice(1)]);

    assert.equal(expo.sent.length, 1);
    assert.deepEqual(expo.sent[0], {
      to: TOKEN_A,
      title: 'Technician Assigned',
      body: 'Jean Claude has been assigned.',
      sound: 'default',
      channelId: 'default',
      priority: 'high',
      data: { faultId: 12, type: 'TECHNICIAN_ASSIGNED' },
    });
  });

  it('sends nothing for a user who has no registered device', async () => {
    const expo = fakeExpo();
    setExpoClient(expo);

    await sendPushForNotifications([notice(99)]);

    assert.equal(expo.sent.length, 0);
  });

  it('sends nothing when there are no notifications', async () => {
    const expo = fakeExpo();
    setExpoClient(expo);
    await sendPushForNotifications([]);
    assert.equal(expo.sent.length, 0);
  });

  it('skips a stored value that is not a valid Expo token', async () => {
    deviceRows = [{ userId: 1, token: 'not-a-token' }];
    const expo = fakeExpo();
    setExpoClient(expo);
    await sendPushForNotifications([notice(1)]);
    assert.equal(expo.sent.length, 0);
  });

  it('sends each user their own notification only', async () => {
    deviceRows = [
      { userId: 1, token: TOKEN_A },
      { userId: 2, token: 'ExponentPushToken[bbbbbbbbbbbbbbbbbbbbbb]' },
    ];
    const expo = fakeExpo();
    setExpoClient(expo);

    await sendPushForNotifications([notice(1, { type: 'TECHNICIAN_ASSIGNED' }), notice(2, { type: 'JOB_ASSIGNED', title: 'New Job Assigned' })]);

    assert.deepEqual(expo.sent.map((m) => [m.to, m.data.type]), [
      [TOKEN_A, 'TECHNICIAN_ASSIGNED'],
      ['ExponentPushToken[bbbbbbbbbbbbbbbbbbbbbb]', 'JOB_ASSIGNED'],
    ]);
  });

  it('removes a token when the ticket says DeviceNotRegistered', async () => {
    setExpoClient(fakeExpo({ tickets: [{ status: 'error', message: 'gone', details: { error: 'DeviceNotRegistered' } }] }));

    await sendPushForNotifications([notice(1)]);
    await whenPushIdle();
    await new Promise((resolve) => setImmediate(resolve));

    assert.deepEqual(deleted, [TOKEN_A]);
  });

  it('removes a token when a later receipt says DeviceNotRegistered', async () => {
    setExpoClient(fakeExpo({ receipts: { 'ticket-1': { status: 'error', details: { error: 'DeviceNotRegistered' } } } }));

    await checkReceipts([{ id: 'ticket-1', to: TOKEN_A }]);

    assert.deepEqual(deleted, [TOKEN_A]);
  });

  it('keeps the token when a receipt reports a different error', async () => {
    setExpoClient(fakeExpo({ receipts: { 'ticket-1': { status: 'error', details: { error: 'MessageRateExceeded' } } } }));
    await checkReceipts([{ id: 'ticket-1', to: TOKEN_A }]);
    assert.deepEqual(deleted, []);
  });

  it('never throws when sending fails', async () => {
    setExpoClient(fakeExpo({ sendError: new Error('network down') }));
    await assert.doesNotReject(sendPushForNotifications([notice(1)]));
  });

  it('never throws when the database lookup fails', async () => {
    setExpoClient(fakeExpo());
    findMany = async () => {
      throw new Error('db down');
    };
    await assert.doesNotReject(sendPushForNotifications([notice(1)]));
  });
});
