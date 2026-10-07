import AsyncStorage from '@react-native-async-storage/async-storage';

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

export async function getActiveExperiment(): Promise<ActiveExperiment | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as ActiveExperiment; } catch { return null; }
}

export async function startExperiment(item: RhythmExperiment): Promise<ActiveExperiment> {
  const active = { ...item, startedAt: new Date().toISOString() };
  await AsyncStorage.setItem(KEY, JSON.stringify(active));
  return active;
}

export async function stopExperiment(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

export function experimentDay(active: ActiveExperiment, now = new Date()): number {
  const start = new Date(active.startedAt).getTime();
  return Math.max(1, Math.min(active.days, Math.floor((now.getTime() - start) / 86400000) + 1));
}
