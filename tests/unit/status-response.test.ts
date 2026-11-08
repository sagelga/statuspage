import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCurrentStatusResponse,
  buildFullStatusResponse,
  loadServicesConfig,
  type StatusStore,
} from '../../src/lib/status-response';
import type { ServiceDefinition } from '../../src/types';

const NOW = new Date('2026-01-02T12:00:00.000Z');
const epoch = (iso: string) => Math.floor(Date.parse(iso) / 1000);

const service = (id: string): ServiceDefinition => ({
  id,
  name: `Service ${id}`,
  icon: 'globe',
  url: `https://${id}.example.com`,
});

class MemoryStore implements StatusStore {
  readonly reads: string[] = [];

  constructor(private readonly values: Record<string, string> = {}) {}

  async get(key: string): Promise<string | null> {
    this.reads.push(key);
    return this.values[key] ?? null;
  }
}

describe('loadServicesConfig', () => {
  it('returns 503 when config:services is missing', async () => {
    const result = await loadServicesConfig(new MemoryStore());
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 503);
      assert.equal(result.error, 'Configuration unavailable');
    }
  });

  it('returns 500 when config:services is malformed', async () => {
    const result = await loadServicesConfig(
      new MemoryStore({ 'config:services': '{bad' }),
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 500);
      assert.equal(result.error, 'Configuration parse error');
    }
  });

  it('returns the service definitions', async () => {
    const result = await loadServicesConfig(
      new MemoryStore({
        'config:services': JSON.stringify({ services: [service('a')] }),
      }),
    );
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.services[0].id, 'a');
  });
});

describe('buildCurrentStatusResponse', () => {
  it('uses the latest minute entry without reading the daily summary', async () => {
    const store = new MemoryStore({
      'm:a': JSON.stringify({
        [String(epoch('2026-01-02T11:58:00Z'))]: 'd',
        [String(epoch('2026-01-02T11:59:00Z'))]: 'o',
      }),
      'ping:a': '123',
      'daily:a': JSON.stringify({ '2026-01-02': 'x' }),
    });

    const result = await buildCurrentStatusResponse(store, [service('a')], NOW);

    assert.equal(result.status, 'operational');
    assert.equal(result.checkedAt, NOW.toISOString());
    assert.equal(result.services[0].status, 'operational');
    assert.equal(result.services[0].responseTime, 123);
    assert.equal(result.services[0].url, 'https://a.example.com');
    assert.deepEqual(result.history, {});
    assert.equal(store.reads.includes('daily:a'), false);
  });

  it('falls back to today\'s daily summary when minute data is missing', async () => {
    const store = new MemoryStore({
      'daily:a': JSON.stringify({ '2026-01-02': 'd', '2026-01-01': 'o' }),
    });

    const result = await buildCurrentStatusResponse(store, [service('a')], NOW);

    assert.equal(result.services[0].status, 'degraded');
    assert.equal(result.services[0].responseTime, null);
  });

  it('defaults to operational when no data exists', async () => {
    const result = await buildCurrentStatusResponse(
      new MemoryStore(),
      [service('a')],
      NOW,
    );
    assert.equal(result.services[0].status, 'operational');
  });

  it('aggregates the worst status across services', async () => {
    const store = new MemoryStore({
      'm:a': JSON.stringify({ [String(epoch('2026-01-02T11:59:00Z'))]: 'o' }),
      'm:b': JSON.stringify({ [String(epoch('2026-01-02T11:59:00Z'))]: 'x' }),
    });

    const result = await buildCurrentStatusResponse(
      store,
      [service('a'), service('b')],
      NOW,
    );
    assert.equal(result.status, 'down');
  });
});

describe('buildFullStatusResponse', () => {
  it('builds 30-day history and uptime arrays', async () => {
    const store = new MemoryStore({
      'm:a': JSON.stringify({
        [String(epoch('2026-01-01T00:00:00Z'))]: 'd',
        [String(epoch('2026-01-01T00:01:00Z'))]: 'd',
        [String(epoch('2026-01-02T00:00:00Z'))]: 'o',
        [String(epoch('2026-01-02T00:01:00Z'))]: 'o',
      }),
      'daily:a': JSON.stringify({
        '2026-01-01': 'd',
        '2026-01-02': 'o',
      }),
      'ping:a': '80',
    });

    const result = await buildFullStatusResponse(store, [service('a')], 0, NOW);

    assert.equal(result.services[0].responseTime, 80);
    assert.equal(result.services[0].status, 'operational');
    assert.equal(result.history.a.length, 30);
    assert.equal(result.history.a[28], 'degraded');
    assert.equal(result.history.a[29], 'operational');
    assert.equal(result.dailyUptime?.a.length, 30);
    assert.equal(result.dailyUptime?.a[28], 0);
    assert.equal(result.dailyUptime?.a[29], 100);
    assert.equal(result.dailyFuncUptime?.a[28], 100);
    assert.equal(result.dailyFuncUptime?.a[29], 100);
  });

  it('aligns buckets to a non-UTC local day', async () => {
    // 2026-01-01T17:00Z is local midnight on 2026-01-02 at UTC+7.
    const store = new MemoryStore({
      'm:a': JSON.stringify({
        [String(epoch('2026-01-01T17:00:00Z'))]: 'o',
        [String(epoch('2026-01-01T17:01:00Z'))]: 'd',
      }),
      'daily:a': JSON.stringify({ '2026-01-02': 'o' }),
      'ping:a': '90',
    });

    const result = await buildFullStatusResponse(store, [service('a')], 420, NOW);

    assert.equal(result.dailyUptime?.a[29], 50);
    assert.equal(result.dailyFuncUptime?.a[29], 100);
    assert.equal(result.history.a[29], 'operational');
  });

  it('falls back to daily history when minute data is unavailable', async () => {
    const store = new MemoryStore({
      'daily:a': JSON.stringify({ '2026-01-02': 'x' }),
    });

    const result = await buildFullStatusResponse(store, [service('a')], 0, NOW);

    assert.equal(result.services[0].status, 'down');
    assert.equal(result.history.a[29], 'down');
    assert.equal(result.dailyUptime?.a[29], null);
  });

  it('returns nodata history and operational status when KV is empty', async () => {
    const result = await buildFullStatusResponse(
      new MemoryStore(),
      [service('a')],
      0,
      NOW,
    );

    assert.equal(result.status, 'operational');
    assert.equal(result.history.a.length, 30);
    assert.equal(result.history.a.every((entry) => entry === 'nodata'), true);
    assert.equal(result.dailyUptime?.a.every((entry) => entry === null), true);
  });
});
