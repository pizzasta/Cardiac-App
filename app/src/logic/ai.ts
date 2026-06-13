import Anthropic from '@anthropic-ai/sdk';
import { ARCHETYPES } from '../data/archetypes';
import { Option, QUIZ } from '../data/quiz';
import { RhythmResult } from './score';
import { supabase } from './supabase';

// Sentinel returned by the function path when the server rate-limit trips, so
// callers can surface a friendly message instead of a generic error.
const RATE_LIMITED = '__rate_limited__';
const RATE_LIMIT_MSG = 'You’re going a little fast for me — give it a few seconds and try again.';

// ---------------------------------------------------------------------------
// Pulse — Circadia's AI companion.
//
// Three ways to reach Claude, in priority order:
//   1. A Supabase Edge Function (EXPO_PUBLIC_PULSE_FN) that holds the key AND
//      owns the system prompt server-side — the client sends only the user's
//      data. This is the recommended production path. See
//      supabase/functions/pulse/index.ts.
//   2. A generic backend proxy (EXPO_PUBLIC_PULSE_ENDPOINT) that holds the key
//      but takes a client-built prompt (e.g. the Cloudflare worker).
//   3. Direct from the client with EXPO_PUBLIC_ANTHROPIC_API_KEY — dev only,
//      since EXPO_PUBLIC_* values are bundled into the app.
// If none is set, Pulse degrades to static copy so the app still runs.
// ---------------------------------------------------------------------------

const MODEL = 'claude-opus-4-8';
const SUPA_FN = process.env.EXPO_PUBLIC_PULSE_FN;
const SUPA_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const ENDPOINT = process.env.EXPO_PUBLIC_PULSE_ENDPOINT;
const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

export const hasAI = () => !!SUPA_FN || !!ENDPOINT || !!API_KEY;

const client =
  !ENDPOINT && API_KEY
    ? new Anthropic({ apiKey: API_KEY, dangerouslyAllowBrowser: true })
    : null;

export interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

// Pulse's voice — the guardrails from the concept doc, enforced as a system prompt.
function systemPrompt(result: RhythmResult, answers: Option[]): string {
  const a = ARCHETYPES[result.animal];
  const profile = answers
    .map((opt, i) => `- ${QUIZ[i].prompt} → ${opt.label}`)
    .join('\n');

  return `You are Pulse, the AI companion inside Circadia, a wellness app that reads people's nervous-system rhythms.

The user just took the onboarding quiz. Their rhythm animal is the ${a.name} (${a.oneLiner}). From their actual answers: peak focus ${result.peak}, crash risk around ${result.crash}, recharges through ${result.recharge}.

Their raw answers:
${profile}

VOICE — follow exactly:
- Talk like a perceptive friend who happens to know neuroscience. Never a therapist, never a hype coach, never a fortune cookie.
- Smart, calm, personal, a little mysterious. Specific over vague.
- Reference the actual pattern you see in their answers — that's the proof you're paying attention.
- Always give one concrete, doable thing. Always leave them an out; never moralize about rest, food, or productivity.
- No fake-deep poetry, no "manifest your best self", no corporate-wellness "wellness journey" language, no emoji spam.
- Keep replies to 2-4 sentences unless they ask for more.

EVIDENCE YOU CAN DRAW ON (only state what's supported; don't invent studies or numbers):
- A master clock (SCN) set by light coordinates sleep, body temperature, hormones (cortisol up in morning light, melatonin up in darkness), and metabolism.
- Regularity of sleep timing predicts mood (depression/anxiety risk) better than duration alone; consistent timing also supports memory and stress resilience.
- Glucose tolerance is higher in the morning; eating earlier is linked to better blood-sugar control.
- Chronic circadian disruption (e.g. night-shift work) is associated with higher cardiovascular and some cancer risk.
- Frame these as general findings/associations, not promises or personal diagnoses.

BOUNDARIES:
- You are not a doctor or therapist. Don't diagnose, name conditions, or give medical, psychiatric, or medication advice.
- If they describe something clinical or concerning (e.g. persistent insomnia, panic, deep lows, self-harm), say plainly that this is worth talking to a qualified professional about — calm, brief, no alarm — then offer what you genuinely can help with.`;
}

