// Rainforest ambience on iOS/Android: a seamless loop pre-rendered from the
// shared recipe (`npm run gen:sounds`) and played with expo-av. Mirrors the web
// API in sound.ts. Respects the iOS silent switch and stops in the background.
import { Audio } from 'expo-av';
import { ensureAudioMode } from './audioMode';

export const soundSupported = true;

const MAX_VOLUME = 0.7; // 1.0 on the volume control maps to this
let volume = 0.6;
let sound: Promise<Audio.Sound | null> | null = null;

function ambience(): Promise<Audio.Sound | null> {
  if (!sound) {
    sound = ensureAudioMode()
      .then(() =>
        Audio.Sound.createAsync(require('../../assets/sounds/ambience.wav'), {
          isLooping: true,
          volume: volume * MAX_VOLUME,
        })
      )
      .then(({ sound: s }) => s)
      .catch(() => {
        sound = null;
        return null;
      });
  }
  return sound;
}

export async function start(): Promise<void> {
  const s = await ambience();
  await s?.setVolumeAsync(volume * MAX_VOLUME).catch(() => {});
  await s?.playAsync().catch(() => {});
}

export async function stop(): Promise<void> {
  if (!sound) return;
  const s = await sound;
  await s?.pauseAsync().catch(() => {});
}

// Native has no autoplay restriction, so auto-start simply starts.
export function enableAutoStart(): void {
  start().catch(() => {});
}

export function cancelAutoStart(): void {
  /* nothing pending on native */
}

export function setVolume(v: number): void {
  volume = Math.max(0, Math.min(1, v));
  if (sound) sound.then((s) => s?.setVolumeAsync(volume * MAX_VOLUME)).catch(() => {});
}

export function getVolume(): number {
  return volume;
}
