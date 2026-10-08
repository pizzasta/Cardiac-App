import { firstWeekRecap, RECAP_MIN_DAYS } from './recap';
import type { PulseEntry } from './pulselog';
import type { RhythmResult } from './score';

const result: RhythmResult = { animal: 'dolphin', peak: 'early morning', crash: '2–4pm', recharge: 'solitude' };

function day(i: number, level: PulseEntry['level'], reason?: string): PulseEntry {
  return { date: `2026-10-${String(i + 1).padStart(2, '0')}`, level, reason, ts: i };
}

describe('firstWeekRecap', () => {
  it('waits for enough different days', () => {
    const log = Array.from({ length: RECAP_MIN_DAYS - 1 }, (_, i) => day(i, 'steady'));
    expect(firstWeekRecap(log, result)).toBeNull();
  });

  it('summarises the week in plain lines', () => {
    const log = [
      day(0, 'flat', 'sleep'),
      day(1, 'flat', 'sleep'),
      day(2, 'steady', 'work'),
      day(3, 'flat', 'nothing'),
      day(4, 'wired'),
    ];
    const r = firstWeekRecap(log, result)!;
    expect(r.days).toBe(5);
    expect(r.dominant).toBe('flat');
    expect(r.lines.join(' ')).toContain('“sleep”');
    expect(r.lines.join(' ')).toContain('solitude');
    expect(r.lines.join(' ')).not.toContain('—');
  });

  it('skips the reason line when no reason was tagged', () => {
    const log = Array.from({ length: 6 }, (_, i) => day(i, 'steady'));
    const r = firstWeekRecap(log, result)!;
    expect(r.lines.some((l) => l.includes('reason'))).toBe(false);
    expect(r.lines.join(' ')).toContain('early morning');
  });

  it('calls it a week only when the check-ins fit in about one', () => {
    const week = Array.from({ length: 5 }, (_, i) => day(i, 'steady'));
    expect(firstWeekRecap(week, result)!.headline).toBe('Your first week');

    const spread: PulseEntry[] = [
      { date: '2026-06-01', level: 'steady', ts: 1 },
      { date: '2026-06-20', level: 'steady', ts: 2 },
      { date: '2026-07-15', level: 'flat', ts: 3 },
      { date: '2026-08-30', level: 'steady', ts: 4 },
      { date: '2026-10-01', level: 'steady', ts: 5 },
    ];
    expect(firstWeekRecap(spread, result)!.headline).toBe('Your first five check-ins');
  });
});
