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

// Show the runner-up (and name the blend) when it finished within this many
// points of the winner. With 12 questions about three in four people get a
// blend; the rest have a clear, pure result.
export const RUNNER_UP_GAP = 3;

// Final tie-break, after total points and "signature" (3-point) answers:
// more distinctive archetypes win so results don't collapse to the middle.
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

  // Signature answers: the 3-point picks that most define an animal. They
  // break ties on total points.
  const signature: Record<AnimalId, number> = { ...totals };

  const chips = { ...FALLBACK };

  answers.forEach((opt) => {
    if (!opt || typeof opt !== 'object') return;

    const scores = (opt as any).scores;
    if (scores && typeof scores === 'object') {
      (Object.entries(scores) as [AnimalId, number][]).forEach(
        ([animal, pts]) => {
          totals[animal] += pts;
          if (pts >= 3) signature[animal] += 1;
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

  // Rank by total, then signature answers, then priority (PRIORITY order is
  // preserved by the stable sort).
  const ranked = [...PRIORITY].sort(
    (a, b) => totals[b] - totals[a] || signature[b] - signature[a]
  );
  const winner = ranked[0];
  const second = ranked[1];
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
