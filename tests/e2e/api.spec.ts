import { test, expect } from '@playwright/test';

/**
 * API endpoint tests — these hit the real route handlers (no browser UI).
 *
 * ENVIRONMENT NOTE: The routes read the STATUS_HISTORY KV namespace. The plain
 * `next dev` server has an empty local KV, so /api/status correctly returns 503
 * (missing config:services). Run these against a populated environment:
 *
 *   # terminal 1
 *   npm run preview            # serves http://localhost:8787
 *   # terminal 2
 *   CLOUDFLARE_ENV=1 PLAYWRIGHT_BASE_URL=http://localhost:8787 \
 *     npx playwright test tests/e2e/api.spec.ts
 *
 * The suite is marked fixme unless CLOUDFLARE_ENV is set.
 */
const CLOUDFLARE_ENV = !!process.env.CLOUDFLARE_ENV;

test.describe('GET /api/status', () => {
  test.fixme(!CLOUDFLARE_ENV, 'Requires a populated STATUS_HISTORY KV. Run with CLOUDFLARE_ENV=1 against an OpenNext preview/deploy.');
  test('returns HTTP 200', async ({ request }) => {
    const res = await request.get('/api/status');
    expect(res.status()).toBe(200);
  });

  test('returns JSON content-type', async ({ request }) => {
    const res = await request.get('/api/status');
    expect(res.headers()['content-type']).toContain('application/json');
  });

  test('response has required top-level fields', async ({ request }) => {
    const res = await request.get('/api/status');
    const body = await res.json();

    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('checkedAt');
    expect(body).toHaveProperty('services');
    expect(body).toHaveProperty('history');
  });

  test('status field is one of: operational | degraded | down', async ({ request }) => {
    const res = await request.get('/api/status');
    const body = await res.json();
    expect(['operational', 'degraded', 'down']).toContain(body.status);
  });

  test('checkedAt is a valid ISO-8601 date string', async ({ request }) => {
    const res = await request.get('/api/status');
    const body = await res.json();
    const parsed = new Date(body.checkedAt);
    expect(parsed.toString()).not.toBe('Invalid Date');
  });

  test('services is a non-empty array', async ({ request }) => {
    const res = await request.get('/api/status');
    const body = await res.json();
    expect(Array.isArray(body.services)).toBe(true);
    expect(body.services.length).toBeGreaterThan(0);
  });

  test('every service entry has required fields', async ({ request }) => {
    const res = await request.get('/api/status');
    const body = await res.json();

    for (const svc of body.services) {
      expect(svc).toHaveProperty('id');
      expect(svc).toHaveProperty('name');
      expect(svc).toHaveProperty('icon');
      expect(svc).toHaveProperty('status');
      expect(['operational', 'degraded', 'down']).toContain(svc.status);
      // responseTime is number or null, statusCode is number or null
      expect(svc.responseTime === null || typeof svc.responseTime === 'number').toBe(true);
      expect(svc.statusCode === null || typeof svc.statusCode === 'number').toBe(true);
    }
  });

  test('history is an object keyed by service id', async ({ request }) => {
    const res = await request.get('/api/status');
    const body = await res.json();

    expect(typeof body.history).toBe('object');
    expect(body.history).not.toBeNull();

    // Each key should map to an array
    for (const [, arr] of Object.entries(body.history)) {
      expect(Array.isArray(arr)).toBe(true);
    }
  });

  test('history arrays contain only valid status values', async ({ request }) => {
    const res = await request.get('/api/status');
    const body = await res.json();
    const valid = new Set(['operational', 'degraded', 'down', 'nodata']);

    for (const [, arr] of Object.entries(body.history) as [string, string[]][]) {
      for (const entry of arr) {
        expect(valid.has(entry)).toBe(true);
      }
    }
  });

  test('response is fresh (checkedAt within last 60 seconds)', async ({ request }) => {
    const before = Date.now();
    const res = await request.get('/api/status');
    const body = await res.json();
    const checked = new Date(body.checkedAt).getTime();
    // The check is performed server-side; allow generous window for CI
    expect(checked).toBeGreaterThan(before - 60_000);
    expect(checked).toBeLessThanOrEqual(Date.now() + 5_000);
  });
});

test.describe('GET /api/minutes/:serviceId/:date', () => {
  test.fixme(!CLOUDFLARE_ENV, 'Requires a populated STATUS_HISTORY KV. Run with CLOUDFLARE_ENV=1 against an OpenNext preview/deploy.');

  const TODAY = new Date().toISOString().slice(0, 10);
  const SERVICE_IDS = ['cloudflare', 'website', 'r2-content', 'notion-sync', 'notion'];

  for (const id of SERVICE_IDS) {
    test(`returns 200 for service "${id}"`, async ({ request }) => {
      const res = await request.get(`/api/minutes/${id}/${TODAY}`);
      expect(res.status()).toBe(200);
    });
  }

  test('returns an array of exactly 1440 entries', async ({ request }) => {
    const res = await request.get(`/api/minutes/website/${TODAY}`);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1440);
  });

  test('entries contain only valid status values', async ({ request }) => {
    const res = await request.get(`/api/minutes/website/${TODAY}`);
    const body: string[] = await res.json();
    const valid = new Set(['operational', 'degraded', 'down', 'nodata']);
    for (const entry of body) {
      expect(valid.has(entry)).toBe(true);
    }
  });
});
