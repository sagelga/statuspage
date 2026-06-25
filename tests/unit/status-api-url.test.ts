import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildStatusApiUrl } from '../../src/lib/status-api-url';

describe('buildStatusApiUrl (shipped)', () => {
  it('builds fast current-only URL for a brand', () => {
    const url = buildStatusApiUrl({ tzOffset: 420, brand: 'byteside', currentOnly: true });
    assert.match(url, /^\/api\/status\?/);
    const params = new URLSearchParams(url.split('?')[1]);
    assert.equal(params.get('tzOffset'), '420');
    assert.equal(params.get('brand'), 'byteside');
    assert.equal(params.get('currentOnly'), 'true');
  });

  it('builds full payload URL without brand or currentOnly', () => {
    const url = buildStatusApiUrl({ tzOffset: -300 });
    const params = new URLSearchParams(url.split('?')[1]);
    assert.equal(params.get('tzOffset'), '-300');
    assert.equal(params.get('brand'), null);
    assert.equal(params.get('currentOnly'), null);
  });
});