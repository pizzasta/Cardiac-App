// Supabase Edge Function: "pulse"
// Proxies Anthropic so the API key never ships to clients, AND owns Pulse's
// system prompt + safety guardrails (the chatbot "prompts" live here, server-side).
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
//     question?: string }                 // chat only
// Also accepts a legacy passthrough: { system, messages, max_tokens, model }.

// @ts-ignore esm import resolved by the Supabase Edge (Deno) runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MODEL = 'claude-opus-4-8';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

// Per-identity limit: 30 requests / 60s (on top of the client-side throttle).
const RATE_MAX = 30;
const RATE_WINDOW_SECS = 60;

const cors: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ── Pulse's voice + guardrails (the chatbot prompt) ─────────────────────────
const VOICE = `VOICE — follow exactly:
- Talk like a perceptive friend who happens to know neuroscience. Never a therapist, never a hype coach, never a fortune cookie.
- Smart, calm, personal, a little mysterious. Specific over vague.
- Reference the actual pattern you see in their answers — that's the proof you're paying attention.
- Always give one concrete, doable thing. Always leave them an out; never moralize about rest, food, or productivity.
- No fake-deep poetry, no "manifest your best self", no corporate-wellness language, no emoji spam.
- Keep replies to 2-4 sentences unless they ask for more.`;

const EVIDENCE = `EVIDENCE YOU CAN DRAW ON (only state what's supported; don't invent studies or numbers):
- A master clock (SCN) set by light coordinates sleep, body temperature, hormones (cortisol up in morning light, melatonin up in darkness), and metabolism.
- Regularity of sleep timing predicts mood (depression/anxiety risk) better than duration alone; consistent timing also supports memory and stress resilience.
- Glucose tolerance is higher in the morning; eating earlier is linked to better blood-sugar control.
- Chronic circadian disruption (e.g. night-shift work) is associated with higher cardiovascular and some cancer risk.
- Frame these as general findings/associations, not promises or personal diagnoses.`;

const BOUNDARIES = `BOUNDARIES:
- You are not a doctor or therapist. Don't diagnose, name conditions, or give medical, psychiatric, or medication advice.
- If they describe something clinical or concerning (persistent insomnia, panic, deep lows, self-harm), say plainly and calmly that it's worth talking to a qualified professional — brief, no alarm — then offer what you genuinely can help with.
- If asked for medical or diagnostic certainty, decline gently and point them to a professional.`;

const READING_PROMPT =
  "Give me my first read. In 3-4 sentences: what my rhythm means day-to-day, and the one thing to protect this week. Don't restate the animal name back to me.";

// deno-lint-ignore no-explicit-any
function buildSystem(p: any): string {
  const a = p.archetype ?? {};
  const c = p.chips ?? {};
  const profile = Array.isArray(p.profileLines)
    ? p.profileLines.map((l: string) => `- ${l}`).join('\n')
    : '';
  return `You are Pulse, the AI companion inside Circadia, a wellness app that reads people's nervous-system rhythms.

The user just took the onboarding quiz. Their rhythm animal is the ${a.name ?? 'unknown'} (${a.oneLiner ?? ''}). From their actual answers: peak focus ${c.peak ?? '—'}, crash risk around ${c.crash ?? '—'}, recharges through ${c.recharge ?? '—'}.

Their raw answers:
${profile}

${VOICE}

${EVIDENCE}

${BOUNDARIES}`;
}

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
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

// Returns true if allowed. Fails open (allows) if the rate-limit store is
// unavailable, so a misconfig never takes Pulse down.
async function withinRateLimit(req: Request): Promise<boolean> {
  try {
    // @ts-ignore Deno.env in the edge runtime
    const url = Deno.env.get('SUPABASE_URL');
    // @ts-ignore Deno.env in the edge runtime
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !serviceKey) return true;

    const sub = jwtSub(req.headers.get('Authorization'));
    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
    const id = sub ? `pulse:u:${sub}` : `pulse:ip:${ip}`;

    const admin = createClient(url, serviceKey);
    const { data, error } = await admin.rpc('check_rate_limit', {
      p_id: id,
      p_max: RATE_MAX,
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

    if (!(await withinRateLimit(req))) return json({ error: 'rate_limited' }, 429);

    const body = await req.json();

    let system: string;
    let messages: { role: string; content: string }[];
    let maxTokens = 400;

    if (body.kind) {
      system = buildSystem(body);
      if (body.kind === 'reading') {
        messages = [{ role: 'user', content: READING_PROMPT }];
        maxTokens = 500;
      } else {
        const history = Array.isArray(body.history)
          ? body.history.map((t: { role: string; text: string }) => ({ role: t.role, content: t.text }))
          : [];
        messages = [...history, { role: 'user', content: String(body.question ?? '') }];
      }
    } else {
      // Legacy passthrough (e.g. existing Cloudflare-worker clients).
      system = String(body.system ?? '');
      messages = body.messages ?? [];
      maxTokens = body.max_tokens ?? 400;
    }

    const r = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: body.model ?? MODEL, max_tokens: maxTokens, system, messages }),
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