type Msg = { role: 'user' | 'assistant'; content: string };

// The pieces the edge function needs to build the prompt server-side (so the
// system prompt + guardrails live on the server, not in the client bundle).
function profilePieces(result: RhythmResult, answers: Option[]) {
  const a = ARCHETYPES[result.animal];
  return {
    archetype: { name: a.name, oneLiner: a.oneLiner },
    chips: { peak: result.peak, crash: result.crash, recharge: result.recharge },
    profileLines: answers.map((opt, i) => `${QUIZ[i].prompt} → ${opt.label}`),
  };
}

// Preferred path: POST structured data to the Supabase Edge Function, which
// owns the prompt and the key.
async function callSupabaseFn(kind: 'reading' | 'chat', payload: Record<string, unknown>): Promise<string> {
  // Send the signed-in user's token so rate limiting is per-user (falls back to
  // the anon key — then the server limits by IP).
  let token = SUPA_ANON ?? '';
  try {
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) token = data.session.access_token;
    }
  } catch {
    /* use anon */
  }
  const res = await fetch(SUPA_FN as string, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      apikey: SUPA_ANON ?? '',
    },
    body: JSON.stringify({ kind, ...payload }),
  });
  if (res.status === 429) return RATE_LIMITED;
  if (!res.ok) throw new Error(`pulse-fn ${res.status}`);
  const data = await res.json();
  return String(data.text ?? '').trim();
}

// Production path: POST to the backend proxy, which holds the API key.
async function callBackend(system: string, messages: Msg[], maxTokens: number): Promise<string> {
  const res = await fetch(ENDPOINT as string, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, messages, max_tokens: maxTokens, model: MODEL }),
  });
  if (!res.ok) throw new Error(`backend ${res.status}`);
  const data = await res.json();
  return String(data.text ?? '').trim();
}

// Dev path: call Claude directly from the client.
async function callClient(system: string, messages: Msg[], maxTokens: number): Promise<string> {
  if (!client) throw new Error('no-api-key');
  const res = await client.messages.create({ model: MODEL, max_tokens: maxTokens, system, messages });
  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
}

async function complete(system: string, messages: Msg[], maxTokens: number): Promise<string> {
  if (ENDPOINT) return callBackend(system, messages, maxTokens);
  return callClient(system, messages, maxTokens);
}

// The opening personalized reading shown when Pulse first loads.
// Falls back to the archetype's static reading if AI is unavailable or errors.
export async function generateReading(
  result: RhythmResult,
  answers: Option[]
): Promise<string> {
  if (!hasAI()) return ARCHETYPES[result.animal].reading;
  if (SUPA_FN) {
    try {
      const text = await callSupabaseFn('reading', profilePieces(result, answers));
      return text === RATE_LIMITED ? ARCHETYPES[result.animal].reading : text;
    } catch {
      return ARCHETYPES[result.animal].reading;
    }
  }
  try {
    return await complete(
      systemPrompt(result, answers),
      [
        {
          role: 'user',
          content:
            "Give me my first read. In 3-4 sentences: what my rhythm means day-to-day, and the one thing to protect this week. Don't restate the animal name back to me.",
        },
      ],
      500
    );
  } catch {
    return ARCHETYPES[result.animal].reading;
  }
}

// A follow-up question in the Pulse chat.
export async function askPulse(
  result: RhythmResult,
  answers: Option[],
  history: ChatTurn[],
  question: string
): Promise<string> {
  if (!hasAI()) {
    return "I'm offline right now — add an API key to talk to me. But going on your rhythm: protect your crash window, and don't make it the day's first hard thing.";
  }
  if (SUPA_FN) {
    try {
      const text = await callSupabaseFn('chat', {
        ...profilePieces(result, answers),
        history,
        question,
      });
      return text === RATE_LIMITED ? RATE_LIMIT_MSG : text;
    } catch {
      return 'Something glitched on my end. Try that again in a moment.';
    }
  }
  try {
    return await complete(
      systemPrompt(result, answers),
      [
        ...history.map((t) => ({ role: t.role, content: t.text })),
        { role: 'user' as const, content: question },
      ],
      400
    );
  } catch {
    return "Something glitched on my end. Try that again in a moment.";
  }
}
