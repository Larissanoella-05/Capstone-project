import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import {
  AfricasTalkingSmsProvider,
  LogSmsProvider,
  SMS_NOTIFICATION_TYPES,
  createSmsProvider,
  sendSmsForNotifications,
  setSmsProvider,
  whenSmsIdle,
} from '../../src/services/smsService.js';

/** Records what would be sent. The real gateway is never contacted. */
function fakeProvider(error) {
  const sent = [];
  return {
    sent,
    send: async (message) => {
      if (error) throw error;
      sent.push(message);
    },
  };
}

const notice = (type, extra = {}) => ({
  userId: 1,
  faultId: 7,
  type,
  title: 'Title',
  message: `Message for ${type}`,
  ...extra,
});

beforeEach(() => {
  mock.method(console, 'log', () => {});
  mock.method(console, 'error', () => {});
});

afterEach(() => {
  mock.restoreAll();
  setSmsProvider(new LogSmsProvider());
});

describe('smsService', () => {
  it('sends an SMS when the report is received and when a technician is assigned', async () => {
    const provider = fakeProvider();
    setSmsProvider(provider);

    await sendSmsForNotifications(
      [notice('FAULT_SUBMITTED'), notice('TECHNICIAN_ASSIGNED')],
      '+250788000001'
    );

    assert.deepEqual(provider.sent, [
      { to: '+250788000001', text: 'Message for FAULT_SUBMITTED' },
      { to: '+250788000001', text: 'Message for TECHNICIAN_ASSIGNED' },
    ]);
  });

  it('only covers the two events the proposal names', () => {
    assert.deepEqual([...SMS_NOTIFICATION_TYPES].sort(), [
      'FAULT_SUBMITTED',
      'TECHNICIAN_ASSIGNED',
    ]);
  });

  it('sends nothing for other notification types', async () => {
    const provider = fakeProvider();
    setSmsProvider(provider);
    await sendSmsForNotifications(
      [notice('JOB_ASSIGNED'), notice('TECHNICIAN_ON_THE_WAY'), notice('FAULT_RESOLVED')],
      '+250788000001'
    );
    assert.equal(provider.sent.length, 0);
  });

  it('sends nothing when there is no phone number', async () => {
    const provider = fakeProvider();
    setSmsProvider(provider);
    await sendSmsForNotifications([notice('FAULT_SUBMITTED')], null);
    await sendSmsForNotifications([notice('FAULT_SUBMITTED')], '');
    assert.equal(provider.sent.length, 0);
  });

  it('sends nothing when there are no notifications', async () => {
    const provider = fakeProvider();
    setSmsProvider(provider);
    await sendSmsForNotifications([], '+250788000001');
    assert.equal(provider.sent.length, 0);
  });

  it('never throws to the caller when the gateway fails', async () => {
    setSmsProvider(fakeProvider(new Error('gateway down')));
    await assert.doesNotReject(
      sendSmsForNotifications([notice('FAULT_SUBMITTED')], '+250788000001')
    );
  });

  it('keeps going after one message fails', async () => {
    const sent = [];
    let calls = 0;
    setSmsProvider({
      send: async (message) => {
        calls += 1;
        if (calls === 1) throw new Error('first fails');
        sent.push(message);
      },
    });
    await sendSmsForNotifications(
      [notice('FAULT_SUBMITTED'), notice('TECHNICIAN_ASSIGNED')],
      '+250788000001'
    );
    assert.equal(sent.length, 1);
  });

  it('whenSmsIdle resolves once a send that was not awaited has finished', async () => {
    const provider = fakeProvider();
    setSmsProvider(provider);
    sendSmsForNotifications([notice('FAULT_SUBMITTED')], '+250788000001'); // not awaited, as in the service
    await whenSmsIdle();
    assert.equal(provider.sent.length, 1);
  });
});

describe('SMS providers', () => {
  it('the default provider logs the message and sends nothing', async () => {
    await new LogSmsProvider().send({ to: '+250788000001', text: 'Hello' });
    const lines = /** @type {any} */ (console.log).mock.calls.map((call) => call.arguments[0]);
    assert.ok(lines.some((line) => line.includes('+250788000001') && line.includes('Hello')));
  });

  it('the Africa’s Talking stub refuses to send until it is implemented', async () => {
    await assert.rejects(
      new AfricasTalkingSmsProvider().send({ to: '+250788000001', text: 'Hello' }),
      /not implemented/i
    );
  });

  it('createSmsProvider picks a provider by name', () => {
    assert.ok(createSmsProvider('log') instanceof LogSmsProvider);
    assert.ok(createSmsProvider('africastalking') instanceof AfricasTalkingSmsProvider);
  });

  it('createSmsProvider rejects an unknown name', () => {
    assert.throws(() => createSmsProvider('carrier-pigeon'), /SMS_PROVIDER/);
  });
});
