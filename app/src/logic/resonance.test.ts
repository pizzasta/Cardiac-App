import { readResonance } from './resonance';
import { PulseEntry } from './pulselog';

describe('readResonance', () => {
  it('finds recorded days that rhyme with the latest check-in', () => {
    const log: PulseEntry[] = [
      { date: '2026-10-01', level: 'flat', reason: 'sleep', ts: 1 },
      { date: '2026-10-02', level: 'steady', reason: 'work', ts: 2 },
      { date: '2026-10-03', level: 'flat', reason: 'sleep', ts: 3 },
      { date: '2026-10-04', level: 'wired', reason: 'people', ts: 4 },
      { date: '2026-10-05', level: 'flat', reason: 'sleep', ts: 5 },
    ];
    const result = readResonance(log);
    expect(result.ready).toBe(true);
    expect(result.matches.map((entry) => entry.date)).toEqual(['2026-10-03', '2026-10-01']);
    expect(result.thread).toContain('rhyme');
    expect(result.pulseQuestion).toContain('Matching recorded days');
  });

  it('waits for enough history', () => {
    const result = readResonance([{ date: '2026-10-05', level: 'steady', ts: 1 }]);
    expect(result.ready).toBe(false);
    expect(result.matches).toHaveLength(0);
  });
});
