import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveFromMinuteMap,
  deriveFromMinuteMapNaive,
} from '../../src/lib/derive-minute-uptime';

/** ~30 days of per-minute epochs (production-scale KV map). */
function buildSyntheticMinuteMap(epochCount: number, startEpoch: number): Record<string, string> {
  const all: Record<string, string> = {};
  for (let i = 0; i < epochCount; i++) {
    const epoch = startEpoch + i * 60;
    all[String(epoch)] = i % 97 === 0 ? 'd' : 'o';
  }
  return all;
}

describe('deriveFromMinuteMap (shipped one-pass path)', () => {
  it('matches naive reference output for a realistic epoch map', () => {
    const nowEpoch = Math.floor(Date.now() / 1000);
    const startEpoch = nowEpoch - 30 * 86400;
    const map = buildSyntheticMinuteMap(43_200, startEpoch);

    const fast = deriveFromMinuteMap(map, 420, nowEpoch);
    const naive = deriveFromMinuteMapNaive(map, 420, nowEpoch);

    assert.equal(fast.currentStatus, naive.currentStatus);
    assert.deepEqual(fast.opPct, naive.opPct);
    assert.deepEqual(fast.funcPct, naive.funcPct);
    assert.equal(fast.opPct.length, 30);
  });

  it('completes 43k-epoch derive faster than naive 30×scan (ab85f25 hot path)', () => {
    const nowEpoch = Math.floor(Date.now() / 1000);
    const startEpoch = nowEpoch - 30 * 86400;
    const map = buildSyntheticMinuteMap(43_200, startEpoch);

    const t0 = performance.now();
    deriveFromMinuteMap(map, 420, nowEpoch);
    const fastMs = performance.now() - t0;

    const t1 = performance.now();
    deriveFromMinuteMapNaive(map, 420, nowEpoch);
    const naiveMs = performance.now() - t1;

    assert.ok(fastMs < naiveMs, `fast ${fastMs}ms should beat naive ${naiveMs}ms`);
    assert.ok(fastMs < 200, `one-pass derive took ${fastMs}ms (expected <200ms locally)`);
  });
});