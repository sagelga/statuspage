import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mergeStatusData } from '../../src/lib/status-data';
import { SERVICES_BY_BRAND } from '../../src/config';
import type { CurrentStatusResponse, StatusResponse } from '../../src/types';

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
  return {
    status: 'operational',
    checkedAt: '2026-01-01T00:00:00.000Z',
    services,
    history: Object.fromEntries(services.map((s) => [s.id, new Array(30).fill('operational')])),
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