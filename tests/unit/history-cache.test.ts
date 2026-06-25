import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  brandHasCachedHistory,
  cacheKey,
  hydrateHistoryFromCache,
  isImmutableDayIndex,
  persistImmutableFromResponse,
  readCachedDay,
  writeCachedDay,
} from '../../src/lib/history-cache';
import { SERVICES_BY_BRAND } from '../../src/config';
import type { StatusResponse } from '../../src/types';

const TZ = 420;

class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length() { return this.store.size; }
  clear() { this.store.clear(); }
  getItem(key: string) { return this.store.get(key) ?? null; }
  key(index: number) { return [...this.store.keys()][index] ?? null; }
  removeItem(key: string) { this.store.delete(key); }
  setItem(key: string, value: string) { this.store.set(key, value); }
}

function buildFull(brand: 'byteside' | 'sagelga'): StatusResponse {
  const defs = SERVICES_BY_BRAND[brand];
  const services = defs.map((s) => ({
    id: s.id,
    name: s.name,
    icon: s.icon,
    status: 'operational' as const,
    responseTime: 100,
    statusCode: 200,
  }));
  const op = new Array(30).fill(99) as number[];
  const history = Object.fromEntries(
    services.map((s) => [s.id, new Array(30).fill('operational')]),
  );
  const dailyUptime = Object.fromEntries(services.map((s) => [s.id, op]));
  const dailyFuncUptime = Object.fromEntries(services.map((s) => [s.id, op]));
  return {
    status: 'operational',
    checkedAt: '2026-01-01T00:00:00.000Z',
    services,
    history,
    dailyUptime,
    dailyFuncUptime,
  };
}

describe('history-cache (shipped)', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    (globalThis as { localStorage?: Storage }).localStorage = storage;
  });

  it('isImmutableDayIndex is true for 0-28 and false for today', () => {
    assert.equal(isImmutableDayIndex(0, TZ), true);
    assert.equal(isImmutableDayIndex(28, TZ), true);
    assert.equal(isImmutableDayIndex(29, TZ), false);
  });

  it('writeCachedDay does not overwrite existing immutable entries', () => {
    writeCachedDay(TZ, 'cloudflare', '2026-01-01', {
      status: 'operational',
      opPct: 99,
      funcPct: 99,
    });
    writeCachedDay(TZ, 'cloudflare', '2026-01-01', {
      status: 'down',
      opPct: 0,
      funcPct: 0,
    });
    const cached = readCachedDay(TZ, 'cloudflare', '2026-01-01');
    assert.equal(cached?.status, 'operational');
  });

  it('persistImmutableFromResponse enables brandHasCachedHistory', () => {
    const byteside = buildFull('byteside');
    persistImmutableFromResponse(byteside, TZ);
    assert.equal(brandHasCachedHistory('byteside', TZ), true);
    assert.equal(brandHasCachedHistory('sagelga', TZ), false);
  });

  it('hydrateHistoryFromCache fills immutable indices from storage', () => {
    const byteside = buildFull('byteside');
    persistImmutableFromResponse(byteside, TZ);

    const sparse: StatusResponse = {
      status: 'operational',
      checkedAt: '2026-01-02T00:00:00.000Z',
      services: byteside.services,
      history: Object.fromEntries(
        byteside.services.map((s) => [s.id, new Array(30).fill('nodata')]),
      ),
    };

    const hydrated = hydrateHistoryFromCache(sparse, TZ);
    for (const svc of byteside.services) {
      assert.equal(hydrated.history[svc.id][0], 'operational');
      assert.equal(hydrated.history[svc.id][28], 'operational');
    }
  });

  it('cacheKey is stable and includes version', () => {
    assert.match(cacheKey(TZ, 'cloudflare', '2026-01-01'), /^status-hist:v1:/);
  });
});