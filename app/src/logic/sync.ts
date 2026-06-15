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

// Save a quiz result (+ onboarding answers) and set the current archetype.
export async function pushResult(
    r: { animal: string; peak: string; crash: string; recharge: string },
    answers?: { questionId: string; answer: string }[]
  ) {
    try {
          if (!supabase) return;
          const uid = await currentUserId();
          if (!uid) return;
          const { data, error } = await supabase
            .from('results')
            .insert({
                      user_id: uid,
                      archetype_id: r.animal,
                      peak: r.peak,
                      crash: r.crash,
                      recharge: r.recharge,
            })
            .select('id')
            .single();
          if (error || !data) return;
          await supabase.from('profiles').update({ current_archetype_id: r.animal }).eq('id', uid);
          if (answers && answers.length) {
                  await supabase.from('onboarding_answers').insert(
                            answers.map((an) => ({
                                        user_id: uid,
                                        result_id: data.id,
                                        question_id: an.questionId,
                                        answer: an.answer,
                            }))
                          );
          }
    } catch {
          /* best-effort */
    }
}

// Authoritative streak from the trigger-maintained table.
export async function fetchStreak(): Promise<{ current: number; longest: number } | null> {
    try {
          if (!supabase) return null;
          const uid = await currentUserId();
          if (!uid) return null;
          const { data } = await supabase
            .from('streaks')
            .select('current_streak, longest_streak')
            .eq('user_id', uid)
            .maybeSingle();
          if (!data) return null;
          return { current: data.current_streak, longest: data.longest_streak };
    } catch {
          return null;
    }
}

// ── Data deletion (privacy: right to delete) ────────────────────────────────

// Wipe all on-device user data (keeps sound/volume prefs).
export async function clearLocalData() {
    try {
          await AsyncStorage.multiRemove(['circadia.pulselog', 'circadia.onboarded', 'circadia.user']);
    } catch {
          /* best-effort */
    }
}

// Delete the signed-in user's cloud rows (RLS lets users delete their own).
export async function deleteCloudData() {
    try {
          if (!supabase) return;
          const uid = await currentUserId();
          if (!uid) return;
          await supabase.from('onboarding_answers').delete().eq('user_id', uid);
          await supabase.from('check_ins').delete().eq('user_id', uid);
          await supabase.from('results').delete().eq('user_id', uid);
          await supabase
            .from('profiles')
            .update({ onboarding_complete: false, current_archetype_id: null })
            .eq('id', uid);
    } catch {
          /* best-effort */
    }
}

// Permanently delete the account (and cascade all data) via the RPC.
export async function deleteAccount(): Promise<boolean> {
    try {
          if (!supabase) return false;
          const uid = await currentUserId();
          if (!uid) return false;
          const { error } = await supabase.rpc('delete_account');
          if (error) return false;
          await supabase.auth.signOut().catch(() => {});
          return true;
    } catch {
          return false;
    }
}

// Subscribe to realtime changes on the signed-in user's check-ins. Returns an
// unsubscribe function. No-op (returns a noop) when Supabase is off.
export function subscribeCheckIns(onChange: () => void): () => void {
    if (!supabase) return () => {};
    let channel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null;
    let cancelled = false;
    (async () => {
          const uid = await currentUserId();
          if (!uid || cancelled || !supabase) return;
          channel = supabase
            .channel(`check_ins:${uid}`)
            .on(
                      'postgres_changes',
              { event: '*', schema: 'public', table: 'check_ins', filter: `user_id=eq.${uid}` },
                      () => onChange()
                    )
            .subscribe();
    })();
    return () => {
          cancelled = true;
          if (channel && supabase) supabase.removeChannel(channel);
    };
}

// Number of distinct weeks with check-ins, from the emotional_trends view.
export async function fetchWeeksTracked(): Promise<number | null> {
    try {
          if (!supabase) return null;
          const uid = await currentUserId();
          if (!uid) return null;
          const { data } = await supabase.from('emotional_trends').select('week').eq('user_id', uid);
          return data ? data.length : null;
    } catch {
          return null;
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

// Pull remote check-ins and merge into the local log using last-write-wins
// (LWW) conflict resolution: whichever entry has the newer `ts` timestamp wins.
// This prevents a reconnect from silently clobbering offline edits, while still
// picking up legitimate remote updates (e.g. edits made on another device).
export async function pullCheckIns() {
    try {
          if (!supabase) return;
          const uid = await currentUserId();
          if (!uid) return;
          // Bounded: the dashboard only ever shows recent history.
      const floor = new Date();
          floor.setDate(floor.getDate() - 180);
          const since = `${floor.getFullYear()}-${String(floor.getMonth() + 1).padStart(2, '0')}-${String(
                  floor.getDate()
                ).padStart(2, '0')}`;
          const { data } = await supabase
            .from('check_ins')
            .select('local_date, level, reason, updated_at')
            .eq('user_id', uid)
            .gte('local_date', since)
            .order('local_date', { ascending: false })
            .limit(366);
          if (!data) return;

      const raw = await AsyncStorage.getItem(PULSELOG_KEY);
          const local: PulseEntry[] = raw ? JSON.parse(raw) : [];
          const byDate = new Map<string, PulseEntry>(local.map((e) => [e.date, e]));

      for (const row of data) {
              const existing = byDate.get(row.local_date);
              // Remote `updated_at` as epoch ms; fall back to the date string itself so
            // rows without a timestamp are still ingested (older schema).
            const remoteTs = row.updated_at
                ? Date.parse(row.updated_at)
                      : Date.parse(row.local_date);

            // LWW: only overwrite the local entry if the remote one is strictly newer.
            if (!existing || remoteTs > (existing.ts ?? 0)) {
                      byDate.set(row.local_date, {
                                  date: row.local_date,
                                  level: row.level,
                                  reason: row.reason ?? undefined,
                                  ts: remoteTs,
                      });
            }
      }

      const merged = Array.from(byDate.values()).sort((a, b) => (a.date < b.date ? -1 : 1));
          await AsyncStorage.setItem(PULSELOG_KEY, JSON.stringify(merged));
    } catch {
          /* best-effort */
    }
}
