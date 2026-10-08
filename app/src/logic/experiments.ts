import AsyncStorage from '@react-native-async-storage/async-storage';
import { dateKey, Level, PulseEntry } from './pulselog';

export type ExperimentId = 'morning-light' | 'earlier-wind-down' | 'afternoon-walk' | 'single-task';

export interface RhythmExperiment {
  id: ExperimentId;
  title: string;
  prompt: string;
  days: number;
}

export interface ActiveExperiment extends RhythmExperiment {
  startedAt: string;
}

export const EXPERIMENTS: RhythmExperiment[] = [
  { id: 'morning-light', title: 'Morning light', prompt: 'Spend a few minutes outside or near bright natural light after waking.', days: 5 },
  { id: 'earlier-wind-down', title: 'Earlier wind-down', prompt: 'Start your usual wind-down about 30 minutes earlier.', days: 5 },
  { id: 'afternoon-walk', title: 'Afternoon walk', prompt: 'Try a short, comfortable walk or movement break in the afternoon.', days: 5 },
  { id: 'single-task', title: 'Single-task block', prompt: 'Protect one 25-minute block for one task with distractions reduced.', days: 5 },
];

const KEY = 'circadia.activeExperiment';
const LAST_KEY = 'circadia.lastExperiment';

// Reads never throw: unavailable storage or a corrupt value reads as "none".
async function readExperiment(key: string): Promise<ActiveExperiment | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const v = JSON.parse(raw) as ActiveExperiment | null;
    return v && typeof v === 'object' && typeof v.startedAt === 'string' ? v : null;
  } catch {
    return null;
  }
}

export async function getActiveExperiment(): Promise<ActiveExperiment | null> {
  return readExperiment(KEY);
}

export async function startExperiment(item: RhythmExperiment): Promise<ActiveExperiment> {
  const active = { ...item, startedAt: new Date().toISOString() };
  await AsyncStorage.setItem(KEY, JSON.stringify(active));
  return active;
}

export async function stopExperiment(): Promise<void> {
  const active = await getActiveExperiment();
  if (active) await AsyncStorage.setItem(LAST_KEY, JSON.stringify(active));
  await AsyncStorage.removeItem(KEY);
}

export async function getLastExperiment(): Promise<ActiveExperiment | null> {
  return readExperiment(LAST_KEY);
}

export async function dismissLastExperiment(): Promise<void> {
  await AsyncStorage.removeItem(LAST_KEY);
}

// True once the experiment's full run of days has elapsed.
export function isExperimentComplete(active: ActiveExperiment, now = new Date()): boolean {
  const start = new Date(active.startedAt).getTime();
  if (Number.isNaN(start)) return false;
  return now.getTime() - start >= active.days * 86400000;
}

export function experimentDay(active: ActiveExperiment, now = new Date()): number {
  const start = new Date(active.startedAt).getTime();
  return Math.max(1, Math.min(active.days, Math.floor((now.getTime() - start) / 86400000) + 1));
}


export interface ExperimentOutcome {
  before: Level | null;
  during: Level | null;
  beforeCount: number;
  duringCount: number;
  commonReason?: string;
  summary: string;
}

function dominantLevel(entries: PulseEntry[]): Level | null {
  if (!entries.length) return null;
  const counts: Record<Level, number> = { wired: 0, steady: 0, flat: 0 };
  entries.forEach((entry) => (counts[entry.level] += 1));
  return (Object.entries(counts) as [Level, number][]).sort((a, b) => b[1] - a[1])[0][0];
}

export function experimentOutcome(active: ActiveExperiment, log: PulseEntry[]): ExperimentOutcome {
  const start = new Date(active.startedAt);
  // Local-day keys, matching how the pulselog stores dates.
  const startKey = dateKey(start);
  const beforeStart = new Date(start);
  beforeStart.setDate(beforeStart.getDate() - active.days);
  const beforeKey = dateKey(beforeStart);
  const end = new Date(start);
  end.setDate(end.getDate() + active.days - 1);
  const endKey = dateKey(end);

  const beforeEntries = log.filter((entry) => entry.date >= beforeKey && entry.date < startKey);
  const duringEntries = log.filter((entry) => entry.date >= startKey && entry.date <= endKey);
  const reasons = new Map<string, number>();
  duringEntries.forEach((entry) => {
    if (entry.reason) reasons.set(entry.reason, (reasons.get(entry.reason) ?? 0) + 1);
  });
  const commonReason = [...reasons.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const before = dominantLevel(beforeEntries);
  const during = dominantLevel(duringEntries);

  let summary = 'You logged a few observations during this experiment.';
  if (before && during && before !== during) {
    summary = `Your most common check-in shifted from ${before} before the experiment to ${during} during it.`;
  } else if (during) {
    summary = `Your most common check-in during this experiment was ${during}.`;
  }

  return {
    before,
    during,
    beforeCount: beforeEntries.length,
    duringCount: duringEntries.length,
    commonReason,
    summary: `${summary} This is an observation, not proof the experiment caused the change.`,
  };
}
