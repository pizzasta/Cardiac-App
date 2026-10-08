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
