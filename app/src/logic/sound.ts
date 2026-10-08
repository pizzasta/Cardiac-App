// Nature soundscapes on the web, rendered live from the shared recipes with
// the Web Audio API (no audio files). Each world has its own bed and critters,
// day turns to night with the local clock, occasional calls come from around
// you, and the stereo image turns as you look around the 3D world. Behind
// text-heavy screens the sound steps back, quieter and muffled. Browsers block
// audio until a user gesture, so start() must follow a tap.
import { CritterId, CRITTER_IDS, LayerId, renderLayer } from './soundscape/recipes';
import { mixFor, modeMix, nextCallDelay, panFor, SoundMode, SoundWorld } from './soundscape/mix';
import { look } from '../world/look';
import { localHour } from '../world/clock';
import { daylight, sunElevation } from '../world/rig';

export const soundSupported =
  typeof window !== 'undefined' &&
  !!((window as any).AudioContext || (window as any).webkitAudioContext);

const RENDER_RATE = 22050;
const MAX_GAIN = 0.55; // 1.0 volume maps to this, so it never blows out
// Where each layer sits around you (radians, positive = right).
const AZIMUTH: Record<'bed' | CritterId, number> = { bed: 0, birds: -0.7, grasshoppers: 0.6, crickets: -0.2 };

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let scene: GainNode | null = null;
let muffle: BiquadFilterNode | null = null;
let playing = false;
let volume = 0.6;
let world: SoundWorld = 'valley';
let mode: SoundMode = 'landing';

interface Loop {
  src: AudioBufferSourceNode;
  gain: GainNode;
  pan: StereoPannerNode | null;
}
let bed: { id: string; loop: Loop } | null = null;
const critters: Partial<Record<CritterId, Loop>> = {};
const buffers = new Map<LayerId, AudioBuffer>();
let callTimer: ReturnType<typeof setTimeout> | null = null;
let ticker: ReturnType<typeof setInterval> | null = null;
let lastDaylight = -1;

const targetGain = () => volume * MAX_GAIN;
const yaw = () => look.dragYaw + look.tiltYaw;
const now = () => (ctx ? ctx.currentTime : 0);

function buffer(id: LayerId): AudioBuffer {
  let b = buffers.get(id);
  if (!b) {
    const samples = renderLayer(id, RENDER_RATE);
    b = ctx!.createBuffer(1, samples.length, RENDER_RATE);
    b.getChannelData(0).set(samples);
    buffers.set(id, b);
  }
  return b;
}

function makeLoop(id: LayerId): Loop {
  const c = ctx!;
  const src = c.createBufferSource();
  src.buffer = buffer(id);
  src.loop = true;
  const gain = c.createGain();
  gain.gain.value = 0;
  const pan = typeof c.createStereoPanner === 'function' ? c.createStereoPanner() : null;
  if (pan) src.connect(gain).connect(pan).connect(muffle!);
  else src.connect(gain).connect(muffle!);
  // Start each loop at a random point so layers don't line up.
  src.start(0, Math.random() * (src.buffer!.duration - 0.1));
  return { src, gain, pan };
}

function fade(g: GainNode, to: number, seconds: number) {
  g.gain.cancelScheduledValues(now());
  g.gain.setValueAtTime(g.gain.value, now());
  g.gain.linearRampToValueAtTime(to, now() + seconds);
}

function currentDaylight(): number {
  return daylight(sunElevation(localHour()));
}

// Bring every layer in line with the world, time of day and screen.
function apply(): void {
  if (!ctx || !playing) return;
  lastDaylight = currentDaylight();
  const mix = mixFor(world, lastDaylight);
  const m = modeMix(mode);
  fade(scene!, m.gain, 1.2);
  muffle!.frequency.setTargetAtTime(m.muffleHz, now(), 0.4);

  const bedId: LayerId = `bed-${mix.bed}`;
  if (!bed || bed.id !== bedId) {
    // Crossfade to the new world's bed.
    if (bed) {
      const old = bed.loop;
      fade(old.gain, 0, 2.5);
      setTimeout(() => old.src.stop(), 2800);
    }
    bed = { id: bedId, loop: makeLoop(bedId) };
  }
  fade(bed.loop.gain, mix.bedLevel, 2.5);

  for (const id of CRITTER_IDS) {
    const level = mix[id];
    if (level > 0 && !critters[id]) critters[id] = makeLoop(`critter-${id}`);
    const loop = critters[id];
    if (loop) fade(loop.gain, level, 3);
  }
}

