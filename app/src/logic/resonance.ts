import { getToday, PulseEntry } from './pulselog';

export interface ResonanceRead {
  ready: boolean;
  matches: PulseEntry[];
  thread: string;
  trace: string;
  pulseQuestion: string;
}

export function readResonance(log: PulseEntry[], minimum = 5): ResonanceRead {
  const today = getToday(log) ?? log[log.length - 1];
  const empty = {
    ready: false,
    matches: [],
    thread: 'The picture is still forming. A few more check-ins will give Circadia enough history to find days that rhyme.',
    trace: 'Resonance compares entries recorded in Circadia.',
    pulseQuestion: '',
  };
  if (!today || log.length < minimum) return empty;

  const matches = log
    .filter((entry) => entry.date !== today.date)
    .map((entry) => ({
      entry,
      score: (entry.level === today.level ? 2 : 0) +
        (today.reason && entry.reason === today.reason ? 1 : 0),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.entry.date.localeCompare(a.entry.date))
    .slice(0, 3)
    .map((item) => item.entry);

  return {
    ready: true,
    matches,
    thread: matches.length
      ? `Circadia found ${matches.length} past day${matches.length === 1 ? '' : 's'} that rhyme with this one.`
      : 'No close resonance yet. Today may be adding a new shape to your history.',
    trace: matches.length
      ? `What shaped this: today's ${today.level} check-in compared with ${matches.length} recorded match${matches.length === 1 ? '' : 'es'}.`
      : 'What shaped this: your recorded Circadia check-ins.',
    pulseQuestion: matches.length
      ? `Read the resonance in my Circadia history. Today is ${today.level}. Matching recorded days: ${matches.map((e) => `${e.date} (${e.level}${e.reason ? ', ' + e.reason : ''})`).join('; ')}. Describe only what the entries have in common and give me one gentle thing I could try.`
      : '',
  };
}
