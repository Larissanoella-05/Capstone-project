import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import {
  AfricasTalkingSmsProvider,
  LogSmsProvider,
  SMS_NOTIFICATION_TYPES,
  SmsGateProvider,
  createSmsProvider,
  isSmsSimulated,
  sendGuestSms,
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

describe('sendGuestSms', () => {
  const guestTypes = [
    'FAULT_SUBMITTED',
    'TECHNICIAN_ASSIGNED',
    'TECHNICIAN_ON_THE_WAY',
    'TECHNICIAN_ARRIVED',
    'FAULT_RESOLVED',
    'FAULT_CANCELLED',
  ];

  it('sends a text for every stage a guest is followed through', async () => {
    const provider = fakeProvider();
    setSmsProvider(provider);
    await sendGuestSms(
      guestTypes.map((type) => notice(type)),
      '+250788123456'
    );
    assert.equal(provider.sent.length, 6);
    assert.ok(provider.sent.every((message) => message.to === '+250788123456'));
  });

  it('sends nothing for types that are only for staff or the in-app feed', async () => {
    const provider = fakeProvider();
    setSmsProvider(provider);
    await sendGuestSms([notice('JOB_ASSIGNED')], '+250788123456');
    assert.equal(provider.sent.length, 0);
  });

  it('sends nothing without a phone number', async () => {
    const provider = fakeProvider();
    setSmsProvider(provider);
    await sendGuestSms([notice('FAULT_SUBMITTED')], null);
    assert.equal(provider.sent.length, 0);
  });

  it('never throws to the caller when the gateway fails', async () => {
    setSmsProvider(fakeProvider(new Error('gateway down')));
    await assert.doesNotReject(sendGuestSms([notice('FAULT_SUBMITTED')], '+250788123456'));
  });

  it('is waited for by whenSmsIdle, like the other sends', async () => {
    const provider = fakeProvider();
    setSmsProvider(provider);
    sendGuestSms([notice('FAULT_SUBMITTED')], '+250788123456'); // not awaited, as in the service
    await whenSmsIdle();
    assert.equal(provider.sent.length, 1);
  });

  it('leaves registered customers with the two texts they have today', () => {
    assert.equal(SMS_NOTIFICATION_TYPES.size, 2);
  });
});

describe('isSmsSimulated', () => {
  it('is true while the log provider is in use and false once a gateway is set', () => {
    setSmsProvider(new LogSmsProvider());
    assert.equal(isSmsSimulated(), true);
    setSmsProvider(fakeProvider());
    assert.equal(isSmsSimulated(), false);
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

describe('SmsGateProvider', () => {
  /** @type {import('node:http').Server} */
  let server;
  /** @type {{ method?: string, url?: string, authorization?: string, body?: any }[]} */
  let requests;
  let status;
  let baseUrl;

  beforeEach(async () => {
    requests = [];
    status = 202;
    server = createServer((req, res) => {
      let raw = '';
      req.on('data', (chunk) => (raw += chunk));
      req.on('end', () => {
        requests.push({
          method: req.method,
          url: req.url,
          authorization: req.headers.authorization,
          body: JSON.parse(raw),
        });
        res.writeHead(status).end('{}');
      });
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(undefined)));
    baseUrl = `http://127.0.0.1:${/** @type {any} */ (server.address()).port}`;
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(() => resolve(undefined)));
  });

  const provider = () => new SmsGateProvider({ url: baseUrl, user: 'phone', password: 's3cret' });

  it('posts the text to the phone with basic auth and the number in +250 form', async () => {
    await provider().send({ to: '+250788123456', text: 'Report received' });

    assert.equal(requests.length, 1);
    assert.equal(requests[0].method, 'POST');
    assert.equal(requests[0].url, '/message');
    assert.equal(
      requests[0].authorization,
      `Basic ${Buffer.from('phone:s3cret').toString('base64')}`
    );
    assert.deepEqual(requests[0].body, {
      textMessage: { text: 'Report received' },
      phoneNumbers: ['+250788123456'],
    });
  });

  it('throws when the gateway refuses, so the caller can log it', async () => {
    status = 401;
    await assert.rejects(provider().send({ to: '+250788123456', text: 'Hi' }), /401/);
  });

  it('throws when the gateway cannot be reached', async () => {
    const down = new SmsGateProvider({ url: 'http://127.0.0.1:1', user: 'a', password: 'b' });
    await assert.rejects(down.send({ to: '+250788123456', text: 'Hi' }));
  });

  it('refuses to start without the gateway login', () => {
    assert.throws(
      () => new SmsGateProvider({ url: baseUrl, user: '', password: '' }),
      /SMS_GATEWAY_USER/
    );
  });

  it('is not the simulated provider, and a failure stays out of the caller’s way', async () => {
    status = 500;
    setSmsProvider(provider());
    assert.equal(isSmsSimulated(), false);
    await assert.doesNotReject(sendGuestSms([notice('FAULT_SUBMITTED')], '+250788123456'));
    assert.equal(requests.length, 1);
  });
});
