// Weekly report — the "weekly reveal" from CIRCADIA.md (§9 retention).
//
// Pure, UI-free aggregation over the local pulselog so it can be unit-tested
// and reused by any screen. Everything is derived from the PulseEntry log;
// there are no network calls here. Framed around "consistency, not streaks":
// missing a day barely dents the score, and nothing here ever shames the user.
import { Level, LEVELS, PulseEntry, dateKey, yFor } from './pulselog';

export interface WeeklyReport {
  // Inclusive ISO date bounds of the 7-day window (YYYY-MM-DD).
  start: string;
  end: string;
  // Days in the window that have at least one check-in (0–7).
  daysLogged: number;
  // Forgiving 0–100 consistency score for the window (see consistencyPct).
  consistencyPct: number;
  // Count of check-ins at each level over the window.
  distribution: Record<Level, number>;
  // The level the week leaned toward, or null if nothing was logged.
  dominant: Level | null;
  // Mean energy (0–1) across logged days, via yFor(); null if no data.
  avgEnergy: number | null;
  // A short, non-judgemental headline for the reveal card.
  headline: string;
}

export const WINDOW_DAYS = 7;

// Local YYYY-MM-DD for `daysAgo` days before `from` (default today).
function dayOffset(daysAgo: number, from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() - daysAgo);
  return dateKey(d);
}

// The set of distinct local dates in the trailing WINDOW_DAYS window.
function windowDates(now = new Date()): string[] {
  const out: string[] = [];
  for (let i = WINDOW_DAYS - 1; i >= 0; i--) out.push(dayOffset(i, now));
  return out;
}

// Forgiving consistency: share of the last 7 days with a check-in, rounded.
// Unlike a streak, a single missed day costs ~14 points and never resets to 0.
export function consistencyPct(log: PulseEntry[], now = new Date()): number {
  const dates = new Set(windowDates(now));
  const logged = new Set(log.map((e) => e.date).filter((d) => dates.has(d)));
  return Math.round((logged.size / WINDOW_DAYS) * 100);
}

// Build the full weekly report for the trailing 7 days ending `now`.
export function weeklyReport(log: PulseEntry[], now = new Date()): WeeklyReport {
  const dates = windowDates(now);
  const inWindow = new Set(dates);
  const entries = log.filter((e) => inWindow.has(e.date));

  const distribution = LEVELS.reduce(
    (acc, l) => ({ ...acc, [l.id]: 0 }),
    {} as Record<Level, number>
  );
  for (const e of entries) {
    if (e.level in distribution) distribution[e.level] += 1;
  }

  const daysLogged = new Set(entries.map((e) => e.date)).size;

  let dominant: Level | null = null;
  let best = 0;
  for (const l of LEVELS) {
    if (distribution[l.id] > best) {
      best = distribution[l.id];
      dominant = l.id;
    }
  }

  const avgEnergy =
    entries.length === 0
      ? null
      : entries.reduce((sum, e) => sum + yFor(e.level), 0) / entries.length;

  return {
    start: dates[0],
    end: dates[dates.length - 1],
    daysLogged,
    consistencyPct: consistencyPct(log, now),
    distribution,
    dominant,
    avgEnergy,
    headline: headlineFor(daysLogged, dominant),
  };
}

// A calm, forward-looking headline. Never guilt-trips an empty or light week.
export function headlineFor(daysLogged: number, dominant: Level | null): string {
  if (daysLogged === 0) {
    return 'A fresh week to start reading your rhythm.';
  }
  const label: Record<Level, string> = {
    wired: 'a wired, high-voltage week',
    steady: 'a steady, in-rhythm week',
    flat: 'a low, recharge-leaning week',
  };
  const lean = dominant ? label[dominant] : 'a mixed week';
  if (daysLogged >= 5) {
    return `You showed up ${daysLogged} days — ${lean}.`;
  }
  return `${daysLogged} day${daysLogged === 1 ? '' : 's'} logged — ${lean} so far.`;
}
