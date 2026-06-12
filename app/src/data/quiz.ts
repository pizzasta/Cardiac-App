import { AnimalId } from './archetypes';

// Each option carries a small weight vector over the six animals.
// Summing across all answers and taking the max gives the archetype.
// `tags` let the reveal pull personalized chips from real answers
// (peak window / crash window / recharge) for the "scary accurate" feel.

export type Scores = Partial<Record<AnimalId, number>>;

export interface Option {
  label: string;
  scores: Scores;
  tag?: { kind: 'peak' | 'crash' | 'recharge'; value: string };
}

export interface Question {
  id: string;
  prompt: string;
  options: Option[];
}

export const QUIZ: Question[] = [
  {
    id: 'sleep',
    prompt: 'When does your brain actually shut off at night?',
    options: [
      { label: 'Easily — out fast', scores: { bear: 3, fox: 1 } },
      { label: 'Takes forever', scores: { dolphin: 3, fox: 1 } },
      { label: 'Wired late', scores: { wolf: 3, dolphin: 1 } },
      { label: 'Crash hard, then wake up', scores: { dolphin: 2, bear: 1 } },
    ],
  },
  {
    id: 'morning',
    prompt: 'First hour awake, you’re…',
    options: [
      { label: 'Sharp', scores: { fox: 3, bear: 1 } },
      { label: 'Foggy', scores: { wolf: 3, bear: 1 } },
      { label: 'Anxious', scores: { hummingbird: 3, dolphin: 1 } },
      { label: 'Slow but fine', scores: { bear: 3, wolf: 1 } },
    ],
  },
  {
    id: 'social',
    prompt: 'After a full day around people you feel…',
    options: [
      { label: 'Charged', scores: { wolf: 2, fox: 1 } },
      { label: 'Drained', scores: { dolphin: 2, octopus: 2 } },
      { label: 'Fine, but need to decompress', scores: { octopus: 3, bear: 1 } },
      { label: 'Depends who', scores: { octopus: 2, fox: 1 } },
    ],
  },
  {
    id: 'stress',
    prompt: 'When stress hits, you…',
    options: [
      { label: 'Speed up', scores: { hummingbird: 3, fox: 1 } },
      { label: 'Shut down', scores: { bear: 2, octopus: 2 } },
      { label: 'Get scattered', scores: { hummingbird: 3, dolphin: 1 } },
      { label: 'Overthink everything', scores: { fox: 3, dolphin: 1 } },
    ],
  },
  {
    id: 'focus',
    prompt: 'Your best deep-work window is…',
    options: [
      { label: 'Early morning', scores: { fox: 3, bear: 1 }, tag: { kind: 'peak', value: 'early morning' } },
      { label: 'Midday', scores: { bear: 3 }, tag: { kind: 'peak', value: 'midday' } },
      { label: 'Late afternoon', scores: { dolphin: 2, octopus: 1 }, tag: { kind: 'peak', value: 'late afternoon' } },
      { label: 'Night', scores: { wolf: 3 }, tag: { kind: 'peak', value: 'late night' } },
    ],
  },
  {
    id: 'crash',
    prompt: 'Your energy dips hardest around…',
    options: [
      { label: 'Mid-morning', scores: { wolf: 2, hummingbird: 1 }, tag: { kind: 'crash', value: 'mid-morning' } },
      { label: '2–4pm', scores: { dolphin: 2, bear: 1 }, tag: { kind: 'crash', value: '2–4pm' } },
      { label: 'Evening', scores: { bear: 2, fox: 1 }, tag: { kind: 'crash', value: 'the evening' } },
      { label: 'It’s random', scores: { hummingbird: 2, octopus: 1 }, tag: { kind: 'crash', value: 'unpredictable' } },
    ],
  },
  {
    id: 'overwhelm',
    prompt: 'Too much at once and you…',
    options: [
      { label: 'Multitask harder', scores: { hummingbird: 3, fox: 1 } },
      { label: 'Freeze', scores: { bear: 2, octopus: 1 } },
      { label: 'Mask it and push through', scores: { octopus: 3, fox: 1 } },
      { label: 'Need to disappear', scores: { dolphin: 2, octopus: 1 } },
    ],
  },
  {
    id: 'recovery',
    prompt: 'You actually recover by…',
    options: [
      { label: 'Alone & quiet', scores: { dolphin: 2, fox: 1 }, tag: { kind: 'recharge', value: 'solitude' } },
      { label: 'Movement', scores: { wolf: 2, bear: 1 }, tag: { kind: 'recharge', value: 'movement' } },
      { label: 'People you trust', scores: { octopus: 2, bear: 1 }, tag: { kind: 'recharge', value: 'close people' } },
      { label: 'Total novelty', scores: { wolf: 3, hummingbird: 1 }, tag: { kind: 'recharge', value: 'novelty' } },
    ],
  },
];
