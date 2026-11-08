import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  currentStatusFromDaily,
  parseDailySummary,
  readDailyHistory,
} from '../../src/lib/daily-summary';

describe('parseDailySummary', () => {
  it('returns null for missing or malformed payloads', () => {
    assert.equal(parseDailySummary(null), null);
    assert.equal(parseDailySummary(''), null);
    assert.equal(parseDailySummary('{not-json'), null);
    assert.equal(parseDailySummary('"5"'), null);
    assert.equal(parseDailySummary('null'), null);
  });

  it('normalises object-shaped payloads', () => {
    assert.deepEqual(
      parseDailySummary('{"2026-01-01":"o","2026-01-02":"x"}'),
      { '2026-01-01': 'o', '2026-01-02': 'x' },
    );
  });

  it('normalises array-shaped payloads and ignores invalid entries', () => {
    assert.deepEqual(
      parseDailySummary(
        '[{"date":"2026-01-01","status":"o"},{"date":"2026-01-02","status":"d"},{"date":3,"status":"x"}]',
      ),
      { '2026-01-01': 'o', '2026-01-02': 'd' },
    );
  });
});

describe('readDailyHistory', () => {
  const dates = ['2026-01-01', '2026-01-02'];

  it('returns nodata for every date when there is no summary', () => {
    assert.deepEqual(readDailyHistory(null, 0, dates), ['nodata', 'nodata']);
  });

  it('maps UTC days directly for tzOffset 0', () => {
    const summary = { '2026-01-01': 'o', '2026-01-02': 'x' };
    assert.deepEqual(readDailyHistory(summary, 0, dates), ['operational', 'down']);
  });

  it('merges the previous UTC day for eastern offsets and picks the worse status', () => {
    assert.deepEqual(
      readDailyHistory({ '2025-12-31': 'o', '2026-01-01': 'd' }, 420, ['2026-01-01']),
      ['degraded'],
    );
    assert.deepEqual(
      readDailyHistory({ '2025-12-31': 'x', '2026-01-01': 'o' }, 420, ['2026-01-01']),
      ['down'],
    );
    assert.deepEqual(
      readDailyHistory({ '2025-12-31': 'o', '2026-01-01': 'o' }, 420, ['2026-01-01']),
      ['operational'],
    );
  });

  it('merges the next UTC day for western offsets and picks the worse status', () => {
    assert.deepEqual(
      readDailyHistory({ '2026-01-01': 'x', '2026-01-02': 'o' }, -300, ['2026-01-01']),
      ['down'],
    );
    assert.deepEqual(
      readDailyHistory({ '2026-01-01': 'o', '2026-01-02': 'd' }, -300, ['2026-01-01']),
      ['degraded'],
    );
    assert.deepEqual(
      readDailyHistory({ '2026-01-01': 'o', '2026-01-02': 'o' }, -300, ['2026-01-01']),
      ['operational'],
    );
  });

  it('treats missing dates as nodata', () => {
    assert.deepEqual(readDailyHistory({}, 0, dates), ['nodata', 'nodata']);
  });
});

describe('currentStatusFromDaily', () => {
  it('returns null for missing or nodata entries', () => {
    assert.equal(currentStatusFromDaily(null, '2026-01-01'), null);
    assert.equal(currentStatusFromDaily({}, '2026-01-01'), null);
    assert.equal(
      currentStatusFromDaily({ '2026-01-01': 'nodata' }, '2026-01-01'),
      null,
    );
  });

  it('decodes compact and full codes', () => {
    assert.equal(
      currentStatusFromDaily({ '2026-01-01': 'o' }, '2026-01-01'),
      'operational',
    );
    assert.equal(
      currentStatusFromDaily({ '2026-01-01': 'degraded' }, '2026-01-01'),
      'degraded',
    );
  });
});
