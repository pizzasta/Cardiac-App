import { orbScale, phaseAt, RESETS, resetFor, totalSecs } from './reset';

describe('resetFor', () => {
  it('matches the pattern to the check-in state', () => {
    expect(resetFor('wired').id).toBe('long-exhale');
    expect(resetFor('flat').id).toBe('brighten');
    expect(resetFor('steady').id).toBe('box');
    expect(resetFor(null).id).toBe('box');
  });

  it('keeps every reset around one minute', () => {
    Object.values(RESETS).forEach((p) => {
      expect(totalSecs(p)).toBeGreaterThanOrEqual(55);
      expect(totalSecs(p)).toBeLessThanOrEqual(70);
    });
  });

  it('gives wired a longer exhale than inhale', () => {
    const [inhale, exhale] = RESETS.wired.phases;
    expect(exhale.secs).toBeGreaterThan(inhale.secs);
  });
});

describe('phaseAt', () => {
  const p = RESETS.wired; // in 4, out 6, x6

  it('starts on the in-breath', () => {
    const s = phaseAt(p, 0);
    expect(s.phase.kind).toBe('in');
    expect(s.round).toBe(1);
    expect(s.secsLeft).toBe(4);
  });

  it('moves to the out-breath and later rounds', () => {
    expect(phaseAt(p, 5).phase.kind).toBe('out');
    expect(phaseAt(p, 11).round).toBe(2);
  });

  it('finishes after the last round', () => {
    expect(phaseAt(p, totalSecs(p)).done).toBe(true);
  });
});

describe('orbScale', () => {
  it('grows on the in-breath and holds full after it', () => {
    const box = RESETS.steady;
    expect(orbScale(box, phaseAt(box, 0))).toBeCloseTo(0.55);
    expect(orbScale(box, phaseAt(box, 2))).toBeCloseTo(0.775);
    expect(orbScale(box, phaseAt(box, 5))).toBe(1); // hold after in
    expect(orbScale(box, phaseAt(box, 13))).toBe(0.55); // hold after out
  });
});
