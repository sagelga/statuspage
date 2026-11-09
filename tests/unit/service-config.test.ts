/**
 * Guards the UI's mirrored service definitions (src/config.ts).
 * Status files themselves are owned by statuspage-pulse; this file only checks
 * the display metadata stays consistent and points at the intended endpoints.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BRANDS, SERVICES_BY_BRAND } from '../../src/config';

const ALL_SERVICES = Object.values(SERVICES_BY_BRAND).flat();

test('every brand has at least one service', () => {
  for (const brand of BRANDS) {
    assert.ok(SERVICES_BY_BRAND[brand.id].length > 0, `${brand.id} has no services`);
  }
});

test('service ids are unique across all brands', () => {
  const ids = ALL_SERVICES.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate service id in config');
});

test('every service has a display name and icon', () => {
  for (const svc of ALL_SERVICES) {
    assert.ok(svc.name.length > 0, `${svc.id} missing name`);
    assert.ok(svc.icon.length > 0, `${svc.id} missing icon`);
  }
});

test('cloudflare points at the unresolved-incident feed', () => {
  const cf = ALL_SERVICES.find((s) => s.id === 'cloudflare');
  assert.ok(cf);
  assert.equal(cf.url, 'https://www.cloudflarestatus.com/api/v2/incidents/unresolved.json');
});

test('notion points at the public status feed, not the authenticated API', () => {
  const notion = ALL_SERVICES.find((s) => s.id === 'notion');
  assert.ok(notion);
  assert.equal(notion.url, 'https://www.notion-status.com/api/v2/incidents.json');
  assert.ok(!notion.url.includes('api.notion.com'), 'must not require a Notion API key');
});
