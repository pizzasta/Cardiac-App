import { experimentDay, experimentOutcome } from './experiments';

describe('experimentDay', () => {
  const active = {
    id: 'morning-light' as const,
    title: 'Morning light',
    prompt: 'Test',
    days: 5,
    startedAt: '2026-10-01T12:00:00.000Z',
  };

  it('starts on day one', () => {
    expect(experimentDay(active, new Date('2026-10-01T18:00:00.000Z'))).toBe(1);
  });

  it('advances by elapsed days', () => {
    expect(experimentDay(active, new Date('2026-10-03T12:00:00.000Z'))).toBe(3);
  });

  it('caps at the experiment length', () => {
    expect(experimentDay(active, new Date('2026-10-20T12:00:00.000Z'))).toBe(5);
  });
});


describe('experimentOutcome', () => {
  it('compares before and during without claiming causation', () => {
    const log = [
      { date: '2026-09-29', level: 'flat' as const, ts: 1 },
      { date: '2026-09-30', level: 'flat' as const, ts: 2 },
      { date: '2026-10-01', level: 'steady' as const, reason: 'sleep', ts: 3 },
      { date: '2026-10-02', level: 'steady' as const, reason: 'sleep', ts: 4 },
    ];
    const result = experimentOutcome(active, log);
    expect(result.before).toBe('flat');
    expect(result.during).toBe('steady');
    expect(result.commonReason).toBe('sleep');
    expect(result.summary).toContain('not proof');
  });
});
