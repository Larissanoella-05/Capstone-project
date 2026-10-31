/**
 * Simple load test for the read endpoints the three dashboards poll every few seconds.
 * Read-only: it signs in as the demo coordinator and only sends GET requests.
 *
 *   npm run test:perf                                   # local API on :4000
 *   API_URL=https://your-api.example.com npm run test:perf
 *   REQUESTS=400 CONCURRENCY=20 npm run test:perf
 *
 * Prints, per endpoint: requests, errors, throughput and latency percentiles (ms).
 */
import { performance } from 'node:perf_hooks';
import { pathToFileURL } from 'node:url';

const API = `${(process.env.API_URL || 'http://localhost:4000').replace(/\/$/, '')}/api`;
const REQUESTS = Number(process.env.REQUESTS) || 200;
const CONCURRENCY = Number(process.env.CONCURRENCY) || 10;
const EMAIL = process.env.LOAD_EMAIL || 'grace@demo.rw';
const PASSWORD = process.env.LOAD_PASSWORD || 'demo1234';

/** Value at percentile p (0–100) of an already sorted array (nearest-rank method). */
export function percentile(sorted, p) {
  if (!sorted.length) return null;
  const rank = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.min(sorted.length - 1, Math.max(0, rank))];
}

async function timedGet(path, token) {
  const start = performance.now();
  try {
    const response = await fetch(`${API}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    await response.arrayBuffer();
    return { ms: performance.now() - start, ok: response.ok };
  } catch {
    return { ms: performance.now() - start, ok: false };
  }
}

/** Sends `total` requests with at most `concurrency` in flight at once. */
async function run(path, token) {
  const timings = [];
  let errors = 0;
  let sent = 0;
  const started = performance.now();

  async function worker() {
    while (sent < REQUESTS) {
      sent += 1;
      const { ms, ok } = await timedGet(path, token);
      timings.push(ms);
      if (!ok) errors += 1;
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const seconds = (performance.now() - started) / 1000;
  timings.sort((a, b) => a - b);
  const round = (value) => (value === null ? '—' : Math.round(value));
  return {
    endpoint: `GET ${path.split('?')[0]}`,
    requests: timings.length,
    errors,
    'req/s': Math.round(timings.length / seconds),
    p50: round(percentile(timings, 50)),
    p95: round(percentile(timings, 95)),
    p99: round(percentile(timings, 99)),
    max: round(timings.at(-1)),
  };
}

async function main() {
  const loginResponse = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!loginResponse.ok)
    throw new Error(`Login failed (${loginResponse.status}). Is the API running and seeded?`);
  const { token } = await loginResponse.json();

  const faults = await (
    await fetch(`${API}/faults?status=ALL`, { headers: { Authorization: `Bearer ${token}` } })
  ).json();
  const faultId = faults.faults?.[0]?.id;

  console.log(
    `Load test against ${API}: ${REQUESTS} requests per endpoint, ${CONCURRENCY} concurrent\n`
  );
  const endpoints = [
    '/health',
    '/faults?status=ALL',
    '/stats/overview',
    '/stats/analytics',
    '/notifications',
  ];
  if (faultId) endpoints.push(`/faults/${faultId}`, `/technicians?faultId=${faultId}`);

  const rows = [];
  for (const path of endpoints) rows.push(await run(path, path === '/health' ? null : token));
  console.table(rows);

  if (rows.some((row) => row.errors > 0)) process.exitCode = 1;
}

// Run only when started directly (pathToFileURL makes this work on Windows paths too).
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
