// Interface sounds (iOS/Android): the shared recipes pre-rendered to WAV by
// `npm run gen:sounds`, played with expo-av. Sounds respect the iOS silent
// switch and mix with other audio. Every call is fire-and-forget.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio, AVPlaybackSource } from 'expo-av';
import type { SfxId } from './recipes';
import { ensureAudioMode } from '../audioMode';

export type { SfxId } from './recipes';

export const SFX_PREF_KEY = 'circadia.uiSounds';
const VOLUME = 0.8;

const FILES: Record<SfxId, AVPlaybackSource> = {
  tap: require('../../../assets/sounds/tap.wav'),
  select: require('../../../assets/sounds/select.wav'),
  toggle: require('../../../assets/sounds/toggle.wav'),
  success: require('../../../assets/sounds/success.wav'),
  reveal: require('../../../assets/sounds/reveal.wav'),
  breatheIn: require('../../../assets/sounds/breatheIn.wav'),
  breatheOut: require('../../../assets/sounds/breatheOut.wav'),
  complete: require('../../../assets/sounds/complete.wav'),
};

let enabled = true;
const loaded = new Map<SfxId, Promise<Audio.Sound | null>>();

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

function sound(id: SfxId): Promise<Audio.Sound | null> {
  let p = loaded.get(id);
  if (!p) {
    p = ensureAudioMode()
      .then(() => Audio.Sound.createAsync(FILES[id], { volume: VOLUME }))
      .then(({ sound: s }) => s)
      .catch(() => null);
    loaded.set(id, p);
  }
  return p;
}

export function playSfx(id: SfxId): void {
  if (!enabled) return;
  sound(id)
    .then((s) => s?.replayAsync())
    .catch(() => {});
}
