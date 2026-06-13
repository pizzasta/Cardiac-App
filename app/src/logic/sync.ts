import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import type { Level, PulseEntry } from './pulselog';

// Best-effort cloud sync to Supabase. Every function is a no-op when Supabase
// isn't configured or the user is signed out, and never throws — local-first
// behavior is always preserved.

const PULSELOG_KEY = 'circadia.pulselog';

async function currentUserId(): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

// Push a single day's check-in (upsert on user+date).
export async function pushCheckIn(entry: { date: string; level: Level; reason?: string }) {
  try {
    if (!supabase) return;
    const uid = await currentUserId();
    if (!uid) return;
    await supabase
      .from('check_ins')
      .upsert(
        { user_id: uid, local_date: entry.date, level: entry.level, reason: entry.reason ?? null },
        { onConflict: 'user_id,local_date' }
      );
  } catch {
    /* offline / table missing — local copy is the source of truth */
  }
}

// Save a quiz result and mark it as the user's current archetype.
export async function pushResult(r: {
  animal: string;
  peak: string;
  crash: string;
  recharge: string;
}) {
  try {
    if (!supabase) return;
    const uid = await currentUserId();
    if (!uid) return;
    await supabase.from('results').insert({
      user_id: uid,
      archetype_id: r.animal,
      peak: r.peak,
      crash: r.crash,
      recharge: r.recharge,
    });
    await supabase.from('profiles').update({ current_archetype_id: r.animal }).eq('id', uid);
  } catch {
    /* best-effort */
  }
}

export async function setOnboarding(complete: boolean) {
  try {
    if (!supabase) return;
    const uid = await currentUserId();
    if (!uid) return;
    await supabase.from('profiles').update({ onboarding_complete: complete }).eq('id', uid);
  } catch {
    /* best-effort */
  }
}

// Pull remote check-ins and merge into the local log (local entries win on
// conflict, so unsynced offline days aren't clobbered). Called on sign-in.
export async function pullCheckIns() {
  try {
    if (!supabase) return;
    const uid = await currentUserId();
    if (!uid) return;
    const { data } = await supabase
      .from('check_ins')
      .select('local_date, level, reason')
      .eq('user_id', uid);
    if (!data) return;

    const raw = await AsyncStorage.getItem(PULSELOG_KEY);
    const local: PulseEntry[] = raw ? JSON.parse(raw) : [];
    const byDate = new Map<string, PulseEntry>(local.map((e) => [e.date, e]));

    for (const row of data) {
      if (!byDate.has(row.local_date)) {
        byDate.set(row.local_date, {
          date: row.local_date,
          level: row.level,
          reason: row.reason ?? undefined,
          ts: Date.parse(row.local_date),
        });
      }
    }

    const merged = Array.from(byDate.values()).sort((a, b) => (a.date < b.date ? -1 : 1));
    await AsyncStorage.setItem(PULSELOG_KEY, JSON.stringify(merged));
  } catch {
    /* best-effort */
  }
}
