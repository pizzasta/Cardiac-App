import { damp, heartbeat, mixHex, rippleRadius, STATIONS, terrainHeight, BEAT_SECONDS } from './rig';

describe('heartbeat', () => {
  it('beats twice (lub-dub) and then rests', () => {
    const p = BEAT_SECONDS;
    expect(heartbeat(0.06 * p)).toBeCloseTo(1, 1);
    expect(heartbeat(0.16 * p)).toBeGreaterThan(0.6);
    expect(heartbeat(0.6 * p)).toBeLessThan(0.01);
  });

  it('repeats every beat', () => {
    expect(heartbeat(0.3)).toBeCloseTo(heartbeat(0.3 + BEAT_SECONDS), 6);
  });
});

describe('rippleRadius', () => {
  it('grows through each beat and resets', () => {
    expect(rippleRadius(0)).toBe(0);
    expect(rippleRadius(BEAT_SECONDS / 2)).toBeCloseTo(15);
    expect(rippleRadius(BEAT_SECONDS * 1.25)).toBeCloseTo(7.5);
  });
});

describe('terrainHeight', () => {
  it('is finite and bounded', () => {
    for (let x = -20; x <= 20; x += 2.5) {
      for (let z = -40; z <= 10; z += 2.5) {
        const h = terrainHeight(x, z, 1.3, 4.2, 1.4);
        expect(Number.isFinite(h)).toBe(true);
        expect(Math.abs(h)).toBeLessThan(5);
      }
    }
  });

  it('scales with amplitude and flattens to zero', () => {
    expect(terrainHeight(3, -5, 0.5, 1, 0)).toBeCloseTo(0);
    expect(terrainHeight(3, -5, 0.5, 1, 2)).toBeCloseTo(2 * terrainHeight(3, -5, 0.5, 1, 1));
  });
});

describe('stations', () => {
  it('keeps the camera above the terrain and looking forward', () => {
    Object.values(STATIONS).forEach((s) => {
      expect(s.camera[1]).toBeGreaterThan(1);
      expect(s.lookAt[2]).toBeLessThan(s.camera[2]);
      expect(s.glow).toBeGreaterThan(0);
      expect(s.glow).toBeLessThanOrEqual(1);
    });
  });
});

describe('helpers', () => {
  it('damp converges without overshooting', () => {
    let v = 0;
    for (let i = 0; i < 120; i++) v = damp(v, 10, 4, 1 / 60);
    expect(v).toBeGreaterThan(9.9);
    expect(v).toBeLessThanOrEqual(10);
  });

  it('mixHex blends colours', () => {
    expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mixHex('#ff2e7e', '#4fc3f7', 0)).toBe('#ff2e7e');
    expect(mixHex('#ff2e7e', '#4fc3f7', 1)).toBe('#4fc3f7');
  });
});
