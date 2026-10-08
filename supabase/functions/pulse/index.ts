// Supabase Edge Function: "pulse"
// Backs "Ask Wildhour". Proxies Anthropic so the API key never ships to
// clients, AND owns the system prompt + safety guardrails (the chatbot
// "prompts" live here, server-side).
//
// Deploy:   supabase functions deploy pulse
// Secret:   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// Client:   set EXPO_PUBLIC_PULSE_FN to this function's URL.
//
// Preferred request (server builds the prompt from the user's data):
//   { kind: 'reading' | 'chat',
//     archetype: { name, oneLiner },
//     chips: { peak, crash, recharge },
//     profileLines: string[],            // ["<question> → <answer>", ...]
//     history?: [{ role, text }],         // chat only
//     question?: string,                  // chat only
//     checkins?: string }                 // chat only: recent check-in summary
//                                         // ('' = none yet; capped at CHECKIN_MAX)

// @ts-ignore esm import resolved by the Supabase Edge (Deno) runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MODEL = 'claude-opus-4-8';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

// Per-identity limits per 60s (on top of the client-side throttle). Chat is
// interactive so it gets more headroom; readings are one-shot so they're tighter.
const RATE_WINDOW_SECS = 60;
const RATE_MAX_CHAT = 30;
const RATE_MAX_READING = 8;

// Max length of the client-built check-in summary (matches CHECKIN_SUMMARY_MAX
// in app/src/logic/ai.ts).
const CHECKIN_MAX = 1200;

const cors: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ── The assistant's voice + guardrails (the chatbot prompt) ─────────────────
const VOICE = `VOICE (follow exactly):
- Talk like a perceptive friend who happens to know neuroscience. Never a therapist, never a hype coach, never a fortune cookie.
- Smart, calm, personal, a little mysterious. Specific over vague.
- Reference the actual pattern you see in their answers. That's the proof you're paying attention.
- Always give one concrete, doable thing. Always leave them an out; never moralize about rest, food, or productivity.
- No fake-deep poetry, no "manifest your best self", no corporate-wellness language, no emoji spam.
- Write in plain sentences. Never use em dashes (—); use a period, comma or colon instead.
- Keep replies to 2-4 sentences unless they ask for more.`;

const EVIDENCE = `EVIDENCE YOU CAN DRAW ON (only state what's supported; don't invent studies or numbers):
- A master clock (SCN) set by light coordinates sleep, body temperature, hormones (cortisol up in morning light, melatonin up in darkness), and metabolism.
- Regularity of sleep timing predicts mood (depression/anxiety risk) better than duration alone; consistent timing also supports memory and stress resilience.
- Glucose tolerance is higher in the morning; eating earlier is linked to better blood-sugar control.
- Chronic circadian disruption (e.g. night-shift work) is associated with higher cardiovascular and some cancer risk.
- Frame these as general findings/associations, not promises or personal diagnoses.`;

const BOUNDARIES = `BOUNDARIES:
- You are not a doctor or therapist. Don't diagnose, name conditions, or give medical, psychiatric, or medication advice.
- If they describe something clinical or concerning (persistent insomnia, panic, deep lows, self-harm), say plainly and calmly that it's worth talking to a qualified professional (brief, no alarm), then offer what you genuinely can help with.
- Treat the rhythm animal as an app-generated reflection, never a diagnosis, validated chronotype, or biological measurement.\n- Never claim Wildhour can predict a crash, burnout, disease, hormone level, or nervous-system state. Use tentative language such as “you may notice” or “your answers suggest.”\n- If asked for medical or diagnostic certainty, decline gently and point them to a professional.`;

const READING_PROMPT =
  "Give me my first read. In 3-4 sentences: what my rhythm means day-to-day, and the one thing to protect this week. Don't restate the animal name back to me.";

// deno-lint-ignore no-explicit-any
function buildSystem(p: any, checkins?: string): string {
  const a = p.archetype ?? {};
  const c = p.chips ?? {};
  const profile = Array.isArray(p.profileLines)
    ? p.profileLines.map((l: string) => `- ${l}`).join('\n')
    : '';
  // undefined: not provided (readings), so say nothing. '': none logged yet.
  const checkinSection =
    checkins === undefined
      ? ''
      : checkins
        ? `Their recent daily check-ins (self-reported as steady, flat or wired, with an optional reason):
${checkins}
Use these only as self-reported observations. A few days is not a pattern; say so when the data is thin.

`
        : `They have not logged any daily check-ins yet. If asked about check-in patterns, say there are no check-ins to look at yet and suggest checking in for a few days.

`;
  return `You are Wildhour, the AI companion inside the Wildhour app (the feature is called Ask Wildhour), a wellness app that helps people reflect on daily energy, sleep-routine, and focus patterns. If you refer to yourself, use Wildhour; never use any other name.

The user just took the onboarding quiz. Their rhythm animal is the ${a.name ?? 'unknown'} (${a.oneLiner ?? ''}). From their actual answers: their reported focus window is ${c.peak ?? 'unknown'}, a possible lower-energy window is ${c.crash ?? 'unknown'}, and they say they recharge through ${c.recharge ?? 'unknown'}.

Their raw answers:
${profile}

${checkinSection}${VOICE}

${EVIDENCE}

${BOUNDARIES}`;
}

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

