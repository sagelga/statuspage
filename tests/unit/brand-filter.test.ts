import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SERVICES_BY_BRAND, BrandId } from '../../src/config';

function filterServicesByBrand<T extends { id: string }>(
  services: T[],
  brand: BrandId,
): T[] {
  const brandIds = new Set(SERVICES_BY_BRAND[brand].map((s) => s.id));
  return services.filter((s) => brandIds.has(s.id));
}

const ALL_SERVICES = [
  ...SERVICES_BY_BRAND.byteside,
  ...SERVICES_BY_BRAND.sagelga,
];

describe('filterServicesByBrand', () => {
  it('returns 5 byteside services when brand=byteside', () => {
    const result = filterServicesByBrand(ALL_SERVICES, 'byteside');
    assert.equal(result.length, 5);
    assert.ok(result.every((s) => SERVICES_BY_BRAND.byteside.some((b) => b.id === s.id)));
  });

  it('returns 7 sagelga services when brand=sagelga', () => {
    const result = filterServicesByBrand(ALL_SERVICES, 'sagelga');
    assert.equal(result.length, 7);
    assert.ok(result.every((s) => SERVICES_BY_BRAND.sagelga.some((b) => b.id === s.id)));
  });

  it('returns all services when no brand filter is applied', () => {
    assert.equal(ALL_SERVICES.length, 12);
  });
});