import { PulseEntry } from './pulselog';
import { findSimilarDays, SIMILAR_DAYS_NOTE } from './similarDays';

const day = (date: string, level: PulseEntry['level'], reason?: string, ts = Date.parse(date)): PulseEntry => ({
  date,
  level,
  reason,
  ts,
});

describe('findSimilarDays', () => {
  const log: PulseEntry[] = [
    day('2026-10-01', 'flat', 'sleep'),
    day('2026-10-02', 'steady', 'work'),
    day('2026-10-03', 'flat', 'sleep'),
    day('2026-10-04', 'steady', 'people'),
    day('2026-10-05', 'flat', 'work'),
    day('2026-10-06', 'wired', 'people'),
    day('2026-10-07', 'flat', 'sleep'),
  ];

  it('finds the closest past days, most similar first', () => {
    const r = findSimilarDays(log);
    expect(r.ready).toBe(true);
    expect(r.matches.map((e) => e.date)).toEqual(['2026-10-03', '2026-10-01', '2026-10-05']);
    expect(r.headline).toBe('3 similar days found');
  });

  it('says what the days had in common in plain words', () => {
    expect(findSimilarDays(log).shared).toBe(
      'On these days you also checked in as Flat. Sleep was selected on 2 of the 3.'
    );
  });

  it('reports the next recorded check-in after each match', () => {
    // After 10-03 → steady, after 10-01 → steady, after 10-05 → wired.
    expect(findSimilarDays(log).whatNext).toBe(
      'Your next recorded check-in was Steady on 2 of those 3 occasions.'
    );
  });

  it('does not count today as what came next', () => {
    const r = findSimilarDays([
      day('2026-10-01', 'steady'),
      day('2026-10-02', 'wired'),
      day('2026-10-03', 'steady'),
      day('2026-10-04', 'wired'),
      day('2026-10-05', 'flat'),
      day('2026-10-06', 'flat'),
    ]);
    // Latest entry (10-06, flat) is "today"; its only match is 10-05, followed by today itself.
    expect(r.matches.map((e) => e.date)).toEqual(['2026-10-05']);
    expect(r.whatNext).toContain('aren’t enough later check-ins');
  });

  it('waits for enough history', () => {
    const r = findSimilarDays([day('2026-10-05', 'steady')]);
    expect(r.ready).toBe(false);
    expect(r.matches).toHaveLength(0);
    expect(r.question).toBe('');
  });

  it('keeps the follow-up question non-predictive', () => {
    expect(findSimilarDays(log).question).toContain('Do not predict');
    expect(SIMILAR_DAYS_NOTE).toContain('doesn’t predict');
  });
});
