import Anthropic from '@anthropic-ai/sdk';
import { blendFor } from '../data/blends';
import { ARCHETYPES } from '../data/archetypes';
import { Option, QUIZ } from '../data/quiz';
import { RhythmResult } from './score';
import { supabase } from './supabase';

// Sentinel returned by the function path when the server rate-limit trips, so
// callers can surface a friendly message instead of a generic error.
const RATE_LIMITED = '__rate_limited__';

// User-facing copy for the chat's error states. Plain and neutral: never
// mention keys, endpoints or other setup details.
export const AI_UNAVAILABLE_MSG = 'Ask Circadia isn’t available right now.';
export const AI_ERROR_MSG = 'That didn’t go through. Check your connection and try again.';
export const AI_TIMEOUT_MSG = 'That took too long to answer. Try again in a moment.';
export const AI_RATE_LIMIT_MSG = 'You’re asking a little fast. Give it a few seconds and try again.';

// How long a single AI request may take before we give up.
export const AI_TIMEOUT_MS = 25_000;

export type AIErrorKind = 'unavailable' | 'timeout' | 'rate_limited' | 'network' | 'http' | 'empty';

// Thrown by the request helpers so callers can render an honest error state
// instead of a fabricated reply.
export class AIError extends Error {
  kind: AIErrorKind;
  constructor(kind: AIErrorKind, message?: string) {
    super(message ?? kind);
    this.name = 'AIError';
    this.kind = kind;
  }
}

// The result of a chat question: either a real answer, or an error the screen
// shows as an error bubble with a "Try again" button.
export type AskResult =
  | { ok: true; text: string }
  | { ok: false; kind: AIErrorKind; message: string; retryable: boolean };

function errorResult(kind: AIErrorKind): AskResult {
  switch (kind) {
    case 'unavailable':
      return { ok: false, kind, message: AI_UNAVAILABLE_MSG, retryable: false };
    case 'timeout':
      return { ok: false, kind, message: AI_TIMEOUT_MSG, retryable: true };
    case 'rate_limited':
      return { ok: false, kind, message: AI_RATE_LIMIT_MSG, retryable: true };
    default:
      return { ok: false, kind, message: AI_ERROR_MSG, retryable: true };
  }
}

function toAIError(e: unknown, signal?: AbortSignal): AIError {
  if (e instanceof AIError) return e;
  const name = (e as { name?: string } | null)?.name;
  if (signal?.aborted || name === 'AbortError' || name === 'APIConnectionTimeoutError') {
    return new AIError('timeout');
  }
  return new AIError('network', e instanceof Error ? e.message : String(e));
}

