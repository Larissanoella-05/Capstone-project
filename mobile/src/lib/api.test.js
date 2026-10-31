import { ApiError, api, setUnauthorizedHandler, tokenStore } from './api.js';

const jsonResponse = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

describe('api client', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    setUnauthorizedHandler(null);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('sends the saved token as a Bearer header', async () => {
    await tokenStore.set('abc123');
    global.fetch.mockResolvedValue(jsonResponse(200, { ok: true }));

    await api('/faults');

    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/api\/faults$/);
    expect(options.headers.Authorization).toBe('Bearer abc123');
  });

  it('sends a JSON body with its content type', async () => {
    global.fetch.mockResolvedValue(jsonResponse(201, {}));

    await api('/faults', { method: 'POST', body: { category: 'OTHER' } });

    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(options.body).toBe('{"category":"OTHER"}');
  });

  it('turns a non-JSON failure into an ApiError with the status', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new SyntaxError('Unexpected token <');
      },
    });

    await expect(api('/faults')).rejects.toMatchObject({
      status: 502,
      message: 'The request failed (502).',
    });
  });

  it('uses the message and details from the API error body', async () => {
    const details = [{ field: 'email', message: 'Enter a valid email address.' }];
    global.fetch.mockResolvedValue(
      jsonResponse(400, { error: { message: 'Check the form.', details } })
    );

    const error = await api('/auth/login', { method: 'POST', body: {} }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('Check the form.');
    expect(error.details).toEqual(details);
  });

  it('on a 401 clears the token and calls the unauthorized handler', async () => {
    const handler = jest.fn();
    setUnauthorizedHandler(handler);
    await tokenStore.set('stale');
    global.fetch.mockResolvedValue(
      jsonResponse(401, { error: { message: 'Your session has expired.' } })
    );

    await expect(api('/faults')).rejects.toMatchObject({ status: 401 });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(await tokenStore.get()).toBeNull();
  });

  it('does not treat a wrong password on /auth/login as a signed-out session', async () => {
    const handler = jest.fn();
    setUnauthorizedHandler(handler);
    await tokenStore.set('keep');
    global.fetch.mockResolvedValue(
      jsonResponse(401, { error: { message: 'The email or password is incorrect.' } })
    );

    await expect(api('/auth/login', { method: 'POST', body: {} })).rejects.toMatchObject({
      status: 401,
      message: 'The email or password is incorrect.',
    });

    expect(handler).not.toHaveBeenCalled();
    expect(await tokenStore.get()).toBe('keep');
  });

  it('reports a network failure as status 0', async () => {
    global.fetch.mockRejectedValue(new TypeError('Network request failed'));

    await expect(api('/faults')).rejects.toMatchObject({ status: 0 });
  });

  it('aborts after the timeout with a friendly message', async () => {
    jest.useFakeTimers();
    global.fetch.mockImplementation(
      (_url, { signal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () =>
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
          );
        })
    );

    const pending = api('/faults').catch((e) => e);
    await jest.advanceTimersByTimeAsync(70000);
    const error = await pending;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
    expect(error.message).toBe('The server took too long to answer. Try again.');
  });

  it('rethrows an abort requested by the caller unchanged', async () => {
    const controller = new AbortController();
    global.fetch.mockImplementation(
      (_url, { signal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () =>
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
          );
        })
    );

    const pending = api('/faults', { signal: controller.signal }).catch((e) => e);
    await new Promise((resolve) => setImmediate(resolve));
    controller.abort();

    expect((await pending).name).toBe('AbortError');
  });
});
