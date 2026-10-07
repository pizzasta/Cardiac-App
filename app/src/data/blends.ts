import { ARCHETYPES, AnimalId } from './archetypes';
import { PLANS, Tip } from './plans';

// Named blends: when a second animal finishes close behind (see RUNNER_UP_GAP
// in logic/score.ts), its streak flavours the main animal. Six streaks across
// six animals give 30 named identities, e.g. "Steady Dolphin" is a Dolphin
// with a Bear streak.

interface Streak {
  // Modifier placed before the main animal's name.
  word: string;
  // What this streak adds, in plain words.
  line: string;
}

export const STREAKS: Record<AnimalId, Streak> = {
  dolphin: {
    word: 'Restless',
    line: 'A Dolphin streak: you pick up on everything, so quiet recharges you faster than you’d expect.',
  },
  wolf: {
    word: 'Night',
    line: 'A Wolf streak: you get a second wind later in the day. Give it one good thing, then a stop time.',
  },
  bear: {
    word: 'Steady',
    line: 'A Bear streak: you can keep going longer than your first instinct says, and routine is your safety net.',
  },
  hummingbird: {
    word: 'Quick',
    line: 'A Hummingbird streak: you move fast and start a lot. One thing at a time keeps that speed useful.',
  },
  fox: {
    word: 'Watchful',
    line: 'A Fox streak: you scan ahead and plan. Give yourself a clear point where planning stops.',
  },
  octopus: {
    word: 'Attuned',
    line: 'An Octopus streak: you read people well. Check your own energy before you take on theirs.',
  },
};

export interface Blend {
  name: string; // "Steady Dolphin"
  streak: AnimalId; // the second animal
  line: string;
  // One tip borrowed from the streak animal's plan.
  tip: Tip;
}

export function blendFor(result: { animal: AnimalId; runnerUp?: AnimalId }): Blend | null {
  const { animal, runnerUp } = result;
  if (!runnerUp || runnerUp === animal || !STREAKS[runnerUp]) return null;
  const s = STREAKS[runnerUp];
  return {
    name: `${s.word} ${ARCHETYPES[animal].name}`,
    streak: runnerUp,
    line: s.line,
    tip: PLANS[runnerUp].tips[0],
  };
}

// The name to show for a result: the blend name when there is one.
export function displayName(result: { animal: AnimalId; runnerUp?: AnimalId }): string {
  return blendFor(result)?.name ?? ARCHETYPES[result.animal].name;
}
