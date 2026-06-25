import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BRAND_NAVBAR } from '../../src/lib/brand-navbar';

describe('brand-navbar byteside links', () => {
  const links = BRAND_NAVBAR.byteside.links;

  it('has five nav items matching beta.byteside.one labels', () => {
    assert.equal(links.length, 5);
    assert.deepEqual(
      links.map((l) => l.label),
      ['เกมมิ่ง', 'เทคโนโลยี', 'รีวิว', 'คริปโต', 'บล็อก'],
    );
  });

  it('points to the same href patterns as beta.byteside.one', () => {
    assert.deepEqual(
      links.map((l) => l.href),
      [
        'https://beta.byteside.one/tags/gaming',
        'https://beta.byteside.one/tags/tech',
        'https://beta.byteside.one/tags/review',
        'https://beta.byteside.one/tags/cryptocurrency',
        'https://beta.byteside.one/',
      ],
    );
  });

  it('marks all byteside links as external', () => {
    assert.ok(links.every((l) => l.external === true));
  });

  it('uses image logo with beta home href', () => {
    assert.equal(BRAND_NAVBAR.byteside.useImageLogo, true);
    assert.equal(BRAND_NAVBAR.byteside.brandHref, 'https://beta.byteside.one');
  });
});