// Runs `fn` with an AbortSignal that fires after `ms`. Always clears the timer.
export async function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>, ms = AI_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fn(controller.signal);
  } catch (e) {
    throw toAIError(e, controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

// Parse `{ text }` from a JSON response; empty or whitespace text is an error.
async function readText(res: Response): Promise<string> {
  const data = await res.json().catch(() => null);
  const text = String((data as { text?: unknown } | null)?.text ?? '').trim();
  if (!text) throw new AIError('empty');
  return text;
}

// Builds a mailto: link that reports an AI answer to support, with the
// question and (truncated) answer prefilled.
export function buildReportMailto(email: string, question: string, answer: string, maxLen = 1500): string {
  const clip = (s: string) => (s.length > maxLen ? `${s.slice(0, maxLen).trimEnd()}…` : s);
  const subject = 'Report: Ask Circadia answer';
  const body = [
    'I’d like to report this answer from Ask Circadia.',
    '',
    'What I asked:',
    clip(question || '(no question)'),
    '',
    'The answer I got:',
    clip(answer),
    '',
    'What was wrong with it (optional):',
    '',
  ].join('\n');
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

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
// Direct-from-client key is DEV ONLY: EXPO_PUBLIC_* values are bundled into
// the app, so this must never be used in production. Release builds rely on
// the Edge Function (SUPA_FN) or the proxy ENDPOINT instead; __DEV__ is false
// in production bundles, which drops the key from hasAI() and the client below.
const API_KEY = __DEV__ ? process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY : undefined;

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
// The animal's one-liner, plus the blend when there is one, e.g.
// "...; blend: Steady Dolphin (A Bear streak: ...)".
function describe(result: RhythmResult): string {
  const a = ARCHETYPES[result.animal];
  const blend = blendFor(result);
  return blend ? `${a.oneLiner}; blend: ${blend.name} (${blend.line})` : a.oneLiner;
}

function systemPrompt(result: RhythmResult, answers: Option[]): string {
  const a = ARCHETYPES[result.animal];
  const profile = answers
    .map((opt, i) => `- ${QUIZ[i].prompt} → ${opt.label}`)
    .join('\n');

  return `You are Pulse, the AI companion inside Circadia, a wellness app that reads people's nervous-system rhythms.

The user just took the onboarding quiz. Their rhythm animal is the ${a.name} (${describe(result)}). From their actual answers: peak focus ${result.peak}, crash risk around ${result.crash}, recharges through ${result.recharge}.

Their raw answers:
${profile}

VOICE (follow exactly):
- Talk like a perceptive friend who happens to know neuroscience. Never a therapist, never a hype coach, never a fortune cookie.
- Smart, calm, personal, a little mysterious. Specific over vague.
- Reference only patterns supported by the Circadia context provided to you. If the context is insufficient, say you do not have enough information yet.
- Always give one concrete, doable thing. Always leave them an out; never moralize about rest, food, or productivity.
- No fake-deep poetry, no "manifest your best self", no corporate-wellness "wellness journey" language, no emoji spam.
- Write in plain sentences. Never use em dashes (—); use a period, comma or colon instead.
- Keep replies to 2-4 sentences unless they ask for more.

EVIDENCE YOU CAN DRAW ON (only state what's supported; don't invent studies or numbers):
- A master clock (SCN) set by light coordinates sleep, body temperature, hormones (cortisol up in morning light, melatonin up in darkness), and metabolism.
- Regularity of sleep timing predicts mood (depression/anxiety risk) better than duration alone; consistent timing also supports memory and stress resilience.
- Glucose tolerance is higher in the morning; eating earlier is linked to better blood-sugar control.
- Chronic circadian disruption (e.g. night-shift work) is associated with higher cardiovascular and some cancer risk.
- Frame these as general findings/associations, not promises or personal diagnoses.
- Never present a correlation, check-in pattern, rhythm profile, or AI inference as proof of cause.
- Never invent a check-in, symptom, behavior, event, or personal fact that is not in the supplied context.
- When discussing a personalized pattern, distinguish what was observed from what is only a possible interpretation.

BOUNDARIES:
- You are not a doctor or therapist. Don't diagnose, name conditions, or give medical, psychiatric, or medication advice.
- If they describe something clinical or concerning (e.g. persistent insomnia, panic, deep lows, self-harm), say plainly that this is worth talking to a qualified professional about (calm, brief, no alarm), then offer what you genuinely can help with.
- Do not claim Circadia or Pulse can diagnose, prevent, treat, cure, predict, or rule out a disease or mental-health condition.`;
}

type Msg = { role: 'user' | 'assistant'; content: string };

// The pieces the edge function needs to build the prompt server-side (so the
// system prompt + guardrails live on the server, not in the client bundle).
function profilePieces(result: RhythmResult, answers: Option[]) {
  const a = ARCHETYPES[result.animal];
  return {
    archetype: { name: a.name, oneLiner: describe(result) },
    chips: { peak: result.peak, crash: result.crash, recharge: result.recharge },
    profileLines: answers.map((opt, i) => `${QUIZ[i].prompt} → ${opt.label}`),
  };
}

// Preferred path: POST structured data to the Supabase Edge Function, which
// owns the prompt and the key.
async function callSupabaseFn(
  kind: 'reading' | 'chat',
  payload: Record<string, unknown>,
  signal?: AbortSignal
): Promise<string> {
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
    signal,
  });
  if (res.status === 429) return RATE_LIMITED;
  if (!res.ok) throw new AIError('http', `pulse-fn ${res.status}`);
  return readText(res);
}

// Production path: POST to the backend proxy, which holds the API key.
async function callBackend(system: string, messages: Msg[], maxTokens: number, signal?: AbortSignal): Promise<string> {
  const res = await fetch(ENDPOINT as string, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, messages, max_tokens: maxTokens, model: MODEL }),
    signal,
  });
  if (res.status === 429) return RATE_LIMITED;
  if (!res.ok) throw new AIError('http', `backend ${res.status}`);
  return readText(res);
}

// Dev path: call Claude directly from the client.
async function callClient(system: string, messages: Msg[], maxTokens: number, signal?: AbortSignal): Promise<string> {
  if (!client) throw new AIError('unavailable');
  const res = await client.messages.create(
    { model: MODEL, max_tokens: maxTokens, system, messages },
    { signal, maxRetries: 0 }
  );
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
  if (!text) throw new AIError('empty');
  return text;
}

async function complete(system: string, messages: Msg[], maxTokens: number, signal?: AbortSignal): Promise<string> {
  if (ENDPOINT) return callBackend(system, messages, maxTokens, signal);
  return callClient(system, messages, maxTokens, signal);
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
      const text = await withTimeout((signal) => callSupabaseFn('reading', profilePieces(result, answers), signal));
      return text === RATE_LIMITED ? ARCHETYPES[result.animal].reading : text;
    } catch {
      return ARCHETYPES[result.animal].reading;
    }
  }
  try {
    const text = await withTimeout((signal) =>
      complete(
        systemPrompt(result, answers),
        [
          {
            role: 'user',
            content:
              "Give me my first read. In 3-4 sentences: what my rhythm means day-to-day, and the one thing to protect this week. Don't restate the animal name back to me.",
          },
        ],
        500,
        signal
      )
    );
    return text === RATE_LIMITED ? ARCHETYPES[result.animal].reading : text;
  } catch {
    return ARCHETYPES[result.animal].reading;
  }
}

// A follow-up question in the chat. Never fabricates a reply: on timeout,
// network/HTTP failure, rate limiting or an empty answer it returns an error
// result the screen renders as an error bubble with "Try again".
export async function askPulse(
  result: RhythmResult,
  answers: Option[],
  history: ChatTurn[],
  question: string
): Promise<AskResult> {
  if (!hasAI()) return errorResult('unavailable');
  try {
    const text = await withTimeout((signal) =>
      SUPA_FN
        ? callSupabaseFn('chat', { ...profilePieces(result, answers), history, question }, signal)
        : complete(
            systemPrompt(result, answers),
            [
              ...history.map((t) => ({ role: t.role, content: t.text })),
              { role: 'user' as const, content: question },
            ],
            400,
            signal
          )
    );
    if (text === RATE_LIMITED) return errorResult('rate_limited');
    return { ok: true, text };
  } catch (e) {
    return errorResult(e instanceof AIError ? e.kind : 'network');
  }
}
