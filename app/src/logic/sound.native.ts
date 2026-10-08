// Nature soundscapes on iOS/Android: the same recipes as the web, pre-rendered
// to seamless loops (`npm run gen:sounds`) and mixed with expo-av. Each world
// has its own bed and critters, day turns to night with the clock, occasional
// calls play now and then, and the sound steps back behind text-heavy screens.
// Respects the iOS silent switch and stops in the background.
import { Audio } from 'expo-av';
import { ensureAudioMode } from './audioMode';
import { CRITTER_IDS, LayerId } from './soundscape/recipes';
import { mixFor, modeMix, nextCallDelay, SoundMode, SoundWorld } from './soundscape/mix';
import { SOUND_FILES } from './soundscape/nativeAssets';
import { localHour } from '../world/clock';
import { daylight, sunElevation } from '../world/rig';

export const soundSupported = true;

const MAX_VOLUME = 0.8; // 1.0 on the volume control maps to this
let volume = 0.6;
let playing = false;
let world: SoundWorld = 'valley';
let mode: SoundMode = 'landing';
let lastDaylight = -1;

interface Track {
  sound: Promise<Audio.Sound | null>;
  level: number; // last volume set
  fade: ReturnType<typeof setInterval> | null;
}
const tracks = new Map<LayerId, Track>();
let callTimer: ReturnType<typeof setTimeout> | null = null;
let clockTimer: ReturnType<typeof setInterval> | null = null;

function track(id: LayerId): Track {
  let t = tracks.get(id);
  if (!t) {
    const sound = ensureAudioMode()
      .then(() => Audio.Sound.createAsync(SOUND_FILES[id], { isLooping: true, volume: 0, shouldPlay: true }))
      .then(({ sound: s }) => s)
      .catch(() => null);
    t = { sound, level: 0, fade: null };
    tracks.set(id, t);
  }
  return t;
}

// Step a track's volume to `to` over about 1.5 seconds; unload when silent.
function fadeTo(id: LayerId, to: number) {
  const t = to > 0 ? track(id) : tracks.get(id);
  if (!t) return;
  if (t.fade) clearInterval(t.fade);
  const from = t.level;
  let step = 0;
  const steps = 10;
  t.fade = setInterval(() => {
    step++;
    t.level = from + ((to - from) * step) / steps;
    t.sound.then((s) => s?.setVolumeAsync(Math.max(0, t.level)).catch(() => {}));
    if (step >= steps) {
      clearInterval(t.fade!);
      t.fade = null;
      if (to <= 0) {
        tracks.delete(id);
        t.sound.then((s) => s?.unloadAsync().catch(() => {}));
      }
    }
  }, 150);
}

function apply(): void {
  lastDaylight = daylight(sunElevation(localHour()));
  if (!playing) return;
  const mix = mixFor(world, lastDaylight);
  const g = modeMix(mode).gain * volume * MAX_VOLUME;
  const wanted = new Map<LayerId, number>([[`bed-${mix.bed}`, mix.bedLevel * g]]);
  for (const id of CRITTER_IDS) if (mix[id] > 0) wanted.set(`critter-${id}`, mix[id] * g);
  for (const id of tracks.keys()) if (!wanted.has(id)) fadeTo(id, 0);
  for (const [id, level] of wanted) fadeTo(id, level);
}

function scheduleCall(): void {
  if (callTimer) clearTimeout(callTimer);
  callTimer = setTimeout(() => {
    callTimer = null;
    if (!playing) return;
    const calls = mixFor(world, lastDaylight).calls;
    if (calls.length) {
      const call = calls[Math.floor(Math.random() * calls.length)];
      const level = call.level * (0.6 + Math.random() * 0.4) * modeMix(mode).gain * volume * MAX_VOLUME;
      Audio.Sound.createAsync(SOUND_FILES[`call-${call.id}`], { shouldPlay: true, volume: level })
        .then(({ sound }) => {
          sound.setOnPlaybackStatusUpdate((st) => {
            if (st.isLoaded && st.didJustFinish) sound.unloadAsync().catch(() => {});
          });
        })
        .catch(() => {});
    }
    scheduleCall();
  }, nextCallDelay(Math.random()) * 1000);
}

export function setSoundScene(next: { world: SoundWorld; mode: SoundMode }): void {
  if (next.world === world && next.mode === mode) return;
  world = next.world;
  mode = next.mode;
  apply();
}

export async function start(): Promise<void> {
  playing = true;
  apply();
  scheduleCall();
  if (!clockTimer) {
    clockTimer = setInterval(() => {
      if (Math.abs(daylight(sunElevation(localHour())) - lastDaylight) > 0.02) apply();
    }, 60000);
  }
}

export async function stop(): Promise<void> {
  playing = false;
  if (callTimer) clearTimeout(callTimer);
  callTimer = null;
  if (clockTimer) clearInterval(clockTimer);
  clockTimer = null;
  for (const id of [...tracks.keys()]) fadeTo(id, 0);
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
  apply();
}

export function getVolume(): number {
  return volume;
}
