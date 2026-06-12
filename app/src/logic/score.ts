import { AnimalId } from '../data/archetypes';
import { Option, QUIZ, Scores } from '../data/quiz';

export interface RhythmResult {
  animal: AnimalId;
  // Personalized chips pulled from the user's actual answers.
  peak: string;
  crash: string;
  recharge: string;
}

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
    if (!opt) return;
    (Object.entries(opt.scores) as [AnimalId, number][]).forEach(
      ([animal, pts]) => {
        totals[animal] += pts;
      }
    );
    if (opt.tag) chips[opt.tag.kind] = opt.tag.value;
  });

  let winner: AnimalId = PRIORITY[0];
  let best = -1;
  PRIORITY.forEach((animal) => {
    if (totals[animal] > best) {
      best = totals[animal];
      winner = animal;
    }
  });

  return {
    animal: winner,
    peak: chips.peak,
    crash: chips.crash,
    recharge: chips.recharge,
  };
}

export const TOTAL_QUESTIONS = QUIZ.length;
