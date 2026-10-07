import AsyncStorage from '@react-native-async-storage/async-storage';
import { ARCHETYPES } from '../data/archetypes';
import { Option, QUIZ } from '../data/quiz';
import { RhythmResult } from './score';

// Persists the user's rhythm profile (quiz result + answers) on-device so a
// returning user lands back on their plan instead of retaking the quiz.
// Answers are stored as option indices and rehydrated from QUIZ, so copy edits
// to option labels never leave stale objects behind.

export const PROFILE_KEY = 'circadia.profile';

export interface StoredProfile {
  result: RhythmResult;
  answers: Option[];
}

interface Serialized {
  v: 1;
  result: RhythmResult;
  answerIdx: number[];
  savedAt: string;
}

export function serializeProfile(result: RhythmResult, answers: Option[]): string {
  const answerIdx = answers.map((opt, i) =>
    (QUIZ[i]?.options ?? []).findIndex((o) => o.label === opt?.label)
  );
  const payload: Serialized = { v: 1, result, answerIdx, savedAt: new Date().toISOString() };
  return JSON.stringify(payload);
}

export function parseProfile(raw: string | null): StoredProfile | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Partial<Serialized>;
    const r = p?.result;
    if (
      !r ||
      typeof r !== 'object' ||
      !Object.prototype.hasOwnProperty.call(ARCHETYPES, r.animal) ||
      typeof r.peak !== 'string' ||
      typeof r.crash !== 'string' ||
      typeof r.recharge !== 'string'
    ) {
      return null;
    }
    const answers = (Array.isArray(p.answerIdx) ? p.answerIdx : [])
      .map((idx, i) => QUIZ[i]?.options[idx])
      .filter((o): o is Option => !!o);
    return {
      result: { animal: r.animal, peak: r.peak, crash: r.crash, recharge: r.recharge },
      answers,
    };
  } catch {
    return null;
  }
}

export async function saveProfile(result: RhythmResult, answers: Option[]): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, serializeProfile(result, answers));
  } catch {
    // best-effort; the session still works from memory
  }
}

export async function loadProfile(): Promise<StoredProfile | null> {
  try {
    return parseProfile(await AsyncStorage.getItem(PROFILE_KEY));
  } catch {
    return null;
  }
}

export async function clearProfile(): Promise<void> {
  await AsyncStorage.removeItem(PROFILE_KEY).catch(() => {});
}
