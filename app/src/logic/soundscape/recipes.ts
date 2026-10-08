// Nature soundscapes, defined once as synthesis recipes (no recordings).
//
// Every world has a bed (breeze, waves, snowy wind, forest, meadow or wheat),
// shared critter loops (birds by day, grasshoppers in grassy places, crickets
// at night) and occasional calls (gulls, a howl, an owl, a woodpecker, frogs,
// drips). Web renders these live; `npm run gen:sounds` renders the same
// recipes to WAVs for iOS/Android. Keep this file free of imports so the
// generator can load it on its own, and keep every random choice seeded so the
// generated files are identical on every run.

export type BedId = 'breeze' | 'waves' | 'snowwind' | 'forest' | 'meadow' | 'wheat';
export type CritterId = 'birds' | 'crickets' | 'grasshoppers';
export type CallId = 'gull' | 'howl' | 'owl' | 'woodpecker' | 'frog' | 'drip';

export const BED_IDS: BedId[] = ['breeze', 'waves', 'snowwind', 'forest', 'meadow', 'wheat'];
export const CRITTER_IDS: CritterId[] = ['birds', 'crickets', 'grasshoppers'];
export const CALL_IDS: CallId[] = ['gull', 'howl', 'owl', 'woodpecker', 'frog', 'drip'];

// Loop length in seconds. Every periodic element divides it so loops are
// seamless, and a short crossfade hides the seam in the noise.
export const LOOP_SECONDS = 12;
const FADE = 1.2;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalize(x: Float32Array, peak: number): Float32Array {
  let m = 0;
  for (let i = 0; i < x.length; i++) m = Math.max(m, Math.abs(x[i]));
  if (m > 0) for (let i = 0; i < x.length; i++) x[i] = (x[i] / m) * peak;
  return x;
}

// One-pole low-pass coefficient.
const lpk = (hz: number, sr: number) => 1 - Math.exp((-2 * Math.PI * hz) / sr);

// Render `fill` over the loop plus an overhang, then crossfade the overhang
// into the start so the loop point is seamless.
function seamless(sr: number, fill: (out: Float32Array, n: number) => void, peak: number): Float32Array {
  const n = Math.floor(LOOP_SECONDS * sr);
  const fade = Math.floor(FADE * sr);
  const raw = new Float32Array(n + fade);
  fill(raw, n);
  const out = raw.slice(0, n);
  for (let i = 0; i < fade; i++) {
    const x = i / fade;
    out[i] = raw[i] * Math.sin((x * Math.PI) / 2) + raw[n + i] * Math.cos((x * Math.PI) / 2);
  }
  return normalize(out, peak);
}

// Slow, loop-aligned modulation: k cycles per loop.
const cyc = (i: number, n: number, k: number, phase = 0) => Math.sin((2 * Math.PI * k * i) / n + phase);

// Noise sources with simple filtering, reused by the beds.
function noiseKit(sr: number, seed: number) {
  const rand = rng(seed);
  let brown = 0;
  const lows: number[] = [0, 0, 0, 0];
  // State-variable filter state, per slot: [low, band].
  const svfs: [number, number][] = [
    [0, 0],
    [0, 0],
  ];
  return {
    // A sharper, resonant band-pass (state-variable filter) around fc.
    // Run twice per sample (2x oversampled) so it stays stable up to high
    // frequencies, which crickets and grasshoppers need.
    svf: (w: number, slot: number, fc: number, damping: number) => {
      const st = svfs[slot];
      const f = 2 * Math.sin((Math.PI * Math.min(fc, sr * 0.45)) / (2 * sr));
      for (let pass = 0; pass < 2; pass++) {
        const hp = w - st[0] - damping * st[1];
        st[1] += f * hp;
        st[0] += f * st[1];
      }
      return st[1];
    },
    white: () => rand() * 2 - 1,
    brown: () => {
      brown = (brown + 0.02 * (rand() * 2 - 1)) / 1.02;
      return brown * 3.5;
    },
    // Band-limited noise: difference of two low-passes on the same input.
    band: (w: number, slot: number, lo: number, hi: number) => {
      lows[slot] += lpk(lo, sr) * (w - lows[slot]);
      lows[slot + 1] += lpk(hi, sr) * (w - lows[slot + 1]);
      return lows[slot + 1] - lows[slot];
    },
    rand,
  };
}

// ---------------------------------------------------------------------------
// Beds

