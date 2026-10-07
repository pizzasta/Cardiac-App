import {
  BEAT_SECONDS,
  damp,
  daylight,
  groundHeight,
  heartbeat,
  hopHeight,
  HOP_SECONDS,
  mixHex,
  moodMotion,
  ridgeline,
  STATIONS,
  sunElevation,
  sunsetGlow,
  TILE_LENGTH,
} from './rig';

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

describe('groundHeight', () => {
  it('joins seamlessly from one tile to the next', () => {
    for (let x = -20; x <= 20; x += 2.5) {
      expect(groundHeight(x, -TILE_LENGTH / 2)).toBeCloseTo(groundHeight(x, TILE_LENGTH / 2), 6);
    }
  });

  it('keeps a gentle path in the middle and hills at the sides', () => {
    for (let z = -30; z <= 30; z += 3) {
      expect(Math.abs(groundHeight(0, z))).toBeLessThan(0.4);
      expect(groundHeight(18, z)).toBeGreaterThan(groundHeight(0, z));
    }
  });
});

describe('ridgeline', () => {
  it('stays in range and varies along the skyline', () => {
    const hs = Array.from({ length: 200 }, (_, i) => ridgeline(i * 2 - 200, 1));
    hs.forEach((h) => {
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(1);
    });
    expect(Math.max(...hs) - Math.min(...hs)).toBeGreaterThan(0.3);
  });
});

describe('time of day', () => {
  it('puts the sun up by day, low at dusk and below the horizon at night', () => {
    expect(sunElevation(12.5)).toBeGreaterThan(8);
    expect(Math.abs(sunElevation(19))).toBeLessThan(0.5);
    expect(sunElevation(1)).toBeLessThan(-8);
    expect(sunElevation(25)).toBeCloseTo(sunElevation(1));
  });

  it('maps elevation to daylight 0..1', () => {
    expect(daylight(-12)).toBe(0);
    expect(daylight(9)).toBe(1);
    expect(daylight(0)).toBeGreaterThan(0);
    expect(daylight(0)).toBeLessThan(1);
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

describe('mood motion', () => {
  it('is quick for wired, slow and drooping for flat, calm for steady', () => {
    const w = moodMotion('wired');
    const f = moodMotion('flat');
    const s = moodMotion('steady');
    expect(w.speed).toBeGreaterThan(s.speed);
    expect(f.speed).toBeLessThan(s.speed);
    expect(w.bounce).toBeGreaterThan(s.bounce);
    expect(f.droop).toBeGreaterThan(0);
    expect(w.jitter).toBeGreaterThan(0);
    expect(moodMotion(null)).toEqual(expect.objectContaining({ jitter: 0, droop: 0 }));
  });

  it('hops twice and lands', () => {
    expect(hopHeight(-0.1)).toBe(0);
    expect(hopHeight(HOP_SECONDS * 0.3)).toBeCloseTo(0.6, 1);
    expect(hopHeight(HOP_SECONDS * 0.8)).toBeCloseTo(0.2, 1);
    expect(hopHeight(HOP_SECONDS)).toBe(0);
  });
});

describe('sunsetGlow', () => {
  it('peaks at sunset, fades by night and midday, and skips sunrise', () => {
    expect(sunsetGlow(19.2, sunElevation(19.2))).toBeGreaterThan(0.8);
    expect(sunsetGlow(23.5, sunElevation(23.5))).toBeLessThan(0.05);
    expect(sunsetGlow(13, sunElevation(13))).toBeLessThan(0.05);
    expect(sunsetGlow(6.2, sunElevation(6.2))).toBe(0);
  });
});
