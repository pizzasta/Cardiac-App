// Circadia's sound palette, defined once as synthesis recipes.
//
// Web renders these live with the Web Audio API; `npm run gen:sounds` renders
// the same recipes to assets/sounds/*.wav for iOS/Android (expo-av). Keep this
// file free of imports so the generator can load it on its own.
//
// The palette follows the visual system: dark, soft and low, with one warm
// accent. Short sine tones with gentle attacks, nothing bright or clicky, and a
// heartbeat "lub-dub" as the signature for a saved check-in.

export type SfxId =
  | 'tap'
  | 'select'
  | 'toggle'
  | 'success'
  | 'reveal'
  | 'breatheIn'
  | 'breatheOut'
  | 'complete';

export interface Voice {
  freq: number; // Hz at the start
  to?: number; // Hz at the end (exponential glide)
  start: number; // seconds
  dur: number; // seconds
  attack: number; // seconds
  gain: number; // relative level before normalising
  // Relative amplitudes of harmonics 1, 2, 3… (default: pure sine).
  harmonics?: number[];
}

export interface SfxRecipe {
  voices: Voice[];
  // Peak level after normalising (0–1). Keeps the palette balanced.
  level: number;
}

export const SFX: Record<SfxId, SfxRecipe> = {
  // Barely-there confirmation for primary taps.
  tap: {
    level: 0.22,
    voices: [{ freq: 660, to: 600, start: 0, dur: 0.07, attack: 0.004, gain: 1, harmonics: [1, 0.15] }],
  },
  // A soft pluck when picking an answer or option.
  select: {
    level: 0.3,
    voices: [{ freq: 740, start: 0, dur: 0.2, attack: 0.005, gain: 1, harmonics: [1, 0.3, 0.08] }],
  },
  // A short upward glide for switches.
  toggle: {
    level: 0.26,
    voices: [{ freq: 520, to: 700, start: 0, dur: 0.11, attack: 0.006, gain: 1, harmonics: [1, 0.2] }],
  },
  // Check-in saved: a heartbeat (lub-dub), then a soft two-note chime.
  success: {
    level: 0.7,
    voices: [
      { freq: 72, to: 46, start: 0, dur: 0.16, attack: 0.008, gain: 1, harmonics: [1, 0.35] },
      { freq: 64, to: 42, start: 0.2, dur: 0.18, attack: 0.008, gain: 0.75, harmonics: [1, 0.35] },
      { freq: 659.25, start: 0.34, dur: 0.9, attack: 0.01, gain: 0.16, harmonics: [1, 0.2] },
      { freq: 987.77, start: 0.44, dur: 0.9, attack: 0.01, gain: 0.12, harmonics: [1, 0.15] },
    ],
  },
  // The rhythm-animal reveal: a warm, slow swell.
  reveal: {
    level: 0.5,
    voices: [
      { freq: 220, start: 0, dur: 2.2, attack: 0.5, gain: 0.5, harmonics: [1, 0.25] },
      { freq: 329.63, start: 0.08, dur: 2.1, attack: 0.55, gain: 0.35 },
      { freq: 554.37, start: 0.16, dur: 2.0, attack: 0.6, gain: 0.22 },
      { freq: 880, start: 0.3, dur: 1.8, attack: 0.6, gain: 0.1 },
    ],
  },
  // Reset cues: a gentle rise for the in-breath, a fall for the out-breath.
  breatheIn: {
    level: 0.22,
    voices: [{ freq: 392, to: 523.25, start: 0, dur: 1.1, attack: 0.45, gain: 1, harmonics: [1, 0.1] }],
  },
  breatheOut: {
    level: 0.22,
    voices: [{ freq: 523.25, to: 392, start: 0, dur: 1.1, attack: 0.45, gain: 1, harmonics: [1, 0.1] }],
  },
  // Reset finished: an open fifth that rings out.
  complete: {
    level: 0.4,
    voices: [
      { freq: 783.99, start: 0, dur: 1.3, attack: 0.01, gain: 0.6, harmonics: [1, 0.2] },
      { freq: 1174.66, start: 0.14, dur: 1.2, attack: 0.01, gain: 0.45, harmonics: [1, 0.15] },
    ],
  },
};

export const SFX_IDS = Object.keys(SFX) as SfxId[];

// Fade applied at the very end of every sound so playback never clicks.
const TAIL = 0.01;

export function sfxDuration(id: SfxId): number {
  return Math.max(...SFX[id].voices.map((v) => v.start + v.dur));
}

