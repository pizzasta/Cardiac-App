// What each world sounds like, and how loud each layer is right now. Pure, so
// it can be tested; the web and native engines both read it.
import type { BedId, CallId } from './recipes';

export type SoundWorld = 'valley' | 'dolphin' | 'wolf' | 'bear' | 'hummingbird' | 'fox' | 'octopus';
export type SoundMode = 'landing' | 'quiz' | 'reading' | 'reveal' | 'home' | 'focus' | 'reset';

interface Levels {
  birds: number;
  grasshoppers: number;
  crickets: number;
}

interface Profile {
  bed: BedId;
  bedLevel: number;
  day: Levels;
  night: Levels;
  // Occasional calls; `when` limits them to day or night.
  calls: { id: CallId; when: 'day' | 'night' | 'any'; level: number }[];
}

const PROFILES: Record<SoundWorld, Profile> = {
  valley: {
    bed: 'breeze',
    bedLevel: 0.75,
    day: { birds: 0.55, grasshoppers: 0.5, crickets: 0 },
    night: { birds: 0, grasshoppers: 0, crickets: 0.75 },
    calls: [{ id: 'frog', when: 'night', level: 0.35 }],
  },
  dolphin: {
    bed: 'waves',
    bedLevel: 0.9,
    day: { birds: 0.1, grasshoppers: 0.2, crickets: 0 },
    night: { birds: 0, grasshoppers: 0, crickets: 0.3 },
    calls: [{ id: 'gull', when: 'day', level: 0.4 }],
  },
  wolf: {
    bed: 'snowwind',
    bedLevel: 0.85,
    day: { birds: 0.15, grasshoppers: 0, crickets: 0 },
    night: { birds: 0, grasshoppers: 0, crickets: 0 },
    calls: [{ id: 'howl', when: 'night', level: 0.35 }],
  },
  bear: {
    bed: 'forest',
    bedLevel: 0.8,
    day: { birds: 0.5, grasshoppers: 0, crickets: 0 },
    night: { birds: 0, grasshoppers: 0, crickets: 0.4 },
    calls: [
      { id: 'woodpecker', when: 'day', level: 0.4 },
      { id: 'owl', when: 'night', level: 0.45 },
    ],
  },
  hummingbird: {
    bed: 'meadow',
    bedLevel: 0.75,
    day: { birds: 0.8, grasshoppers: 0.4, crickets: 0 },
    night: { birds: 0, grasshoppers: 0, crickets: 0.6 },
    calls: [{ id: 'frog', when: 'night', level: 0.25 }],
  },
  fox: {
    bed: 'wheat',
    bedLevel: 0.8,
    day: { birds: 0.3, grasshoppers: 0.75, crickets: 0 },
    night: { birds: 0, grasshoppers: 0.1, crickets: 0.85 },
    calls: [{ id: 'owl', when: 'night', level: 0.25 }],
  },
  octopus: {
    bed: 'waves',
    bedLevel: 0.6,
    day: { birds: 0, grasshoppers: 0, crickets: 0 },
    night: { birds: 0, grasshoppers: 0, crickets: 0.2 },
    calls: [{ id: 'drip', when: 'any', level: 0.35 }],
  },
};

export interface Mix {
  bed: BedId;
  bedLevel: number;
  birds: number;
  grasshoppers: number;
  crickets: number;
  calls: { id: CallId; level: number }[];
}

// Day critters fade out through dusk as the night chorus fades in.
export function mixFor(world: SoundWorld, daylight: number): Mix {
  const p = PROFILES[world];
  const d = Math.max(0, Math.min(1, daylight));
  const mix = (a: number, b: number) => b + (a - b) * d;
  return {
    bed: p.bed,
    bedLevel: p.bedLevel,
    birds: mix(p.day.birds, p.night.birds),
    grasshoppers: mix(p.day.grasshoppers, p.night.grasshoppers),
    crickets: mix(p.day.crickets, p.night.crickets),
    calls: p.calls
      .filter((c) => c.when === 'any' || (c.when === 'day' ? d > 0.5 : d < 0.4))
      .map((c) => ({ id: c.id, level: c.level })),
  };
}

// Behind text-heavy screens the world steps back: quieter and muffled, like
// sound through a window. Open, scenic screens are fully present.
export function modeMix(mode: SoundMode): { gain: number; muffleHz: number } {
  switch (mode) {
    case 'landing':
    case 'home':
    case 'reveal':
      return { gain: 1, muffleHz: 20000 };
    case 'quiz':
      return { gain: 0.8, muffleHz: 7000 };
    case 'reset':
      return { gain: 0.75, muffleHz: 3500 };
    default:
      return { gain: 0.55, muffleHz: 1600 };
  }
}

// Seconds until the next call: rare enough to stay a surprise.
export function nextCallDelay(rand: number): number {
  return 9 + rand * 16;
}

// Stereo position for a sound at `azimuth` (radians, positive = to the right)
// while the view is turned by `yaw` (positive = looking left).
export function panFor(azimuth: number, yaw: number): number {
  return Math.max(-1, Math.min(1, Math.sin(azimuth + yaw)));
}
