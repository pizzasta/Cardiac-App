// The first-week recap: a one-time payoff once someone has checked in on
// enough different days, turning their own log back into a few plain lines.
// Pure (no storage), so it can be tested; the screen remembers it was shown.
import { Level, LEVELS, PulseEntry, REASONS } from './pulselog';
import type { RhythmResult } from './score';

export const RECAP_MIN_DAYS = 5;
// Only call it a "week" when the check-ins really fit in about one.
export const RECAP_WEEK_SPAN_DAYS = 10;

// Whole days between two YYYY-MM-DD keys (calendar math, no time zones).
function daysBetween(a: string, b: string): number {
  const toUtc = (k: string) => {
    const [y, m, d] = k.split('-').map(Number);
    return Date.UTC(y, (m || 1) - 1, d || 1);
  };
  return Math.round(Math.abs(toUtc(b) - toUtc(a)) / 86400000);
}

export interface FirstWeekRecap {
  days: number;
  dominant: Level;
  headline: string;
  lines: string[];
}

function mostCommon<T extends string>(values: T[]): T | null {
  const counts = new Map<T, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: T | null = null;
  let n = 0;
  for (const [v, c] of counts) {
    if (c > n) {
      best = v;
      n = c;
    }
  }
  return best;
}

export function firstWeekRecap(log: PulseEntry[], result: RhythmResult): FirstWeekRecap | null {
  const dates = [...new Set(log.map((e) => e.date))].sort();
  const days = dates.length;
  if (days < RECAP_MIN_DAYS) return null;
  const withinAWeek = daysBetween(dates[0], dates[dates.length - 1]) <= RECAP_WEEK_SPAN_DAYS;

  const dominant = mostCommon(log.map((e) => e.level)) ?? 'steady';
  const label = LEVELS.find((l) => l.id === dominant)?.label.toLowerCase() ?? dominant;
  const reasons = log
    .map((e) => e.reason)
    .filter((r): r is string => !!r && r !== 'nothing' && REASONS.includes(r));
  const topReason = mostCommon(reasons);

  const lines = [`You checked in on ${days} different days. That’s a real picture now.`];
  lines.push(`Most of your check-ins felt ${label}.`);
  if (topReason) lines.push(`When you tagged a reason, “${topReason}” came up most.`);
  lines.push(
    dominant === 'flat'
      ? `Next week, guard your recharge: ${result.recharge}.`
      : dominant === 'wired'
        ? `Next week, try a short reset before your dip (${result.crash}).`
        : `Next week, keep protecting your peak (${result.peak}). It seems to suit you.`
  );

  return {
    days,
    dominant,
    headline: withinAWeek ? 'Your first week' : `Your first ${days === 5 ? 'five' : days} check-ins`,
    lines,
  };
}
