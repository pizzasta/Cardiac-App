/**
 * Unit tests for the weekly report aggregation in src/logic/weekly.ts.
 *
 * All cases pin `now` to a fixed date so the 7-day window is deterministic.
 * The trailing window for 2026-01-10 is 2026-01-04 .. 2026-01-10 (inclusive).
 *
 * Run with:
 *   npx jest --testPathPattern=weekly.test.ts
 */
import type { PulseEntry } from './pulselog';
import { consistencyPct, headlineFor, weeklyReport, WINDOW_DAYS } from './weekly';

const NOW = new Date('2026-01-10T09:00:00');

// Minimal entry builder. ts is irrelevant to the weekly aggregation.
const entry = (date: string, level: PulseEntry['level']): PulseEntry => ({
  date,
  level,
  ts: Date.parse(date),
});

describe('consistencyPct', () => {
  it('is 0 for an empty log', () => {
    expect(consistencyPct([], NOW)).toBe(0);
  });

  it('is 100 when every day in the window is logged', () => {
    const log = [
      '2026-01-04',
      '2026-01-05',
      '2026-01-06',
      '2026-01-07',
      '2026-01-08',
      '2026-01-09',
      '2026-01-10',
    ].map((d) => entry(d, 'steady'));
    expect(consistencyPct(log, NOW)).toBe(100);
  });

  it('rounds the share of logged days and ignores days outside the window', () => {
    const log = [
      entry('2026-01-09', 'wired'),
      entry('2026-01-10', 'flat'),
      entry('2025-12-20', 'steady'),
    ];
    // 2 / 7 = 0.2857 -> 29
    expect(consistencyPct(log, NOW)).toBe(29);
  });

  it('counts a day once even with multiple check-ins', () => {
    const log = [entry('2026-01-10', 'wired'), entry('2026-01-10', 'flat')];
    // 1 / 7 = 0.1428 -> 14
    expect(consistencyPct(log, NOW)).toBe(14);
  });
});

describe('weeklyReport', () => {
  it('returns a calm, empty-state report for no data', () => {
    const r = weeklyReport([], NOW);
    expect(r.start).toBe('2026-01-04');
    expect(r.end).toBe('2026-01-10');
    expect(r.daysLogged).toBe(0);
    expect(r.consistencyPct).toBe(0);
    expect(r.dominant).toBeNull();
    expect(r.avgEnergy).toBeNull();
    expect(r.headline).toBe('A fresh week to start reading your rhythm.');
  });

  it('tallies the level distribution and picks the dominant level', () => {
    const log = [
      entry('2026-01-06', 'steady'),
      entry('2026-01-07', 'steady'),
      entry('2026-01-08', 'steady'),
      entry('2026-01-09', 'wired'),
      entry('2026-01-10', 'flat'),
    ];
    const r = weeklyReport(log, NOW);
    expect(r.daysLogged).toBe(5);
    expect(r.distribution.steady).toBe(3);
    expect(r.distribution.wired).toBe(1);
    expect(r.distribution.flat).toBe(1);
    expect(r.dominant).toBe('steady');
    expect(r.avgEnergy).not.toBeNull();
  });

  it('excludes entries outside the trailing window', () => {
    const log = [
      entry('2026-01-10', 'wired'),
      entry('2026-01-03', 'flat'),
    ];
    const r = weeklyReport(log, NOW);
    expect(r.daysLogged).toBe(1);
    expect(r.distribution.flat).toBe(0);
    expect(r.distribution.wired).toBe(1);
  });
});

describe('headlineFor', () => {
  it('never guilt-trips an empty week', () => {
    expect(headlineFor(0, null)).toBe('A fresh week to start reading your rhythm.');
  });

  it('celebrates a high-consistency week', () => {
    expect(headlineFor(6, 'steady')).toContain('showed up 6 days');
  });

  it('frames a light week gently with correct pluralization', () => {
    expect(headlineFor(1, 'flat')).toContain('1 day logged');
    expect(headlineFor(2, 'wired')).toContain('2 days logged');
  });
});

describe('WINDOW_DAYS', () => {
  it('is a 7-day week', () => {
    expect(WINDOW_DAYS).toBe(7);
  });
});