function breezeInto(out: Float32Array, n: number, sr: number, seed: number, amount = 1) {
  const k = noiseKit(sr, seed);
  const a = lpk(1000, sr);
  let l1 = 0;
  let l2 = 0;
  for (let i = 0; i < out.length; i++) {
    const gust = 0.55 + 0.25 * cyc(i, n, 1) + 0.15 * cyc(i, n, 3, 1.3) + 0.05 * cyc(i, n, 7, 0.4);
    // A soft, airy rush centred where phone speakers can play it (no
    // sub-bass rumble, no bright hiss), with leaves rustling in the gusts.
    l1 += a * (k.svf(k.white(), 0, 520, 1.5) - l1);
    l2 += a * (l1 - l2);
    const rush = l2;
    const rustle = k.svf(k.white(), 1, 2600, 1.2) * Math.pow(Math.max(0, gust), 3);
    out[i] += amount * (rush * gust + rustle * 0.025);
  }
}

function renderBed(id: BedId, sr: number): Float32Array {
  return seamless(
    sr,
    (out, n) => {
      const k = noiseKit(sr, 0xbed0 + BED_IDS.indexOf(id) * 97);
      if (id === 'breeze') {
        breezeInto(out, n, sr, 11);
      } else if (id === 'waves') {
        // Two waves per loop: a rising roar, the break, then the hiss of the
        // wash running back.
        let roar = 0;
        let roar2 = 0;
        const a = lpk(700, sr);
        for (let i = 0; i < out.length; i++) {
          const ph = ((i / n) * 2) % 1;
          const swell = Math.pow(Math.sin(Math.PI * Math.min(1, ph / 0.55)), 2) * (ph < 0.55 ? 1 : 0);
          // The wash builds as the wave breaks and drains away into the next.
          const washAt = (x: number) =>
            x < 0.45 ? 0 : Math.min(1, (x - 0.45) / 0.12) * Math.exp(-Math.max(0, x - 0.57) * 4);
          const wash = washAt(ph) + washAt(ph + 1);
          roar += a * (k.white() - roar);
          roar2 += a * (roar - roar2);
          const hiss = k.svf(k.white(), 0, 3200, 1.1);
          out[i] = roar2 * (0.3 + 1.4 * swell) + hiss * 0.12 * wash + k.brown() * 0.1;
        }
      } else if (id === 'snowwind') {
        // A whistling wind: resonant band-pass that drifts in pitch.
        let lo = 0;
        let bp = 0;
        let rumble = 0;
        for (let i = 0; i < out.length; i++) {
          const fc = 650 + 260 * cyc(i, n, 1) + 120 * cyc(i, n, 4, 0.7);
          const f = 2 * Math.sin((Math.PI * fc) / sr);
          const w = k.white();
          const hp = w - lo - 0.18 * bp;
          bp += f * hp;
          lo += f * bp;
          const gust = 0.5 + 0.3 * cyc(i, n, 2, 0.5) + 0.2 * cyc(i, n, 5);
          rumble = k.svf(k.white(), 1, 380, 1.5);
          out[i] = bp * 0.09 * gust + rumble * 0.5 * gust;
        }
      } else if (id === 'forest') {
        breezeInto(out, n, sr, 23, 0.7);
        // Leaves crackling now and then.
        for (let c = 0; c < 26; c++) {
          const start = Math.floor(k.rand() * (out.length - sr * 0.3));
          const len = Math.floor(sr * (0.05 + k.rand() * 0.18));
          const level = 0.12 + k.rand() * 0.18;
          for (let i = 0; i < len; i++) {
            const env = Math.sin((Math.PI * i) / len);
            const click = k.rand() < 0.08 ? k.white() * 2 : 0;
            out[start + i] += level * env * (k.svf(k.white(), 0, 3200, 0.9) * 0.08 + click * 0.05);
          }
        }
      } else if (id === 'meadow') {
        breezeInto(out, n, sr, 37, 0.55);
        // Bees drifting past: buzzy tones that swell in and out.
        const bees = [
          { f: 210, k: 1, ph: 0 },
          { f: 240, k: 2, ph: 2.1 },
          { f: 185, k: 3, ph: 4.0 },
        ];
        let lp = 0;
        const a = lpk(1600, sr);
        const phases = bees.map(() => 0);
        for (let i = 0; i < out.length; i++) {
          let s = 0;
          bees.forEach((b, j) => {
            const near = Math.pow(Math.max(0, cyc(i, n, b.k, b.ph)), 4);
            const f = b.f * (1 + 0.03 * Math.sin((2 * Math.PI * 6 * i) / sr + j));
            phases[j] += f / sr;
            const saw = 2 * (phases[j] % 1) - 1;
            s += saw * near;
          });
          lp += a * (s - lp);
          out[i] += lp * 0.22;
        }
      } else {
        // Wheat: a soft, bright rustle travelling through the field in swells.
        breezeInto(out, n, sr, 41, 0.5);
        for (let i = 0; i < out.length; i++) {
          const swell = Math.pow(0.5 + 0.5 * cyc(i, n, 3, 0.8), 2) * (0.7 + 0.3 * cyc(i, n, 1));
          out[i] += k.svf(k.white(), 0, 2400, 1.1) * swell * 0.035;
        }
      }
    },
    0.6
  );
}