// Render a recipe to mono samples in [-1, 1].
export function renderSfx(id: SfxId, sampleRate: number): Float32Array {
  const recipe = SFX[id];
  const total = Math.ceil(sfxDuration(id) * sampleRate) + 1;
  const out = new Float32Array(total);

  for (const v of recipe.voices) {
    const n = Math.floor(v.dur * sampleRate);
    const offset = Math.floor(v.start * sampleRate);
    const harmonics = v.harmonics ?? [1];
    const end = v.to ?? v.freq;
    const decay = 5 / v.dur; // reaches ~-43 dB by the end of the voice
    let phase = 0;
    for (let i = 0; i < n && offset + i < total; i++) {
      const t = i / sampleRate;
      const freq = v.freq * Math.pow(end / v.freq, i / n);
      phase += (2 * Math.PI * freq) / sampleRate;
      const attack = Math.min(1, t / v.attack);
      const tail = Math.min(1, (v.dur - t) / TAIL);
      const env = attack * Math.exp(-decay * Math.max(0, t - v.attack)) * Math.max(0, tail);
      let s = 0;
      for (let h = 0; h < harmonics.length; h++) s += harmonics[h] * Math.sin(phase * (h + 1));
      out[offset + i] += v.gain * env * s;
    }
  }

  return normalize(out, recipe.level);
}

function normalize(buf: Float32Array, level: number): Float32Array {
  let peak = 0;
  for (let i = 0; i < buf.length; i++) peak = Math.max(peak, Math.abs(buf[i]));
  if (peak > 0) {
    const k = level / peak;
    for (let i = 0; i < buf.length; i++) buf[i] *= k;
  }
  return buf;
}

// Deterministic PRNG (mulberry32) so generated audio files are reproducible.
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const AMBIENCE_SECONDS = 16;
const AMBIENCE_FADE = 1.5; // crossfade so the loop point is seamless

// The rainforest bed for native playback: soft rain, leaf hiss, a low rumble,
// a slow swell and a few distant birds, rendered as a seamless loop. Mirrors
// the live Web Audio ambience in sound.ts.
export function renderAmbience(sampleRate: number, seconds = AMBIENCE_SECONDS): Float32Array {
  const rand = rng(0xc1cad1a);
  const n = Math.floor(seconds * sampleRate);
  const fade = Math.floor(AMBIENCE_FADE * sampleRate);
  const raw = new Float32Array(n + fade);

  // One-pole filter coefficients.
  const lp = (hz: number) => 1 - Math.exp((-2 * Math.PI * hz) / sampleRate);
  const rainA = lp(2600);
  const hissLo = lp(3800);
  const hissHi = lp(7000);
  const rumbleA = lp(180);
  let rain = 0;
  let h1 = 0;
  let h2 = 0;
  let brown = 0;
  let rumble = 0;

  for (let i = 0; i < raw.length; i++) {
    const w = rand() * 2 - 1;
    rain += rainA * (w - rain);
    // Band-pass for leaf hiss: difference of two low-passes.
    h1 += hissLo * (w - h1);
    h2 += hissHi * (w - h2);
    const hiss = h2 - h1;
    brown = (brown + 0.02 * (rand() * 2 - 1)) / 1.02;
    rumble += rumbleA * (brown * 3.5 - rumble);
    // Swell period divides the loop length, so it lines up at the seam.
    const swell = 1 + 0.18 * Math.sin((2 * Math.PI * i) / (n / 2));
    raw[i] = rain * 0.5 * swell + hiss * 0.12 + rumble * 0.5;
  }

  // A few sparse chirps (kept clear of the crossfade region).
  const chirps = [2.1, 6.8, 9.4, 13.2];
  for (const at of chirps) {
    const start = Math.floor(at * sampleRate);
    const len = Math.floor(0.18 * sampleRate);
    const base = 1800 + rand() * 2200;
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / sampleRate;
      const f = base * Math.pow(1.4, Math.min(1, t / 0.08));
      phase += (2 * Math.PI * f) / sampleRate;
      const env = Math.min(1, t / 0.03) * Math.exp(-Math.max(0, t - 0.03) * 30);
      raw[start + i] += 0.06 * env * Math.sin(phase);
    }
  }

  // Equal-power crossfade of the overhang into the start.
  const out = raw.slice(0, n);
  for (let i = 0; i < fade; i++) {
    const x = i / fade;
    out[i] = raw[i] * Math.sin((x * Math.PI) / 2) + raw[n + i] * Math.cos((x * Math.PI) / 2);
  }
  return normalize(out, 0.6);
}

// 16-bit PCM mono WAV.
export function encodeWav(samples: Float32Array, sampleRate: number): Uint8Array {
  const dataLen = samples.length * 2;
  const buf = new Uint8Array(44 + dataLen);
  const view = new DataView(buf.buffer);
  const ascii = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) buf[offset + i] = s.charCodeAt(i);
  };
  ascii(0, 'RIFF');
  view.setUint32(4, 36 + dataLen, true);
  ascii(8, 'WAVE');
  ascii(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  ascii(36, 'data');
  view.setUint32(40, dataLen, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, Math.round(s * 32767), true);
  }
  return buf;
}
