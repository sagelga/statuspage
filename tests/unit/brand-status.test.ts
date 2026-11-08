import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { brandHasHistory, serviceHasHistory } from '../../src/lib/brand-status';
import type { CurrentStatusResponse, StatusResponse } from '../../src/types';
import { SERVICES_BY_BRAND } from '../../src/config';

describe('brand-status helpers (shipped)', () => {
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