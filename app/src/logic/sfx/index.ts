// Interface sounds (web): rendered live from the shared recipes with the Web
// Audio API, so the web bundle ships no audio files. Native playback lives in
// index.native.ts. Every call is fire-and-forget and never throws.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderSfx, SfxId } from './recipes';

export type { SfxId } from './recipes';

export const SFX_PREF_KEY = 'circadia.uiSounds';
const VOLUME = 0.8;

let enabled = true;
let ctx: AudioContext | null = null;
const buffers = new Map<SfxId, AudioBuffer>();

export function sfxEnabled(): boolean {
  return enabled;
}

export async function loadSfxPref(): Promise<boolean> {
  try {
    enabled = (await AsyncStorage.getItem(SFX_PREF_KEY)) !== 'off';
  } catch {
    enabled = true;
  }
  return enabled;
}

export function setSfxEnabled(on: boolean): void {
  enabled = on;
  AsyncStorage.setItem(SFX_PREF_KEY, on ? 'on' : 'off').catch(() => {});
}

function context(): AudioContext | null {
  if (ctx) return ctx;
  const w: any = typeof window !== 'undefined' ? window : undefined;
  const Ctor = w?.AudioContext || w?.webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor() as AudioContext;
  return ctx;
}

export function playSfx(id: SfxId): void {
  if (!enabled) return;
  try {
    const c = context();
    if (!c) return;
    if (c.state === 'suspended') c.resume().catch(() => {});
    let buf = buffers.get(id);
    if (!buf) {
      const samples = renderSfx(id, c.sampleRate);
      buf = c.createBuffer(1, samples.length, c.sampleRate);
      buf.getChannelData(0).set(samples);
      buffers.set(id, buf);
    }
    const src = c.createBufferSource();
    const gain = c.createGain();
    gain.gain.value = VOLUME;
    src.buffer = buf;
    src.connect(gain).connect(c.destination);
    src.start();
  } catch {
    // sound is decoration; never break the UI over it
  }
}