function scheduleCall(): void {
  if (callTimer) clearTimeout(callTimer);
  callTimer = setTimeout(() => {
    callTimer = null;
    if (!ctx || !playing) return;
    const calls = mixFor(world, lastDaylight).calls;
    if (calls.length) {
      const call = calls[Math.floor(Math.random() * calls.length)];
      const src = ctx.createBufferSource();
      src.buffer = buffer(`call-${call.id}`);
      const g = ctx.createGain();
      g.gain.value = call.level * (0.6 + Math.random() * 0.4);
      const azimuth = (Math.random() * 2 - 1) * 1.3;
      if (typeof ctx.createStereoPanner === 'function') {
        const p = ctx.createStereoPanner();
        p.pan.value = panFor(azimuth, yaw());
        src.connect(g).connect(p).connect(muffle!);
      } else {
        src.connect(g).connect(muffle!);
      }
      src.start();
    }
    scheduleCall();
  }, nextCallDelay(Math.random()) * 1000);
}

// Turn the stereo image with the view, and follow the clock.
function tick(): void {
  if (!ctx || !playing) return;
  const y = yaw();
  if (bed?.loop.pan) bed.loop.pan.pan.setTargetAtTime(panFor(AZIMUTH.bed, y) * 0.5, now(), 0.15);
  for (const id of CRITTER_IDS) {
    const p = critters[id]?.pan;
    if (p) p.pan.setTargetAtTime(panFor(AZIMUTH[id], y) * 0.8, now(), 0.15);
  }
  if (Math.abs(currentDaylight() - lastDaylight) > 0.02) apply();
}

export function setSoundScene(next: { world: SoundWorld; mode: SoundMode }): void {
  if (next.world === world && next.mode === mode) return;
  world = next.world;
  mode = next.mode;
  apply();
}

export function setVolume(v: number): void {
  volume = Math.max(0, Math.min(1, v));
  if (ctx && master && playing) fade(master, targetGain(), 0.2);
}

export function getVolume(): number {
  return volume;
}

export async function start(): Promise<void> {
  if (!soundSupported) return;
  if (!ctx) {
    ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
    const c = ctx!;
    master = c.createGain();
    master.gain.value = 0;
    scene = c.createGain();
    muffle = c.createBiquadFilter();
    muffle.type = 'lowpass';
    muffle.frequency.value = 20000;
    muffle.connect(scene).connect(master).connect(c.destination);
  }
  await ctx!.resume();
  playing = true;
  apply();
  fade(master!, targetGain(), 1.5);
  scheduleCall();
  if (!ticker) ticker = setInterval(tick, 120);
}

export async function stop(): Promise<void> {
  playing = false;
  if (callTimer) clearTimeout(callTimer);
  callTimer = null;
  if (ticker) clearInterval(ticker);
  ticker = null;
  if (ctx && master) fade(master, 0, 0.8);
}

// Browsers won't autoplay audio until a user gesture. enableAutoStart tries to
// start immediately (works if the page already has audio permission) and, if
// not, starts on the very first tap/touch/key anywhere.
let killAuto: () => void = () => {};

export function enableAutoStart(): void {
  if (!soundSupported) return;
  start();
  const events: (keyof WindowEventMap)[] = ['pointerdown', 'touchstart', 'keydown'];
  const kick = () => {
    start();
    killAuto();
  };
  killAuto = () => events.forEach((e) => window.removeEventListener(e, kick));
  events.forEach((e) => window.addEventListener(e, kick, { once: true }));
}

export function cancelAutoStart(): void {
  killAuto();
  killAuto = () => {};
}
