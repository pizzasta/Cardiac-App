// Days like today — find past check-ins that look like today's, and show what
// was recorded after them.
//
// Pure and UI-free. Everything here describes entries the user already logged;
// nothing predicts what will happen next.
import { getToday, Level, PulseEntry } from './pulselog';

export interface SimilarDays {
  ready: boolean;
  today: PulseEntry | null;
  matches: PulseEntry[];
  // "3 similar days found"
  headline: string;
  // What the matched days had in common with today.
  shared: string;
  // What the next recorded check-in after each match was.
  whatNext: string;
  // Optional follow-up question for the in-app assistant ('' when no matches).
  question: string;
}

export const SIMILAR_DAYS_NOTE =
  'This describes your previous Wildhour entries. It doesn’t predict what will happen today.';

const MAX_MATCHES = 3;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function describeShared(today: PulseEntry, matches: PulseEntry[]): string {
  const sameLevel = matches.filter((m) => m.level === today.level).length;
  const parts: string[] = [];
  if (sameLevel === matches.length) {
    parts.push(`On ${matches.length === 1 ? 'that day' : 'these days'} you also checked in as ${cap(today.level)}.`);
  } else if (sameLevel > 0) {
    parts.push(`You also checked in as ${cap(today.level)} on ${sameLevel} of the ${matches.length}.`);
  }
  if (today.reason) {
    const sameReason = matches.filter((m) => m.reason === today.reason).length;
    if (sameReason > 0) {
      parts.push(`${cap(today.reason)} was selected on ${sameReason} of the ${matches.length}.`);
    }
  }
  return parts.join(' ');
}

// For each match, the next check-in recorded after it — skipping today, which
// is the day being compared, not something that "came next".
function describeWhatNext(log: PulseEntry[], matches: PulseEntry[], today: PulseEntry): string {
  const ordered = [...log].sort((a, b) => a.date.localeCompare(b.date) || a.ts - b.ts);
  const next: Level[] = [];
  matches.forEach((m) => {
    const i = ordered.findIndex((e) => e.date === m.date && e.ts === m.ts);
    const after = i >= 0 ? ordered[i + 1] : undefined;
    if (after && after.date !== today.date) next.push(after.level);
  });

  if (!next.length) return 'There aren’t enough later check-ins yet to show what came next.';

  const counts: Record<Level, number> = { wired: 0, steady: 0, flat: 0 };
  next.forEach((l) => (counts[l] += 1));
  const [top, n] = (Object.entries(counts) as [Level, number][]).sort((a, b) => b[1] - a[1])[0];
  if (next.length === 1) return `Your next recorded check-in was ${cap(top)}.`;
  return `Your next recorded check-in was ${cap(top)} on ${n} of those ${next.length} occasions.`;
}

export function findSimilarDays(log: PulseEntry[], minimum = 5): SimilarDays {
  const today = getToday(log) ?? log[log.length - 1] ?? null;
  if (!today || log.length < minimum) {
    return {
      ready: false,
      today,
      matches: [],
      headline: 'Not enough history yet',
      shared: `After ${plural(minimum, 'check-in')}, Wildhour can find past days that looked like today.`,
      whatNext: '',
      question: '',
    };
  }

  // Same level counts most; the same reason adds to it. Ties go to recent days.
  const matches = log
    .filter((e) => e.date !== today.date)
    .map((entry) => ({
      entry,
      score: (entry.level === today.level ? 2 : 0) + (today.reason && entry.reason === today.reason ? 1 : 0),
    }))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score || b.entry.date.localeCompare(a.entry.date))
    .slice(0, MAX_MATCHES)
    .map((m) => m.entry);

  if (!matches.length) {
    return {
      ready: true,
      today,
      matches,
      headline: 'No similar days yet',
      shared: 'Nothing in your history looks like today so far.',
      whatNext: '',
      question: '',
    };
  }

  const shared = describeShared(today, matches);
  const whatNext = describeWhatNext(log, matches, today);
  const list = matches.map((e) => `${e.date} (${e.level}${e.reason ? ', ' + e.reason : ''})`).join('; ');

  return {
    ready: true,
    today,
    matches,
    headline: `${plural(matches.length, 'similar day')} found`,
    shared,
    whatNext,
    question: [
      `Today I checked in as ${today.level}${today.reason ? ` (${today.reason})` : ''}.`,
      `Similar days in my Wildhour history: ${list}.`,
      whatNext,
      'Describe only what these recorded entries have in common and what was logged after them.',
      'Do not predict what will happen today. Suggest one small thing I could try.',
    ].join(' '),
  };
}
