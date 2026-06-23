import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadStatusSequence } from '../../src/lib/load-status-sequence';
import type { StatusResponse } from '../../src/types';

const SAGELGA_PARTIAL: StatusResponse = {
  status: 'operational',
  checkedAt: '2026-01-01T00:00:00.000Z',
  services: [{ id: 'sagelga-super', name: 'sagelga.com', icon: 'globe', status: 'operational', responseTime: 100, statusCode: 200 }],
  history: { 'sagelga-super': new Array(30).fill('operational') },
};

const FULL: StatusResponse = {
  status: 'operational',
  checkedAt: '2026-01-01T00:01:00.000Z',
  services: [
    { id: 'cloudflare', name: 'cf', icon: 'shield', status: 'operational', responseTime: 50, statusCode: 200 },
    { id: 'sagelga-super', name: 'sagelga.com', icon: 'globe', status: 'operational', responseTime: 100, statusCode: 200 },
  ],
  history: {
    cloudflare: new Array(30).fill('operational'),
    'sagelga-super': new Array(30).fill('operational'),
  },
};

describe('loadStatusSequence (shipped)', () => {
  it('calls brand-filtered fetch before unfiltered fetch on initial load', async () => {
    const urls: string[] = [];
    let current: StatusResponse | null = null;
    const updates: StatusResponse[] = [];

    const mockFetch = async (url: string) => {
      urls.push(url);
      if (url.includes('brand=sagelga')) {
        await new Promise((r) => setTimeout(r, 50));
        return new Response(JSON.stringify(SAGELGA_PARTIAL), { status: 200 });
      }
      return new Response(JSON.stringify(FULL), { status: 200 });
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

    assert.equal(urls.length, 2);
    assert.match(urls[0], /brand=sagelga/);
    assert.doesNotMatch(urls[0], /brand=byteside/);
    assert.match(urls[1], /\/api\/status\?tzOffset=/);
    assert.doesNotMatch(urls[1], /brand=/);
    assert.equal(result.hadPriority, true);
    assert.equal(result.hadFull, true);
    assert.equal(updates.length, 2);
    assert.equal(updates[0].services.length, 1);
    assert.equal(updates[1].services.length, 2);
  });

  it('skips priority fetch when withPriority is false (refresh path)', async () => {
    const urls: string[] = [];
    await loadStatusSequence({
      brand: 'sagelga',
      fetch: async (url) => {
        urls.push(url);
        return new Response(JSON.stringify(FULL), { status: 200 });
      },
      withPriority: false,
      getCurrent: () => null,
      onUpdate: () => {},
    });

    assert.equal(urls.length, 1);
    assert.doesNotMatch(urls[0], /brand=/);
  });
});