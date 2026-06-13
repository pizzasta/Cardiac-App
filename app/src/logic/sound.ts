// Rainforest ambience, synthesized live with the Web Audio API — no audio file,
// no network. Layers: filtered noise for rain, a low rumble, slow swells, and
// occasional soft bird chirps. Browsers block audio until a user gesture, so
// start() must be called from a tap.

export const soundSupported =
  typeof window !== 'undefined' &&
  !!((window as any).AudioContext || (window as any).webkitAudioContext);

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let started = false;
let birdTimer: ReturnType<typeof setTimeout> | null = null;
const sources: AudioScheduledSourceNode[] = [];

function noiseBuffer(context: AudioContext, type: 'white' | 'brown'): AudioBuffer {
  const len = context.sampleRate * 2;
  const buf = context.createBuffer(1, len, context.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (type === 'brown') {
      last = (last + 0.02 * w) / 1.02;
      data[i] = last * 3.5;
    } else {
      data[i] = w;
    }
  }
  return buf;
}

function layer(context: AudioContext, type: 'white' | 'brown', filter: BiquadFilterNode, gain: number) {
  const src = context.createBufferSource();
  src.buffer = noiseBuffer(context, type);
  src.loop = true;
  const g = context.createGain();
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(master as GainNode);
  src.start();
  sources.push(src);
  return g;
}

function chirp() {
  if (!ctx || !master) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const base = 1800 + Math.random() * 2200;
  osc.type = 'sine';
  osc.frequency.setValueAtTime(base, now);
  osc.frequency.exponentialRampToValueAtTime(base * 1.4, now + 0.08);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.06, now + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  osc.connect(g).connect(master);
  osc.start(now);
  osc.stop(now + 0.2);
  // schedule the next chirp at a random, sparse interval
  birdTimer = setTimeout(chirp, 3000 + Math.random() * 7000);
}

export async function start(): Promise<void> {
  if (!soundSupported) return;
  if (!ctx) ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
  const context: AudioContext = ctx!;
  await context.resume();

  if (!started) {
    master = context.createGain();
    master.gain.value = 0;
    master.connect(context.destination);

    // Rain: white noise through a gentle lowpass.
    const rainFilter = context.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.value = 2600;
    const rainGain = layer(context, 'white', rainFilter, 0.5);

    // Hiss: higher bandpass for the patter on leaves.
    const hiss = context.createBiquadFilter();
    hiss.type = 'bandpass';
    hiss.frequency.value = 5200;
    hiss.Q.value = 0.6;
    layer(context, 'white', hiss, 0.12);

    // Rumble: brown noise, deep lowpass.
    const rumble = context.createBiquadFilter();
    rumble.type = 'lowpass';
    rumble.frequency.value = 180;
    layer(context, 'brown', rumble, 0.5);

    // Slow swell on the rain so it breathes.
    const lfo = context.createOscillator();
    const lfoGain = context.createGain();
    lfo.frequency.value = 0.07;
    lfoGain.gain.value = 0.18;
    lfo.connect(lfoGain).connect(rainGain.gain);
    lfo.start();
    sources.push(lfo);

    started = true;
    chirp();
  }

  master!.gain.cancelScheduledValues(context.currentTime);
  master!.gain.linearRampToValueAtTime(0.22, context.currentTime + 1.5);
}

export async function stop(): Promise<void> {
  if (!ctx || !master) return;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
  if (birdTimer) {
    clearTimeout(birdTimer);
    birdTimer = null;
  }
}
