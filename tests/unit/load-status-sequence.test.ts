import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadStatusSequence } from '../../src/lib/load-status-sequence';
import type { CurrentStatusResponse, StatusResponse } from '../../src/types';

function withTodayUptime(services: StatusResponse['services']): StatusResponse['dailyUptime'] {
  return Object.fromEntries(
    services.map((s) => [s.id, [...new Array(29).fill(98), 99]]),
  );
}

const SAGELGA_CURRENT: CurrentStatusResponse = {
  status: 'operational',
  checkedAt: '2026-01-01T00:00:00.000Z',
  services: [{ id: 'sagelga-super', name: 'sagelga.com', icon: 'globe', status: 'operational', responseTime: 100, statusCode: 200 }],
  history: {},
};

const SAGELGA_BRAND_FULL: StatusResponse = {
  status: 'operational',
  checkedAt: '2026-01-01T00:00:30.000Z',
  services: [{ id: 'sagelga-super', name: 'sagelga.com', icon: 'globe', status: 'operational', responseTime: 100, statusCode: 200 }],
  history: { 'sagelga-super': new Array(30).fill('operational') },
  dailyUptime: { 'sagelga-super': [...new Array(29).fill(98), 99] },
  dailyFuncUptime: { 'sagelga-super': [...new Array(29).fill(98), 99] },
};

const BYTESIDE_CURRENT: CurrentStatusResponse = {
  status: 'operational',
  checkedAt: '2026-01-01T00:01:00.000Z',
  services: [{ id: 'cloudflare', name: 'cf', icon: 'shield', status: 'operational', responseTime: 50, statusCode: 200 }],
  history: {},
};

const BYTESIDE_BRAND_FULL: StatusResponse = {
  status: 'operational',
  checkedAt: '2026-01-01T00:01:30.000Z',
  services: [{ id: 'cloudflare', name: 'cf', icon: 'shield', status: 'operational', responseTime: 50, statusCode: 200 }],
  history: { cloudflare: new Array(30).fill('operational') },
  dailyUptime: withTodayUptime([{ id: 'cloudflare', name: 'cf', icon: 'shield', status: 'operational', responseTime: 50, statusCode: 200 }]),
  dailyFuncUptime: withTodayUptime([{ id: 'cloudflare', name: 'cf', icon: 'shield', status: 'operational', responseTime: 50, statusCode: 200 }]),
};

describe('loadStatusSequence (shipped)', () => {
  it('calls active current-only, active brand-full, then other-brand preload (no all-full)', async () => {
    const urls: string[] = [];
    let current: StatusResponse | null = null;
    const updates: StatusResponse[] = [];

    const mockFetch = async (url: string) => {
      urls.push(url);
      if (url.includes('currentOnly=true') && url.includes('brand=sagelga')) {
        return new Response(JSON.stringify(SAGELGA_CURRENT), { status: 200 });
      }
      if (url.includes('brand=sagelga') && !url.includes('currentOnly')) {
        return new Response(JSON.stringify(SAGELGA_BRAND_FULL), { status: 200 });
      }
      if (url.includes('currentOnly=true') && url.includes('brand=byteside')) {
        return new Response(JSON.stringify(BYTESIDE_CURRENT), { status: 200 });
      }
      if (url.includes('brand=byteside') && !url.includes('currentOnly')) {
        return new Response(JSON.stringify(BYTESIDE_BRAND_FULL), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    };

    const result = await loadStatusSequence({
      brand: 'sagelga',
      fetch: mockFetch,
      withPriority: true,
      getCurrent: () => current,
      onUpdate: (data) => {
        current = data;
        updates.push(data);
      },
    });

    assert.equal(urls.length, 4);
    assert.match(urls[0], /brand=sagelga/);
    assert.match(urls[0], /currentOnly=true/);
    assert.match(urls[1], /brand=sagelga/);
    assert.doesNotMatch(urls[1], /currentOnly=true/);
    assert.match(urls[2], /brand=byteside/);
    assert.match(urls[2], /currentOnly=true/);
    assert.match(urls[3], /brand=byteside/);
    assert.doesNotMatch(urls[3], /currentOnly=true/);
    assert.ok(urls.every((u) => u.includes('brand=')));
    assert.equal(result.hadPriority, true);
    assert.equal(result.hadBrandFull, true);
    assert.equal(result.hadOtherBrandPreload, true);
    assert.equal(updates.length, 4);
    assert.ok(updates[3].services.some((s) => s.id === 'cloudflare'));
  });

  it('skips priority fetch when withPriority is false (refresh path)', async () => {
    const urls: string[] = [];
    await loadStatusSequence({
      brand: 'sagelga',
      fetch: async (url) => {
        urls.push(url);
        if (url.includes('brand=sagelga') && !url.includes('currentOnly')) {
          return new Response(JSON.stringify(SAGELGA_BRAND_FULL), { status: 200 });
        }
        if (url.includes('brand=byteside') && !url.includes('currentOnly')) {
          return new Response(JSON.stringify(BYTESIDE_BRAND_FULL), { status: 200 });
        }
        if (url.includes('currentOnly=true')) {
          return new Response(JSON.stringify(SAGELGA_CURRENT), { status: 200 });
        }
        return new Response('{}', { status: 404 });
      },
      withPriority: false,
      getCurrent: () => null,
      onUpdate: () => {},
    });

    assert.ok(urls.every((u) => u.includes('brand=')));
    assert.doesNotMatch(urls[0], /currentOnly=true/);
    assert.match(urls[0], /brand=sagelga/);
  });
});