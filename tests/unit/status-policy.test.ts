import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregateStatus,
  calculateOperationalPct,
  statusFromUptime,
} from '../../src/lib/status-policy';

describe('aggregateStatus', () => {
  it('is operational when every service is operational', () => {
    assert.equal(aggregateStatus(['operational', 'operational']), 'operational');
    assert.equal(aggregateStatus([]), 'operational');
  });

  it('escalates to degraded when any service is degraded', () => {
    assert.equal(aggregateStatus(['operational', 'degraded']), 'degraded');
  });

  it('escalates to down when any service is down', () => {
    assert.equal(aggregateStatus(['operational', 'degraded', 'down']), 'down');
    assert.equal(aggregateStatus(['down', 'down']), 'down');
  });
});

describe('statusFromUptime', () => {
  it('keeps the daily fallback when uptime is missing', () => {
    assert.equal(statusFromUptime(null, null, 'degraded'), 'degraded');
    assert.equal(statusFromUptime(null, 100, 'nodata'), 'nodata');
  });

  it('treats >= 99.5% operational uptime as operational', () => {
    assert.equal(statusFromUptime(100, 100, 'nodata'), 'operational');
    assert.equal(statusFromUptime(99.5, 20, 'down'), 'operational');
  });

  it('keeps the fallback between 95% and 99.5%', () => {
    assert.equal(statusFromUptime(99.49, 100, 'degraded'), 'degraded');
    assert.equal(statusFromUptime(95, 100, 'down'), 'down');
    assert.equal(statusFromUptime(97, null, 'nodata'), 'nodata');
  });

  it('distinguishes degraded days from truly down days below 95%', () => {
    assert.equal(statusFromUptime(94.9, 96, 'operational'), 'degraded');
    assert.equal(statusFromUptime(94.9, null, 'operational'), 'down');
    assert.equal(statusFromUptime(94.9, 94.9, 'operational'), 'down');
    assert.equal(statusFromUptime(0, 100, 'operational'), 'degraded');
  });
});

describe('calculateOperationalPct', () => {
  it('returns null when there are no known minutes', () => {
    assert.equal(calculateOperationalPct([]), null);
    assert.equal(
      calculateOperationalPct(new Array(1440).fill('nodata')),
      null,
    );
  });

  it('ignores nodata cells and formats to two decimals', () => {
    const minutes = [
      'operational',
      'operational',
      'down',
      'degraded',
      'nodata',
      'nodata',
    ] as const;
    assert.equal(calculateOperationalPct(minutes), '50.00');
  });

  it('returns 100.00 when every known minute is operational', () => {
    assert.equal(calculateOperationalPct(['operational', 'nodata']), '100.00');
  });
});
