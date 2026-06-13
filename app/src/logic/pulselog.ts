import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnimalId } from '../data/archetypes';

// A tiny, forgiving daily check-in log. One entry per local day; logging again
// the same day updates it. Stored locally so it works offline and signed-out.

export type Level = 'wired' | 'steady' | 'flat';

export interface PulseEntry {
  date: string; // YYYY-MM-DD (local)
  level: Level;
  reason?: string;
  ts: number;
}

const KEY = 'circadia.pulselog';

export const LEVELS: { id: Level; label: string; blurb: string; y: number }[] = [
  { id: 'wired', label: 'Wired', blurb: 'Buzzing, on edge, hard to land', y: 0.9 },
  { id: 'steady', label: 'Steady', blurb: 'Level, present, in rhythm', y: 0.55 },
  { id: 'flat', label: 'Flat', blurb: 'Low, depleted, running on backup', y: 0.22 },
];

export const REASONS = ['sleep', 'people', 'work', 'body', 'nothing'];

export function dateKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export async function load(): Promise<PulseEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PulseEntry[]) : [];
  } catch {
    return [];
  }
}

export function getToday(log: PulseEntry[]): PulseEntry | undefined {
  const k = dateKey();
  return log.find((e) => e.date === k);
}

export async function logToday(level: Level, reason?: string): Promise<PulseEntry[]> {
  const log = await load();
  const k = dateKey();
  const entry: PulseEntry = { date: k, level, reason, ts: Date.now() };
  const next = [...log.filter((e) => e.date !== k), entry].sort((a, b) =>
    a.date < b.date ? -1 : 1
  );
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // best-effort; the in-memory result is still returned
  }
  return next;
}

// How many distinct days were logged in the last `days` window (a forgiving
// "rhythm", not a brittle streak).
export function checkInsInWindow(log: PulseEntry[], days = 14): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (days - 1));
  const cut = dateKey(cutoff);
  return log.filter((e) => e.date >= cut).length;
}

// Current run of consecutive days up to today (today optional — yesterday still
// counts so an un-logged "today" doesn't read as a broken streak mid-morning).
export function currentStreak(log: PulseEntry[]): number {
  const have = new Set(log.map((e) => e.date));
  let streak = 0;
  const d = new Date();
  if (!have.has(dateKey(d))) d.setDate(d.getDate() - 1); // grace for today
  while (have.has(dateKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// Oldest -> newest series for the last `days`, with gaps as null.
export function series(
  log: PulseEntry[],
  days = 14
): { date: string; level: Level | null }[] {
  const byDate = new Map(log.map((e) => [e.date, e.level]));
  const out: { date: string; level: Level | null }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = dateKey(d);
    out.push({ date: k, level: byDate.get(k) ?? null });
  }
  return out;
}

export function yFor(level: Level): number {
  return LEVELS.find((l) => l.id === level)?.y ?? 0.5;
}

// A plain-language read of the trend, for the Trends header insight.
export function trendInsight(log: PulseEntry[]): string {
  const recent = series(log, 14).filter((s) => s.level) as { level: Level }[];
  if (recent.length < 2) return 'Log a few days and your pattern starts to surface here.';
  const counts: Record<Level, number> = { wired: 0, steady: 0, flat: 0 };
  recent.forEach((r) => (counts[r.level] += 1));
  const top = (Object.entries(counts) as [Level, number][]).sort((a, b) => b[1] - a[1])[0][0];
  if (top === 'wired') return 'You’ve been running hot lately. Where does that energy land?';
  if (top === 'flat') return 'Mostly low this stretch — under-recovered, not lazy.';
  return 'Mostly steady — that’s the state good things get built in.';
}

// Smart check-in time: when should we nudge for the daily Pulse?
// - Cold start: the archetype's crash window (passed as `fallback`).
// - With history: align ~30 min before when they actually tend to check in
//   (meet the habit), then shift earlier if they've been mostly flat/wired so
//   the nudge catches the dip before it deepens. Clamped to a humane window.
export function suggestCheckInTime(
  log: PulseEntry[],
  fallback: { hour: number; minute: number }
): { hour: number; minute: number; why: string } {
  const recent = log.slice(-14);
  if (recent.length < 3) {
    return { ...fallback, why: 'Set to your rhythm type’s crash window.' };
  }

  const hours = recent
    .map((e) => {
      const d = new Date(e.ts);
      return d.getHours() + d.getMinutes() / 60;
    })
    .sort((a, b) => a - b);
  const median = hours[Math.floor(hours.length / 2)];

  const counts: Record<Level, number> = { wired: 0, steady: 0, flat: 0 };
  recent.forEach((e) => (counts[e.level] += 1));
  const top = (Object.entries(counts) as [Level, number][]).sort((a, b) => b[1] - a[1])[0][0];

  let shift = 0;
  let why = 'Timed to when you usually check in.';
  if (top === 'flat') {
    shift = -1;
    why = 'You’ve been running low — nudging earlier to catch the dip.';
  } else if (top === 'wired') {
    shift = -0.5;
    why = 'You’ve been running hot — nudging earlier to land it sooner.';
  }

  let h = median - 0.5 + shift; // 30 min before the habitual time, plus trend
  h = Math.max(8, Math.min(21.5, h));
  let hour = Math.floor(h);
  let minute = Math.round(((h - hour) * 60) / 5) * 5;
  if (minute === 60) {
    hour += 1;
    minute = 0;
  }
  return { hour, minute, why };
}

export function readFor(animalName: string, level: Level): { read: string; move: string } {
  if (level === 'wired')
    return {
      read: `Wired right now. For a ${animalName}, that edge is real — but it needs somewhere to land.`,
      move: 'Four slow breaths, or five quiet minutes before the next thing.',
    };
  if (level === 'flat')
    return {
      read: `Flat today. Not lazy — under-recovered. A ${animalName} crashes quiet, then all at once.`,
      move: 'Lower the bar. One small, kind thing — then rest without guilt.',
    };
  return {
    read: 'Steady. That’s the state everything good gets built in.',
    move: 'Good moment to do the one thing that actually matters today.',
  };
}
