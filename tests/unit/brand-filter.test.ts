import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SERVICES_BY_BRAND } from '../../src/config';
import { filterServicesByBrand, isValidBrandParam } from '../../src/lib/brand-filter';

const ALL_SERVICES = [
  ...SERVICES_BY_BRAND.byteside,
  ...SERVICES_BY_BRAND.sagelga,
];

describe('filterServicesByBrand (shipped)', () => {
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

  it('isValidBrandParam accepts only known brands', () => {
    assert.equal(isValidBrandParam('byteside'), true);
    assert.equal(isValidBrandParam('sagelga'), true);
    assert.equal(isValidBrandParam('other'), false);
    assert.equal(isValidBrandParam(null), false);
  });
});