// ---------------------------------------------------------------------------
// Critters

function tone(out: Float32Array, sr: number, at: number, dur: number, f0: number, f1: number, level: number, attack = 0.01, vibrato = 0) {
  const start = Math.floor(at * sr);
  const len = Math.floor(dur * sr);
  let phase = 0;
  for (let i = 0; i < len && start + i < out.length; i++) {
    const t = i / sr;
    const x = i / len;
    const f = f0 * Math.pow(f1 / f0, x) * (1 + vibrato * Math.sin(2 * Math.PI * 7 * t));
    phase += (2 * Math.PI * f) / sr;
    const env = Math.min(1, t / attack) * Math.pow(1 - x, 1.5);
    out[start + i] += level * env * (Math.sin(phase) + 0.15 * Math.sin(2 * phase));
  }
}

function renderCritter(id: CritterId, sr: number): Float32Array {
  return seamless(
    sr,
    (out, n) => {
      const rand = rng(0xc0de + CRITTER_IDS.indexOf(id) * 131);
      // Loop length; rhythms below divide it so the seam stays in time.
      const L = n / sr;
      if (id === 'birds') {
        // A few different birds: quick chirps, trills and a whistled phrase.
        let t = 0.3;
        while (t < L - 0.5) {
          const kind = rand();
          const level = 0.25 + rand() * 0.6;
          if (kind < 0.45) {
            const base = 2400 + rand() * 2200;
            const notes = 1 + Math.floor(rand() * 3);
            for (let j = 0; j < notes; j++) tone(out, sr, t + j * 0.13, 0.09, base, base * (1.25 + rand() * 0.3), level, 0.005);
            t += 0.5 + rand() * 1.2;
          } else if (kind < 0.75) {
            const base = 3200 + rand() * 1500;
            const notes = 6 + Math.floor(rand() * 6);
            for (let j = 0; j < notes; j++) tone(out, sr, t + j * 0.045, 0.035, base, base * 0.92, level * 0.7, 0.003);
            t += 0.9 + rand() * 1.4;
          } else {
            const base = 1500 + rand() * 700;
            tone(out, sr, t, 0.35, base, base * 1.5, level * 0.8, 0.03, 0.01);
            tone(out, sr, t + 0.42, 0.45, base * 1.3, base * 0.95, level * 0.7, 0.03, 0.01);
            t += 1.4 + rand() * 1.6;
          }
        }
      } else if (id === 'crickets') {
        // Three crickets at different pitches and tempos (each tempo divides
        // the loop), plus a faint chorus further away.
        const voices = [
          { f: 4400, period: L / 16, pulses: 3, level: 0.5, offset: 0.1 },
          { f: 4900, period: L / 13, pulses: 4, level: 0.32, offset: 0.37 },
          { f: 4100, period: L / 19, pulses: 3, level: 0.22, offset: 0.21 },
        ];
        for (const v of voices) {
          for (let c = v.offset; c < L + FADE; c += v.period) {
            for (let p = 0; p < v.pulses; p++) {
              const start = Math.floor((c + p * 0.034) * sr);
              const len = Math.floor(0.018 * sr);
              for (let i = 0; i < len && start + i < out.length; i++) {
                const env = Math.sin((Math.PI * i) / len);
                out[start + i] += v.level * env * Math.sin((2 * Math.PI * v.f * i) / sr);
              }
            }
          }
        }
        const k = noiseKit(sr, 77);
        for (let i = 0; i < out.length; i++) {
          const pulse = 0.5 + 0.5 * Math.sin((2 * Math.PI * 30 * i) / sr);
          out[i] += k.svf(k.white(), 0, 4500, 0.15) * pulse * 0.015;
        }
      } else {
        // Grasshoppers: dry, buzzy rasps from the grass.
        const k = noiseKit(sr, 91);
        const voices = [
          { at: 0.4, every: L / 4, len: 1.3, rate: 38, level: 0.55 },
          { at: 1.9, every: L / 3, len: 0.9, rate: 52, level: 0.35 },
          { at: 3.1, every: L / 5, len: 0.6, rate: 44, level: 0.25 },
        ];
        for (const v of voices) {
          for (let c = v.at; c < L + FADE; c += v.every) {
            const start = Math.floor(c * sr);
            const len = Math.floor(v.len * sr);
            for (let i = 0; i < len && start + i < out.length; i++) {
              const t = i / sr;
              const gate = Math.pow(Math.max(0, Math.sin(2 * Math.PI * v.rate * t)), 6);
              const env = Math.sin((Math.PI * i) / len);
              out[start + i] += v.level * env * gate * k.svf(k.white(), 0, 7000, 0.35) * 0.35;
            }
          }
        }
      }
    },
    0.5
  );
}

