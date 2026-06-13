// The six core rhythm archetypes.
// The animal is the identity skin; under it sit the axes the AI actually uses
// (arousal, peak window, failure mode, recharge). See CIRCADIA.md.

export type AnimalId =
  | 'dolphin'
  | 'wolf'
  | 'bear'
  | 'hummingbird'
  | 'fox'
  | 'octopus';

export interface Archetype {
  id: AnimalId;
  name: string;
  emoji: string;
  oneLiner: string;
  // The 2-line "this is you" — accurate-feeling, never fake-deep.
  reading: string;
  // Gradient signature (top -> bottom). The gradient is the brand.
  gradient: [string, string, string];
  accent: string;
  // What this rhythm gives you, and the pattern to watch — shown on results.
  strength: string;
  watchOut: string;
}

export const ARCHETYPES: Record<AnimalId, Archetype> = {
  dolphin: {
    id: 'dolphin',
    name: 'Dolphin',
    emoji: '🐬',
    oneLiner: 'Light sleeper, sharp mind, runs hot',
    reading:
      'You notice everything — which is a gift and the reason you’re tired. Your edge is real, but it needs quiet to recharge or it turns on you.',
    gradient: ['#08080A', '#141016', '#1C0C16'],
    accent: '#FF2E7E',
    strength:
      'Pattern-spotting — you catch what everyone else misses.',
    watchOut:
      'Over-stimulation. Your antennae never fully lower, so quiet isn’t optional.',
  },
  wolf: {
    id: 'wolf',
    name: 'Wolf',
    emoji: '🐺',
    oneLiner: 'Night energy, creative in bursts',
    reading:
      'Your best hours start when most people are winding down. The trick isn’t more discipline — it’s a real stop time so the burst doesn’t cost you tomorrow.',
    gradient: ['#08080A', '#141016', '#1C0C16'],
    accent: '#FF2E7E',
    strength:
      'Deep creative focus when the world goes quiet.',
    watchOut:
      'Borrowing from tomorrow — the late burst has a cost if there’s no stop time.',
  },
  bear: {
    id: 'bear',
    name: 'Bear',
    emoji: '🐻',
    oneLiner: 'Steady and reliable, burnout-prone',
    reading:
      'You’re the one who keeps going — which is exactly why you crash slowly and hard. Protected rest isn’t a reward for you, it’s maintenance.',
    gradient: ['#08080A', '#141016', '#1C0C16'],
    accent: '#FF2E7E',
    strength:
      'Reliability — you sustain a pace others can’t.',
    watchOut:
      'The slow-build crash. You won’t feel empty until you suddenly are.',
  },
  hummingbird: {
    id: 'hummingbird',
    name: 'Hummingbird',
    emoji: '🐦',
    oneLiner: 'Fast, anxious, always multitasking',
    reading:
      'Your mind moves faster than the day does, which is why it spins out. You don’t need to slow down everywhere — just land on one thing at a time.',
    gradient: ['#08080A', '#141016', '#1C0C16'],
    accent: '#FF2E7E',
    strength:
      'Speed and range — you move on things fast.',
    watchOut:
      'Scatter. Too many open loops tips you from fast into frozen.',
  },
  fox: {
    id: 'fox',
    name: 'Fox',
    emoji: '🦊',
    oneLiner: 'Hyper-alert planner, always scanning',
    reading:
      'You see problems before they arrive — useful, until you can’t switch it off. Your hardest skill isn’t planning, it’s permission to stop scanning.',
    gradient: ['#08080A', '#141016', '#1C0C16'],
    accent: '#FF2E7E',
    strength:
      'Foresight — you see problems coming and plan around them.',
    watchOut:
      'Over-control. The scanning that protects you also won’t let you rest.',
  },
  octopus: {
    id: 'octopus',
    name: 'Octopus',
    emoji: '🐙',
    oneLiner: 'Emotionally absorbent, social masker',
    reading:
      'You read the room so well you forget to check your own state. You don’t run out of energy loudly — you run out quietly, then all at once.',
    gradient: ['#08080A', '#141016', '#1C0C16'],
    accent: '#FF2E7E',
    strength:
      'Emotional attunement — you read people and rooms instantly.',
    watchOut:
      'Self-erasure. You track everyone’s state but your own until you’re empty.',
  },
};

export const APP_BACKGROUND = '#08080A';

// A subtle per-animal hue, layered over the global hot-pink for identity on the
// new surfaces (Signal Card waveform, Trends, the Reveal emblem glow). The UI
// chrome stays hot-pink; this is just a quiet signature.
export const TINTS: Record<AnimalId, string> = {
  dolphin: '#4FC3F7',
  wolf: '#9B6BFF',
  bear: '#FF9F45',
  hummingbird: '#3DDC97',
  fox: '#FF6B3D',
  octopus: '#FF5DA2',
};
