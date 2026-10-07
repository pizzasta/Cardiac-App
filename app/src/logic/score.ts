import { AnimalId } from '../data/archetypes';
import { Option, QUIZ } from '../data/quiz';

export interface RhythmResult {
  animal: AnimalId;
  // Personalized chips pulled from the user's actual answers.
  peak: string;
  crash: string;
  recharge: string;
  // A close second animal, when the result was near (shown as a "streak").
  runnerUp?: AnimalId;
  // The answers that pointed most strongly to the animal, as "question → answer".
  reasons?: string[];
}

// Show the runner-up when it finished within this many points of the winner.
const RUNNER_UP_GAP = 2;

// Tie-break priority: more distinctive archetypes win ties so results
// don't collapse to the "safe" middle.
const PRIORITY: AnimalId[] = [
  'dolphin',
  'octopus',
  'wolf',
  'hummingbird',
  'fox',
  'bear',
];

const FALLBACK = {
  peak: 'late morning',
  crash: 'the afternoon',
  recharge: 'quiet time',
};

// `answers` is the chosen Option for each question, in QUIZ order.
export function scoreQuiz(answers: (Option | null)[]): RhythmResult {
  const totals: Record<AnimalId, number> = {
    dolphin: 0,
    wolf: 0,
    bear: 0,
    hummingbird: 0,
    fox: 0,
    octopus: 0,
  };

  const chips = { ...FALLBACK };

  answers.forEach((opt) => {
    if (!opt || typeof opt !== 'object') return;

    const scores = (opt as any).scores;
    if (scores && typeof scores === 'object') {
      (Object.entries(scores) as [AnimalId, number][]).forEach(
        ([animal, pts]) => {
          totals[animal] += pts;
        }
      );
    }

    const tag = (opt as any).tag;
    if (
      tag &&
      typeof tag === 'object' &&
      typeof (tag as any).kind === 'string' &&
      typeof (tag as any).value === 'string' &&
      Object.prototype.hasOwnProperty.call(chips, (tag as any).kind)
    ) {
      chips[(tag as any).kind as keyof typeof chips] = (tag as any).value;
    }
  });

  let winner: AnimalId = PRIORITY[0];
  let best = -1;
  PRIORITY.forEach((animal) => {
    if (totals[animal] > best) {
      best = totals[animal];
      winner = animal;
    }
  });

  const second = PRIORITY.filter((a) => a !== winner).reduce((b, a) => (totals[a] > totals[b] ? a : b));
  const runnerUp =
    totals[second] > 0 && totals[winner] - totals[second] <= RUNNER_UP_GAP ? second : undefined;

  // The answers that gave the winner the most points (ties keep quiz order).
  const reasons = answers
    .map((opt, i) => ({ opt, i, pts: opt && typeof opt === 'object' ? ((opt as any).scores?.[winner] ?? 0) : 0 }))
    .filter((r) => r.pts >= 2 && typeof (r.opt as any)?.label === 'string' && QUIZ[r.i])
    .sort((a, b) => b.pts - a.pts || a.i - b.i)
    .slice(0, 3)
    .map((r) => `${QUIZ[r.i].prompt} → ${(r.opt as any).label}`);

  return {
    animal: winner,
    peak: chips.peak,
    crash: chips.crash,
    recharge: chips.recharge,
    ...(runnerUp ? { runnerUp } : {}),
    ...(reasons.length ? { reasons } : {}),
  };
}

export const TOTAL_QUESTIONS = QUIZ.length;
