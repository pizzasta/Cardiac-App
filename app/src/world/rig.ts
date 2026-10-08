// Rhythm World — the pure math behind the 3D scene: where the camera sits on
// each screen, the shape of the waveform landscape, and the heartbeat timing.
// UI-free so it can be unit-tested without a GPU.

export type WorldMode = 'landing' | 'quiz' | 'reading' | 'reveal' | 'home' | 'focus' | 'reset';

export interface Station {
  camera: [number, number, number];
  lookAt: [number, number, number];
  // How fast the landscape scrolls toward the camera (world units / second).
  travel: number;
  // Overall brightness of the scene (0–1); lower behind text-heavy screens.
  glow: number;
}

export const STATIONS: Record<WorldMode, Station> = {
  // Wide, high view over the landscape with the horizon glow.
  landing: { camera: [0, 3.2, 9], lookAt: [0, 0.8, -12], travel: 0.6, glow: 1 },
  // Low and moving: you're travelling through the world while answering.
  quiz: { camera: [0, 1.7, 7], lookAt: [0, 0.9, -10], travel: 1.6, glow: 0.85 },
  // The dive while your rhythm is read: fast and close to the ground.
  reading: { camera: [0, 1.1, 5], lookAt: [0, 0.6, -14], travel: 7, glow: 1 },
  // Arrival: settled, looking up at your animal on the horizon.
  reveal: { camera: [0, 1.4, 6], lookAt: [0, 2.2, -12], travel: 0.3, glow: 1 },
  // Home base (plan): calm, gently drifting.
  home: { camera: [0, 2.6, 8], lookAt: [0, 1, -12], travel: 0.4, glow: 0.8 },
  // Behind dense screens (Today, check-in, trends, Ask): lower and dimmer.
  focus: { camera: [0, 6.5, 7], lookAt: [0, 0, -3], travel: 0.25, glow: 0.5 },
  // The breathing reset: almost still.
  reset: { camera: [0, 2, 7], lookAt: [0, 3.4, -12], travel: 0.08, glow: 0.8 },
};

// Seconds per heartbeat. Slow on purpose: the world should feel calm.
export const BEAT_SECONDS = 2.6;

// 0–1 strength of the "lub-dub" at time t: two quick pulses, then rest.
export function heartbeat(t: number, period = BEAT_SECONDS): number {
  const p = (((t % period) + period) % period) / period;
  const pulse = (center: number, width: number) => Math.exp(-(((p - center) / width) ** 2));
  return Math.min(1, pulse(0.06, 0.03) + 0.7 * pulse(0.16, 0.03));
}

// ---------------------------------------------------------------------------
// Landscape

// Length of one ground tile. Two identical tiles leapfrog toward the camera,
// so the ground shape is periodic in z with this period.
export const TILE_LENGTH = 60;

// Ground height at (x, z): a gentle valley floor for the camera path with
// soft rolling hills rising on either side. Periodic in z (TILE_LENGTH) so the
// tiles join seamlessly; every z-frequency is a whole number of cycles per tile.
export function groundHeight(x: number, z: number): number {
  const w = (2 * Math.PI) / TILE_LENGTH;
  const rolling =
    0.55 * Math.sin(z * w * 2 + x * 0.21 + 0.4) +
    0.35 * Math.sin(z * w * 3 - x * 0.37 + 1.7) +
    0.22 * Math.sin(z * w * 5 + x * 0.53 + 2.9) +
    0.12 * Math.sin(z * w * 9 - x * 0.91 + 0.8) +
    0.06 * Math.sin(z * w * 14 + x * 1.37 + 4.1);
  const side = Math.max(0, Math.abs(x) - 8);
  // Flat-ish path near the centre, hills that grow toward the sides.
  const valley = Math.min(1, Math.abs(x) / 7);
  return rolling * (0.25 + 0.75 * valley) + Math.min(9, side * side * 0.035);
}

// Deterministic 1D value noise in [0, 1).
function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise1(x: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash(i) * (1 - u) + hash(i + 1) * u;
}

// A natural mountain skyline: fractal noise with sharpened (ridged) peaks.
// Returns roughly 0–1 for horizontal position x; `seed` varies the range.
export function ridgeline(x: number, seed = 0): number {
  let h = 0;
  let amp = 1;
  let freq = 0.018;
  for (let o = 0; o < 6; o++) {
    const n = noise1(x * freq + seed * 17.3 + o * 3.1);
    h += amp * (1 - Math.abs(n * 2 - 1));
    amp *= 0.5;
    freq *= 2.1;
  }
  return h / 1.96875;
}

// ---------------------------------------------------------------------------
// Time of day: the sky follows the person's local clock.

// Sun elevation in degrees for a local hour (0–24): sunrise near 6, sunset
// near 19, below the horizon at night. Capped low so daytime stays a soft,
// readable golden-hour sky rather than bright noon blue.
export const MAX_SUN_ELEVATION = 9;
export function sunElevation(hour: number): number {
  const h = ((hour % 24) + 24) % 24;
  const rise = 6;
  const set = 19;
  if (h >= rise && h <= set) {
    return Math.sin((Math.PI * (h - rise)) / (set - rise)) * MAX_SUN_ELEVATION;
  }
  // Night: dip to -12 degrees in the small hours.
  const sinceSet = h > set ? h - set : h + 24 - set;
  const night = 24 - (set - rise);
  return -Math.sin((Math.PI * sinceSet) / night) * 12;
}

// 0 at night, 1 in (capped) daylight; twilight in between.
export function daylight(elevation: number): number {
  return Math.max(0, Math.min(1, (elevation + 4) / (MAX_SUN_ELEVATION + 4)));
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

// Strength (0–1) of the deep-pink sunset glow: evenings only, peaking just
// after the sun touches the horizon and fading into night. Sunrise keeps the
// sky's natural gold.
export function sunsetGlow(hour: number, elevation: number): number {
  const h = ((hour % 24) + 24) % 24;
  if (h < 12) return 0;
  return Math.exp(-(((elevation + 1) / 5.5) ** 2));
}
