// Rhythm World — the pure math behind the 3D scene: where the camera sits on
// each screen, the shape of the waveform landscape, and the heartbeat timing.
// UI-free so it can be unit-tested without a GPU.

export type WorldMode = 'landing' | 'quiz' | 'reading' | 'reveal' | 'home' | 'focus' | 'reset';

export interface Station {
  camera: [number, number, number];
  lookAt: [number, number, number];
  // How fast the landscape scrolls toward the camera (world units / second).
  travel: number;
  // Height of the terrain waves.
  amplitude: number;
  // Overall brightness of the scene (0–1); lower behind text-heavy screens.
  glow: number;
}

export const STATIONS: Record<WorldMode, Station> = {
  // Wide, high view over the landscape with the horizon glow.
  landing: { camera: [0, 3.2, 9], lookAt: [0, 0.8, -12], travel: 0.6, amplitude: 1, glow: 1 },
  // Low and moving: you're travelling through the world while answering.
  quiz: { camera: [0, 1.7, 7], lookAt: [0, 0.9, -10], travel: 1.6, amplitude: 0.9, glow: 0.85 },
  // The dive while your rhythm is read: fast and close to the ground.
  reading: { camera: [0, 1.1, 5], lookAt: [0, 0.6, -14], travel: 7, amplitude: 1.4, glow: 1 },
  // Arrival: settled, looking up at your animal on the horizon.
  reveal: { camera: [0, 1.4, 6], lookAt: [0, 2.2, -12], travel: 0.3, amplitude: 0.8, glow: 1 },
  // Home base (plan): calm, gently drifting.
  home: { camera: [0, 2.6, 8], lookAt: [0, 1, -12], travel: 0.4, amplitude: 0.75, glow: 0.8 },
  // Behind dense screens (Today, check-in, trends, Ask): lower and dimmer.
  focus: { camera: [0, 6.5, 7], lookAt: [0, 0, -3], travel: 0.25, amplitude: 0.6, glow: 0.5 },
  // The breathing reset: almost still.
  reset: { camera: [0, 2, 7], lookAt: [0, 1.6, -12], travel: 0.08, amplitude: 0.5, glow: 0.9 },
};

// Seconds per heartbeat. Slow on purpose: the world should feel calm.
export const BEAT_SECONDS = 2.6;

// 0–1 strength of the "lub-dub" at time t: two quick pulses, then rest.
export function heartbeat(t: number, period = BEAT_SECONDS): number {
  const p = (((t % period) + period) % period) / period;
  const pulse = (center: number, width: number) => Math.exp(-(((p - center) / width) ** 2));
  return Math.min(1, pulse(0.06, 0.03) + 0.7 * pulse(0.16, 0.03));
}

// Radius of the ripple ring that rolls out from the horizon after each beat.
export function rippleRadius(t: number, period = BEAT_SECONDS, maxRadius = 30): number {
  const p = (((t % period) + period) % period) / period;
  return p * maxRadius;
}

// Terrain height at (x, z). `scroll` moves the landscape toward the camera.
// Rolling dunes, plus a sharp ECG-style ridge down the middle that echoes the
// app's pulse line, plus the heartbeat ripple.
export function terrainHeight(
  x: number,
  z: number,
  t: number,
  scroll: number,
  amplitude = 1,
  origin: [number, number] = [0, -14]
): number {
  const zz = z - scroll;
  const dunes = 0.35 * Math.sin(x * 0.35 + zz * 0.22) + 0.25 * Math.sin(x * 0.8 - zz * 0.31 + t * 0.2);
  // Valley floor flattens toward the centre so the camera has a path.
  const valley = Math.min(1, Math.abs(x) / 6);
  // ECG ridge: a narrow spike along x≈0 that repeats down the z axis.
  const beatZ = (((zz % 9) + 9) % 9) / 9;
  const spike = Math.exp(-(((beatZ - 0.5) / 0.03) ** 2)) * Math.exp(-((x / 0.9) ** 2)) * 1.2;
  // Heartbeat ripple from the origin.
  const dx = x - origin[0];
  const dz = z - origin[1];
  const d = Math.sqrt(dx * dx + dz * dz);
  const ring = Math.exp(-(((d - rippleRadius(t)) / 1.2) ** 2)) * 0.35;
  return amplitude * (dunes * (0.25 + 0.75 * valley) + spike + ring);
}

// Frame-rate–independent smoothing toward a target.
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

// Mix two #rrggbb colours.
export function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (p: number, s: number) => (p >> s) & 255;
  const k = Math.max(0, Math.min(1, t));
  const out = [16, 8, 0].map((s) => Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * k));
  return '#' + out.map((v) => v.toString(16).padStart(2, '0')).join('');
}

// How an animal moves for a given check-in mood.
export type Mood = 'wired' | 'steady' | 'flat';

export interface MoodMotion {
  speed: number; // time multiplier for all idle motion
  bounce: number; // height of the idle bounce
  jitter: number; // small fast shake (wired)
  droop: number; // head-down tilt in radians (flat)
}

export function moodMotion(mood: Mood | null | undefined): MoodMotion {
  switch (mood) {
    case 'wired':
      return { speed: 1.9, bounce: 0.22, jitter: 0.05, droop: -0.08 };
    case 'flat':
      return { speed: 0.5, bounce: 0.03, jitter: 0, droop: 0.28 };
    case 'steady':
      return { speed: 1, bounce: 0.08, jitter: 0, droop: 0 };
    default:
      return { speed: 1, bounce: 0.06, jitter: 0, droop: 0 };
  }
}

// Height of a happy hop `since` seconds after it was triggered (0 when done).
export const HOP_SECONDS = 0.9;
export function hopHeight(since: number): number {
  if (since < 0 || since >= HOP_SECONDS) return 0;
  const p = since / HOP_SECONDS;
  // Two hops: a big one, then a small one.
  return p < 0.6 ? Math.sin((p / 0.6) * Math.PI) * 0.6 : Math.sin(((p - 0.6) / 0.4) * Math.PI) * 0.2;
}
