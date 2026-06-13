import { AnimalId } from './archetypes';

// Per-archetype identity statements — short, emotionally accurate, shareable.
// Used for the check-in read and the shareable Signal Card.
export const STATEMENTS: Record<AnimalId, string[]> = {
  dolphin: [
    'You feel everything two hours before you understand it.',
    'Your nervous system never fully clocks out.',
    'You recover through silence.',
    'You’d notice the one thing wrong in a perfect room.',
    'You’re not overreacting — you’re early.',
  ],
  wolf: [
    'Your best ideas arrive after midnight.',
    'You’re sharpest when the world goes quiet.',
    'You burn bright on borrowed hours.',
    'You’re a night signal in a daytime body.',
    'You need a real stop time, not more discipline.',
  ],
  bear: [
    'You crash slowly, then all at once.',
    'You hold a pace others can’t sustain.',
    'You’re not lazy — you’re under-recovered.',
    'You stabilize everyone but yourself.',
    'You don’t rest — you collapse.',
  ],
  hummingbird: [
    'Your mind speeds up when it should slow down.',
    'You don’t multitask, you fragment.',
    'You leak energy through every open loop.',
    'You mistake stillness for falling behind.',
    'You think in sprints and live in marathons.',
  ],
  fox: [
    'You scan for danger that already passed.',
    'You feel safest when you can see what’s coming.',
    'You overprepare for danger and underprepare for rest.',
    'Your calm is a skill, not a state.',
    'You feel the future as pressure, not thought.',
  ],
  octopus: [
    'You absorb the emotional weather of every room.',
    'You read the room so well you forget to read yourself.',
    'You perform calm you don’t feel.',
    'You metabolize other people’s stress as your own.',
    'You go quiet long before you run out.',
  ],
};

// A stable pick per animal+index (so the same person sees a consistent line,
// and the card can rotate deterministically).
export function pickStatement(animal: AnimalId, index = 0): string {
  const pool = STATEMENTS[animal];
  return pool[((index % pool.length) + pool.length) % pool.length];
}
