// Pulse backend proxy — a Cloudflare Worker that calls the Anthropic API with a
// server-side key, so no secret ever ships to the app. The Circadia client
// (app/src/logic/ai.ts) POSTs here when EXPO_PUBLIC_PULSE_ENDPOINT is set.
//
// Deploy (free tier works):
//   1. npm i -g wrangler && wrangler login
//   2. wrangler deploy server/pulse-worker.js --name circadia-pulse --compatibility-date 2024-11-01
//   3. wrangler secret put ANTHROPIC_API_KEY   (paste your key)
//   4. Set EXPO_PUBLIC_PULSE_ENDPOINT to the worker URL and rebuild the app.
//
// Lock CORS down to your real origin before launch (see ALLOW_ORIGIN).

const ALLOW_ORIGIN = '*'; // e.g. 'https://pizzasta.github.io'
const MODEL_DEFAULT = 'claude-opus-4-8';
const MAX_TOKENS_CAP = 1024; // clamp so the endpoint can't be abused for huge outputs

function cors() {
  return {
    'Access-Control-Allow-Origin': ALLOW_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors() });
    }
    if (request.method !== 'POST') {
      return json({ error: 'POST only' }, 405);
    }
    if (!env.ANTHROPIC_API_KEY) {
      return json({ error: 'server missing ANTHROPIC_API_KEY' }, 500);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'invalid JSON' }, 400);
    }

    const { system, messages, model, max_tokens } = body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ error: 'messages required' }, 400);
    }

    // Only pass through the fields we expect, sanitized.
    const safeMessages = messages
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: typeof model === 'string' ? model : MODEL_DEFAULT,
        max_tokens: Math.min(Number(max_tokens) || 512, MAX_TOKENS_CAP),
        system: typeof system === 'string' ? system : undefined,
        messages: safeMessages,
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      return json({ error: 'upstream error', status: upstream.status, detail }, 502);
    }

    const data = await upstream.json();
    const text = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();

    return json({ text });
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', ...cors() },
  });
}
