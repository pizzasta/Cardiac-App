import type { PulseEntry } from './pulselog';

// ai.ts reads the RN __DEV__ global at import time.
(global as unknown as { __DEV__: boolean }).__DEV__ = false;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { summarizeCheckIns, hasAI, CHECKIN_SUMMARY_MAX } = require('./ai') as typeof import('./ai');

const NOW = new Date(2026, 9, 8, 12); // 2026-10-08 local

const entry = (date: string, level: PulseEntry['level'], reason?: string): PulseEntry => ({
  date,
  level,
  reason,
  ts: 0,
});

describe('summarizeCheckIns', () => {
  it('returns an empty string when there are no recent check-ins', () => {
    expect(summarizeCheckIns([], 14, NOW)).toBe('');
    expect(summarizeCheckIns([entry('2026-09-01', 'steady')], 14, NOW)).toBe('');
  });

  it('summarizes counts and days, oldest first, within the window', () => {
    const s = summarizeCheckIns(
      [
        entry('2026-10-07', 'flat', 'sleep'),
        entry('2026-10-01', 'steady'),
        entry('2026-09-20', 'wired'), // outside 14 days
        entry('2026-10-08', 'steady', 'people'),
      ],
      14,
      NOW
    );
    expect(s).toContain('3 check-ins in the last 14 days (steady 2, flat 1)');
    expect(s).toContain('2026-10-01 steady; 2026-10-07 flat (sleep); 2026-10-08 steady (people)');
    expect(s).not.toContain('2026-09-20');
    expect(s).not.toContain('—');
  });

  it('caps the summary length', () => {
    const log = Array.from({ length: 14 }, (_, i) =>
      entry(`2026-10-${String(i + 1).padStart(2, '0')}`, 'steady', 'x'.repeat(200))
    );
    expect(summarizeCheckIns(log, 14, NOW).length).toBeLessThanOrEqual(CHECKIN_SUMMARY_MAX);
  });
});

describe('hasAI', () => {
  it('is false with no endpoint configured', () => {
    expect(hasAI()).toBe(false);
  });
});
