import { getToday, Level, PulseEntry } from './pulselog';

export interface ResonanceRead {
  ready: boolean;
  matches: PulseEntry[];
  thread: string;
  trace: string;
  nextThread: string;
  pulseQuestion: string;
}

function nextRecordedSummary(log: PulseEntry[], matches: PulseEntry[]): string {
  const ordered = [...log].sort((a, b) => a.ts - b.ts || a.date.localeCompare(b.date));
  const nextLevels: Level[] = [];

  matches.forEach((match) => {
    const index = ordered.findIndex((entry) => entry.ts === match.ts && entry.date === match.date);
    const next = index >= 0 ? ordered[index + 1] : undefined;
    if (next) nextLevels.push(next.level);
  });

  if (!nextLevels.length) {
    return 'There are not enough follow-up check-ins yet to show what came next.';
  }

  const counts = nextLevels.reduce<Record<Level, number>>(
    (acc, level) => ({ ...acc, [level]: acc[level] + 1 }),
    { wired: 0, steady: 0, flat: 0 },
  );
  const dominant = (Object.entries(counts) as [Level, number][])
    .sort((a, b) => b[1] - a[1])[0];

  if (!dominant || dominant[1] === 0) {
    return 'There are not enough follow-up check-ins yet to show what came next.';
  }

  return `After ${dominant[1]} of ${nextLevels.length} matched day${nextLevels.length === 1 ? '' : 's'}, the next recorded check-in was ${dominant[0]}.`;
}

export function readResonance(log: PulseEntry[], minimum = 5): ResonanceRead {
  const today = getToday(log) ?? log[log.length - 1];
  const empty = {
    ready: false,
    matches: [],
    thread: 'The picture is still forming. A few more check-ins will give Circadia enough history to find days that rhyme.',
    trace: 'Resonance compares entries recorded in Circadia.',
    nextThread: 'There are not enough follow-up check-ins yet to show what came next.',
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

  const nextThread = nextRecordedSummary(log, matches);

  return {
    ready: true,
    matches,
    thread: matches.length
      ? `Circadia found ${matches.length} past day${matches.length === 1 ? '' : 's'} that rhyme with this one.`
      : 'No close resonance yet. Today may be adding a new shape to your history.',
    trace: matches.length
      ? `What shaped this: today's ${today.level} check-in compared with ${matches.length} recorded match${matches.length === 1 ? '' : 'es'}.`
      : 'What shaped this: your recorded Circadia check-ins.',
    nextThread,
    pulseQuestion: matches.length
      ? `Read the resonance in my Circadia history. Today is ${today.level}. Matching recorded days: ${matches.map((e) => `${e.date} (${e.level}${e.reason ? ', ' + e.reason : ''})`).join('; ')}. Historical follow-up: ${nextThread} Describe only what the recorded entries have in common and what followed them. Do not predict what will happen next. Give me one gentle thing I could try.`
      : '',
  };
}
