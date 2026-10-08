import { LAYER_IDS, LOOP_SECONDS, renderLayer } from './recipes';
import { mixFor, modeMix, panFor } from './mix';

const RATE = 8000;

describe('soundscape recipes', () => {
  it('renders every layer, finite and within range', () => {
    for (const id of LAYER_IDS) {
      const s = renderLayer(id, RATE);
      expect(s.length).toBeGreaterThan(RATE * 0.3);
      let peak = 0;
      for (const v of s) {
        expect(Number.isFinite(v)).toBe(true);
        peak = Math.max(peak, Math.abs(v));
      }
      expect(peak).toBeGreaterThan(0.1);
      expect(peak).toBeLessThanOrEqual(1);
    }
  });

  it('loops are exactly one loop long and deterministic', () => {
    const a = renderLayer('bed-waves', RATE);
    expect(a.length).toBe(Math.floor(LOOP_SECONDS * RATE));
    expect(renderLayer('bed-waves', RATE)).toEqual(a);
  });
});

describe('mixFor', () => {
  it('swaps day critters for the night chorus', () => {
    const day = mixFor('valley', 1);
    const night = mixFor('valley', 0);
    expect(day.birds).toBeGreaterThan(0);
    expect(day.grasshoppers).toBeGreaterThan(0);
    expect(day.crickets).toBe(0);
    expect(night.crickets).toBeGreaterThan(0);
    expect(night.birds).toBe(0);
  });

  it('gives each world its own bed and calls', () => {
    expect(mixFor('dolphin', 1).bed).toBe('waves');
    expect(mixFor('wolf', 0).calls.map((c) => c.id)).toContain('howl');
    expect(mixFor('wolf', 1).calls).toHaveLength(0);
    expect(mixFor('fox', 1).grasshoppers).toBeGreaterThan(0.5);
  });
});

describe('modeMix and panFor', () => {
  it('steps back behind dense screens', () => {
    expect(modeMix('landing').gain).toBeGreaterThan(modeMix('focus').gain);
    expect(modeMix('focus').muffleHz).toBeLessThan(modeMix('home').muffleHz);
  });

  it('moves a sound across the stereo field as you turn', () => {
    expect(panFor(0, 0)).toBeCloseTo(0);
    expect(panFor(0, 0.5)).toBeGreaterThan(0);
    expect(panFor(0, -0.5)).toBeLessThan(0);
  });
});
