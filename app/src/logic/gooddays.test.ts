import { compareGoodDays, PulseEntry } from './pulselog';

describe('compareGoodDays', () => {
  it('unlocks after enough mixed check-ins and compares reasons observationally', () => {
    const log: PulseEntry[] = [
      { date: '2026-09-01', level: 'steady', reason: 'sleep', ts: 1 },
      { date: '2026-09-02', level: 'steady', reason: 'sleep', ts: 2 },
      { date: '2026-09-03', level: 'steady', reason: 'work', ts: 3 },
      { date: '2026-09-04', level: 'flat', reason: 'work', ts: 4 },
      { date: '2026-09-05', level: 'flat', reason: 'people', ts: 5 },
      { date: '2026-09-06', level: 'wired', reason: 'work', ts: 6 },
      { date: '2026-09-07', level: 'wired', reason: 'people', ts: 7 },
    ];
    const result = compareGoodDays(log);
    expect(result.ready).toBe(true);
    expect(result.factors[0].reason).toBe('sleep');
    expect(result.summary).toContain('showed up more often');
    expect(result.pulseQuestion).toContain('Do not claim causation');
  });

  it('stays locked with too little history', () => {
    const result = compareGoodDays([
      { date: '2026-09-01', level: 'steady', reason: 'sleep', ts: 1 },
    ]);
    expect(result.ready).toBe(false);
  });
});