// One-way hash of an IP for rate-limit keys, salted with a server secret when
// one is configured (RATE_LIMIT_SALT) so hashes can't be reversed by lookup.
async function hashIp(ip: string): Promise<string> {
  // @ts-ignore Deno.env in the edge runtime
  const salt = Deno.env.get('RATE_LIMIT_SALT') ?? 'circadia-rate-limit';
  const bytes = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest).slice(0, 16), (b) => b.toString(16).padStart(2, '0')).join('');
}

// Extract the Supabase user id from a JWT (null for the anon key / no token).
function jwtSub(auth: string | null): string | null {
  if (!auth) return null;
  const token = auth.replace(/^Bearer\s+/i, '');
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.sub === 'string' && payload.role !== 'anon' ? payload.sub : null;
  } catch {
    return null;
  }
}

// Returns true if allowed. Separate buckets per kind. Fails open (allows) if the
// rate-limit store is unavailable, so a misconfig never takes the chat down.
async function withinRateLimit(req: Request, kind: string): Promise<boolean> {
  try {
    // @ts-ignore Deno.env in the edge runtime
    const url = Deno.env.get('SUPABASE_URL');
    // @ts-ignore Deno.env in the edge runtime
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !serviceKey) return true;

    const bucket = kind === 'reading' ? 'r' : 'c';
    const max = kind === 'reading' ? RATE_MAX_READING : RATE_MAX_CHAT;
    const sub = jwtSub(req.headers.get('Authorization'));
    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
    // Never store raw IPs: anonymous counters are keyed by a one-way hash.
    const id = sub ? `pulse:u:${sub}:${bucket}` : `pulse:ip:${await hashIp(ip)}:${bucket}`;

    const admin = createClient(url, serviceKey);
    const { data, error } = await admin.rpc('check_rate_limit', {
      p_id: id,
      p_max: max,
      p_window_secs: RATE_WINDOW_SECS,
    });
    if (error) return true; // fail open
    return data !== false;
  } catch {
    return true;
  }
}

// @ts-ignore Deno global is provided by the Supabase Edge runtime.
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  try {
    // @ts-ignore Deno.env in the edge runtime
    const key = Deno.env.get('ANTHROPIC_API_KEY');
    if (!key) return json({ error: 'ANTHROPIC_API_KEY not set' }, 500);

    const body = await req.json();

    if (!(await withinRateLimit(req, String(body.kind ?? 'chat'))))
      return json({ error: 'rate_limited' }, 429);

    if (body.kind !== 'reading' && body.kind !== 'chat') {
      return json({ error: 'invalid request kind' }, 400);
    }

    // Optional chat-only check-in summary: must be a string, trimmed and capped.
    if (body.checkins !== undefined && typeof body.checkins !== 'string') {
      return json({ error: 'invalid checkins' }, 400);
    }
    const checkins =
      body.kind === 'chat' && typeof body.checkins === 'string'
        ? body.checkins.trim().slice(0, CHECKIN_MAX)
        : undefined;

    const system = buildSystem(body, checkins);
    let messages: { role: string; content: string }[];
    let maxTokens = 400;

    if (body.kind === 'reading') {
      messages = [{ role: 'user', content: READING_PROMPT }];
      maxTokens = 500;
    } else {
      const history = Array.isArray(body.history)
        ? body.history
            .filter((t: { role?: string; text?: string }) =>
              (t.role === 'user' || t.role === 'assistant') && typeof t.text === 'string'
            )
            .slice(-12)
            .map((t: { role: string; text: string }) => ({
              role: t.role,
              content: t.text.slice(0, 4000),
            }))
        : [];
      const question = typeof body.question === 'string' ? body.question.trim().slice(0, 4000) : '';
      if (!question) return json({ error: 'question required' }, 400);
      messages = [...history, { role: 'user', content: question }];
    }

    const r = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages }),
    });
    if (!r.ok) return json({ error: `anthropic ${r.status}` }, 502);

    const data = await r.json();
    const text = (data.content ?? [])
      .filter((b: { type: string }) => b.type === 'text')
      .map((b: { text: string }) => b.text)
      .join('')
      .trim();
    return json({ text });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
