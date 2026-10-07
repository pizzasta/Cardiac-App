import { experimentDay } from './experiments';

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
