// The worlds. Before the quiz everyone walks the same green valley; after
// the reveal the landscape becomes your animal's own place. Each biome is
// plain data read by the scene (ground colours, plants, water, particles,
// sky extras), so the look of a world can be tuned here without touching
// rendering code.
import type { AnimalId } from '../data/archetypes';
import { groundHeight } from './rig';

export type BiomeId = 'valley' | AnimalId;

export type ParticleMode = 'firefly' | 'snow' | 'leaves' | 'pollen' | 'spark';

export interface Biome {
  id: BiomeId;
  // Ground vertex colours: valley floor and hillsides.
  ground: [string, string];
  // Near and far mountain ranges.
  mountains: [string, string];
  // Swaying grass (or wheat); density is blades per ground tile on web.
  grass: null | { base: string; tip: string; height: number; density: number; spread: number };
  trees: null | {
    kind: 'pine' | 'round';
    trunk: string;
    crowns: string[];
    count: number; // per tile
    near: number; // closest |x| to the path
    far: number;
    size: number;
  };
  flowers: null | { colors: string[]; count: number };
  // A channel of water down the valley (the ground dips beneath it).
  water: null | { color: string; glow?: string };
  particles: { mode: ParticleMode; colors: string[]; size: number };
  aurora?: boolean;
}

export const BIOMES: Record<BiomeId, Biome> = {
  // The shared valley before the quiz.
  valley: {
    id: 'valley',
    ground: ['#2f4232', '#557048'],
    mountains: ['#232a38', '#323a52'],
    grass: { base: '#26402a', tip: '#7a9a52', height: 0.55, density: 1300, spread: 34 },
    trees: null,
    flowers: null,
    water: null,
    particles: { mode: 'firefly', colors: ['#ffd98a'], size: 0.16 },
  },
  // Ocean cove: a sea channel between sandy, grassy banks.
  dolphin: {
    id: 'dolphin',
    ground: ['#4a4636', '#6b6a52'],
    mountains: ['#2a3442', '#3a4a5e'],
    grass: { base: '#4c5a3a', tip: '#b3b07a', height: 0.6, density: 500, spread: 40 },
    trees: null,
    flowers: null,
    water: { color: '#0f5a72' },
    particles: { mode: 'spark', colors: ['#cdeeff'], size: 0.12 },
  },
  // Snowy pines under the northern lights.
  wolf: {
    id: 'wolf',
    ground: ['#aeb9c7', '#e6ecf2'],
    mountains: ['#7c879a', '#a8b3c4'],
    grass: null,
    trees: { kind: 'pine', trunk: '#3b2c22', crowns: ['#1e3a2e', '#24463a', '#1a3328'], count: 70, near: 7, far: 70, size: 1 },
    flowers: null,
    water: null,
    particles: { mode: 'snow', colors: ['#ffffff'], size: 0.12 },
    aurora: true,
  },
  // Autumn forest with falling leaves.
  bear: {
    id: 'bear',
    ground: ['#3d2b1c', '#614428'],
    mountains: ['#2e2a30', '#45384a'],
    grass: { base: '#4a3a22', tip: '#b08a44', height: 0.45, density: 700, spread: 30 },
    trees: { kind: 'round', trunk: '#3a2618', crowns: ['#c2561c', '#e08a2c', '#9a2f1a', '#e8b03a'], count: 55, near: 6, far: 60, size: 1 },
    flowers: null,
    water: null,
    particles: { mode: 'leaves', colors: ['#e0802a'], size: 0.22 },
  },
  // A flower meadow with pollen in the air.
  hummingbird: {
    id: 'hummingbird',
    ground: ['#2c4a28', '#4d7236'],
    mountains: ['#24323a', '#34485a'],
    grass: { base: '#2c5a2a', tip: '#8cc050', height: 0.5, density: 1500, spread: 36 },
    trees: { kind: 'round', trunk: '#3a2a1c', crowns: ['#3f7a3a', '#5a9a44', '#4a8a3c'], count: 14, near: 14, far: 60, size: 1 },
    flowers: { colors: ['#ff5fa2', '#ffd23f', '#ffffff', '#c77dff', '#ff8a3d'], count: 520 },
    water: null,
    particles: { mode: 'pollen', colors: ['#ffe27a'], size: 0.1 },
  },
  // Golden wheat fields at dusk.
  fox: {
    id: 'fox',
    ground: ['#6e5626', '#a0803a'],
    mountains: ['#3a2a2e', '#56404a'],
    grass: { base: '#8a6a28', tip: '#f2cc66', height: 0.95, density: 2300, spread: 46 },
    trees: { kind: 'round', trunk: '#3a2818', crowns: ['#6a5a2a', '#7a6630'], count: 6, near: 22, far: 70, size: 1.2 },
    flowers: null,
    water: null,
    particles: { mode: 'firefly', colors: ['#ffcf7a'], size: 0.14 },
  },
  // A glowing night shore: dark rock and bioluminescent water.
  octopus: {
    id: 'octopus',
    ground: ['#1c2130', '#2e3546'],
    mountains: ['#1a2030', '#28304a'],
    grass: null,
    trees: null,
    flowers: null,
    water: { color: '#0a2438', glow: '#22e0ff' },
    particles: { mode: 'spark', colors: ['#3ff0ff'], size: 0.15 },
  },
};

export function biomeFor(animal: AnimalId | null): Biome {
  return animal ? BIOMES[animal] : BIOMES.valley;
}

// Ground height for a biome: the shared hills, with a channel carved down
// the middle where there's water.
export const WATER_LEVEL = 0;
export function heightIn(biome: Biome, x: number, z: number): number {
  const h = groundHeight(x, z);
  return biome.water ? h - 1.4 * Math.exp(-(x * x) / 90) : h;
}
