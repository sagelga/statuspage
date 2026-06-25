import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { applyStatusUpdate, mergeStatusData } from '../../src/lib/status-data';
import { persistImmutableFromResponse } from '../../src/lib/history-cache';
import { SERVICES_BY_BRAND } from '../../src/config';
import type { CurrentStatusResponse, StatusResponse } from '../../src/types';

class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length() { return this.store.size; }
  clear() { this.store.clear(); }
  getItem(key: string) { return this.store.get(key) ?? null; }
  key(index: number) { return [...this.store.keys()][index] ?? null; }
  removeItem(key: string) { this.store.delete(key); }
  setItem(key: string, value: string) { this.store.set(key, value); }
}

function buildPartial(brand: 'byteside' | 'sagelga'): StatusResponse {
  const defs = SERVICES_BY_BRAND[brand];
  const services = defs.map((s) => ({
    id: s.id,
    name: s.name,
    icon: s.icon,
    status: 'operational' as const,
    responseTime: 100,
    statusCode: 200,
  }));
  const uptime = new Array(30).fill(99) as number[];
  return {
    status: 'operational',
    checkedAt: '2026-01-01T00:00:00.000Z',
    services,
    history: Object.fromEntries(services.map((s) => [s.id, new Array(30).fill('operational')])),
    dailyUptime: Object.fromEntries(services.map((s) => [s.id, uptime])),
    dailyFuncUptime: Object.fromEntries(services.map((s) => [s.id, uptime])),
  };
}

describe('mergeStatusData (shipped)', () => {
  it('merges sagelga priority payload into existing byteside data', () => {
    const byteside = buildPartial('byteside');
    const sagelga = buildPartial('sagelga');
    const merged = mergeStatusData(byteside, sagelga);
    assert.equal(merged.services.length, 12);
    assert.ok(merged.services.some((s) => s.id === 'sagelga-super'));
    assert.ok(merged.services.some((s) => s.id === 'cloudflare'));
    assert.ok(merged.history!['sagelga-super']);
    assert.ok(merged.history!['cloudflare']);
  });

  it('returns incoming when prev is null', () => {
    const sagelga = buildPartial('sagelga');
    const merged = mergeStatusData(null, sagelga);
    assert.equal(merged.services.length, 7);
  });

  it('applyStatusUpdate preserves cached immutable days when currentOnly arrives', () => {
    const storage = new MemoryStorage();
    (globalThis as { localStorage?: Storage }).localStorage = storage;
    const TZ = 420;
    const byteside = buildPartial('byteside');
    persistImmutableFromResponse(byteside, TZ);

    const currentOnly: CurrentStatusResponse = {
      status: 'degraded',
      checkedAt: '2026-01-01T00:02:00.000Z',
      services: byteside.services.map((s, i) =>
        i === 0 ? { ...s, status: 'degraded', responseTime: 900 } : s,
      ),
      history: {},
    };

    const merged = applyStatusUpdate(byteside, currentOnly, TZ);
    assert.equal(merged.services[0].status, 'degraded');
    assert.equal(merged.history!['cloudflare'][0], 'operational');
    assert.equal(merged.history!['cloudflare'].length, 30);
  });

  it('preserves prior history when incoming is CurrentStatusResponse (empty history)', () => {
    const byteside = buildPartial('byteside');
    const currentOnly: CurrentStatusResponse = {
      status: 'degraded',
      checkedAt: '2026-01-01T00:02:00.000Z',
      services: byteside.services.map((s, i) =>
        i === 0 ? { ...s, status: 'degraded', responseTime: 900 } : s,
      ),
      history: {},
    };
    const merged = mergeStatusData(byteside, currentOnly);
    assert.equal(merged.services[0].status, 'degraded');
    assert.equal(merged.services[0].responseTime, 900);
    assert.ok(merged.history!['cloudflare']);
    assert.equal(merged.history!['cloudflare'].length, 30);
  });
});