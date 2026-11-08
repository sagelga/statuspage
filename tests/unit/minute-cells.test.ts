import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildMinuteCells, MINUTES_PER_DAY } from '../../src/lib/minute-cells';
import { parseMinuteMap } from '../../src/lib/minute-map';

const epoch = (iso: string) => Math.floor(Date.parse(iso) / 1000);

describe('parseMinuteMap', () => {
  it('returns null for missing or malformed payloads', () => {
    assert.equal(parseMinuteMap(null), null);
    assert.equal(parseMinuteMap(''), null);
    assert.equal(parseMinuteMap('{bad'), null);
    assert.equal(parseMinuteMap('[]'), null);
    assert.equal(parseMinuteMap('"value"'), null);
  });

  it('parses an epoch-keyed object', () => {
    assert.deepEqual(parseMinuteMap('{"1767326400":"o"}'), {
      '1767326400': 'o',
    });
  });
});

describe('buildMinuteCells', () => {
  it('returns 1440 nodata cells when there is no map', () => {
    const cells = buildMinuteCells(null, '2026-01-02', 0);
    assert.equal(cells.length, MINUTES_PER_DAY);
    assert.equal(cells.every((cell) => cell === 'nodata'), true);
  });

  it('maps UTC epochs onto minute indices for tzOffset 0', () => {
    const cells = buildMinuteCells(
      {
        [String(epoch('2026-01-02T00:00:00Z'))]: 'o',
        [String(epoch('2026-01-02T00:01:00Z'))]: 'x',
        [String(epoch('2026-01-02T23:59:00Z'))]: 'd',
      },
      '2026-01-02',
      0,
    );

    assert.equal(cells[0], 'operational');
    assert.equal(cells[1], 'down');
    assert.equal(cells[1439], 'degraded');
  });

  it('shifts the day window for eastern timezones', () => {
    // UTC+7 local midnight on 2026-01-02 is 17:00 UTC on 2026-01-01.
    const cells = buildMinuteCells(
      {
        [String(epoch('2026-01-01T16:59:00Z'))]: 'x', // previous local day
        [String(epoch('2026-01-01T17:00:00Z'))]: 'o', // local 00:00
        [String(epoch('2026-01-02T16:59:00Z'))]: 'd', // local 23:59
        [String(epoch('2026-01-02T17:00:00Z'))]: 'x', // next local day
      },
      '2026-01-02',
      420,
    );

    assert.equal(cells[0], 'operational');
    assert.equal(cells[1439], 'degraded');
    assert.equal(cells.filter((cell) => cell === 'down').length, 0);
  });

  it('ignores entries outside the requested day and decodes full names', () => {
    const cells = buildMinuteCells(
      {
        [String(epoch('2026-01-03T00:00:00Z'))]: 'operational',
        [String(epoch('2026-01-02T12:00:00Z'))]: 'degraded',
      },
      '2026-01-02',
      0,
    );

    assert.equal(cells[720], 'degraded');
    assert.equal(cells[0], 'nodata');
  });

  it('returns nodata for an invalid date', () => {
    const cells = buildMinuteCells(
      { [String(epoch('2026-01-02T12:00:00Z'))]: 'o' },
      'not-a-date',
      0,
    );
    assert.equal(cells.every((cell) => cell === 'nodata'), true);
  });
});
