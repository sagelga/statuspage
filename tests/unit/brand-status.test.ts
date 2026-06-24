import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { brandHasHistory, countLoadedForBrand, serviceHasHistory } from '../../src/lib/brand-status';
import type { CurrentStatusResponse, StatusResponse } from '../../src/types';
import { SERVICES_BY_BRAND } from '../../src/config';

describe('brand-status helpers (shipped)', () => {
  it('countLoadedForBrand counts only services for the brand', () => {
    const current: CurrentStatusResponse = {
      status: 'operational',
      checkedAt: '2026-01-01T00:00:00.000Z',
      services: SERVICES_BY_BRAND.sagelga.map((s) => ({
        id: s.id,
        name: s.name,
        icon: s.icon,
        status: 'operational',
        responseTime: 50,
        statusCode: 200,
      })),
      history: {},
    };
    assert.equal(countLoadedForBrand(current, 'sagelga'), 7);
    assert.equal(countLoadedForBrand(current, 'byteside'), 0);
  });

  it('serviceHasHistory checks per-service 30-day arrays', () => {
    assert.equal(serviceHasHistory({}, 'cloudflare'), false);
    assert.equal(serviceHasHistory({ cloudflare: new Array(30).fill('operational') }, 'cloudflare'), true);
  });

  it('brandHasHistory is false for CurrentStatusResponse and true after brand full merge', () => {
    const current: CurrentStatusResponse = {
      status: 'operational',
      checkedAt: '2026-01-01T00:00:00.000Z',
      services: [],
      history: {},
    };
    assert.equal(brandHasHistory(current, 'byteside'), false);

    const withHistory: StatusResponse = {
      ...current,
      services: [],
      history: Object.fromEntries(
        SERVICES_BY_BRAND.byteside.map((s) => [s.id, new Array(30).fill('operational')]),
      ),
    };
    assert.equal(brandHasHistory(withHistory, 'byteside'), true);
  });
});