// ---------------------------------------------------------------------------
// Calls (one-shots, with a little space around them)

function withSpace(dry: Float32Array, sr: number): Float32Array {
  const out = new Float32Array(dry.length + Math.floor(sr * 0.8));
  out.set(dry);
  const taps = [0.083, 0.127, 0.191];
  for (const d of taps) {
    const D = Math.floor(d * sr);
    for (let i = D; i < out.length; i++) out[i] += out[i - D] * 0.28;
  }
  return out;
}

function renderCall(id: CallId, sr: number): Float32Array {
  const rand = rng(0xca11 + CALL_IDS.indexOf(id) * 17);
  let dry: Float32Array;
  if (id === 'gull') {
    dry = new Float32Array(Math.floor(sr * 1.4));
    for (let j = 0; j < 3; j++) tone(dry, sr, j * 0.38, 0.32, 1500 - j * 60, 950, 0.7, 0.02, 0.03);
  } else if (id === 'howl') {
    dry = new Float32Array(Math.floor(sr * 3.2));
    const len = dry.length;
    let ph = 0;
    for (let i = 0; i < len; i++) {
      const x = i / len;
      const f = (x < 0.25 ? 300 + (520 - 300) * (x / 0.25) : 520 - 120 * Math.max(0, (x - 0.6) / 0.4)) * (1 + 0.012 * Math.sin(2 * Math.PI * 5 * (i / sr)));
      ph += (2 * Math.PI * f) / sr;
      const env = Math.min(1, x / 0.15) * Math.min(1, (1 - x) / 0.25);
      dry[i] = env * (Math.sin(ph) + 0.4 * Math.sin(2 * ph) + 0.15 * Math.sin(3 * ph)) * 0.5;
    }
  } else if (id === 'owl') {
    dry = new Float32Array(Math.floor(sr * 1.6));
    tone(dry, sr, 0, 0.32, 390, 360, 0.8, 0.05);
    tone(dry, sr, 0.62, 0.2, 400, 380, 0.6, 0.04);
    tone(dry, sr, 0.9, 0.42, 395, 350, 0.75, 0.05);
  } else if (id === 'woodpecker') {
    dry = new Float32Array(Math.floor(sr * 1.1));
    const k = noiseKit(sr, 5);
    for (let j = 0; j < 14; j++) {
      const start = Math.floor(j * (sr / 17));
      const len = Math.floor(0.012 * sr);
      const level = 0.8 * Math.pow(0.93, j);
      for (let i = 0; i < len; i++) dry[start + i] += level * Math.exp(-i / (len / 4)) * (k.band(k.white(), 0, 900, 2600) * 4);
    }
  } else if (id === 'frog') {
    dry = new Float32Array(Math.floor(sr * 1.3));
    const k = noiseKit(sr, 9);
    for (const at of [0, 0.55]) {
      const start = Math.floor(at * sr);
      const len = Math.floor(0.35 * sr);
      for (let i = 0; i < len; i++) {
        const t = i / sr;
        const pulse = Math.pow(Math.max(0, Math.sin(2 * Math.PI * 55 * t)), 8);
        const env = Math.sin((Math.PI * i) / len);
        dry[start + i] += env * pulse * (Math.sin(2 * Math.PI * 520 * t) + k.band(k.white(), 0, 400, 1100) * 2) * 0.6;
      }
    }
  } else {
    dry = new Float32Array(Math.floor(sr * 0.6));
    tone(dry, sr, 0, 0.09, 1100 + rand() * 300, 1900, 0.8, 0.002);
    tone(dry, sr, 0.16, 0.07, 1500, 2300, 0.4, 0.002);
  }
  return normalize(withSpace(dry, sr), 0.55);
}

// ---------------------------------------------------------------------------

export type LayerId = `bed-${BedId}` | `critter-${CritterId}` | `call-${CallId}`;

export const LAYER_IDS: LayerId[] = [
  ...BED_IDS.map((id) => `bed-${id}` as LayerId),
  ...CRITTER_IDS.map((id) => `critter-${id}` as LayerId),
  ...CALL_IDS.map((id) => `call-${id}` as LayerId),
];

export function renderLayer(id: LayerId, sampleRate: number): Float32Array {
  const [kind, name] = id.split('-') as [string, string];
  if (kind === 'bed') return renderBed(name as BedId, sampleRate);
  if (kind === 'critter') return renderCritter(name as CritterId, sampleRate);
  return renderCall(name as CallId, sampleRate);
}
