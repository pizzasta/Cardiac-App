// Pulse backend proxy — a Cloudflare Worker that calls the Anthropic API with a
// server-side key, so no secret ever ships to the app. The Circadia client
// (app/src/logic/ai.ts) POSTs here when EXPO_PUBLIC_PULSE_ENDPOINT is set.
//
// Deploy (free tier works):
// 1. npm i -g wrangler && wrangler login
// 2. wrangler deploy server/pulse-worker.js --name circadia-pulse --compatibility-date 2024-11-01
// 3. wrangler secret put ANTHROPIC_API_KEY (paste your key)
// 4. Set EXPO_PUBLIC_PULSE_ENDPOINT to the worker URL and rebuild the app.
//
// CORS: only the origins in ALLOWED_ORIGINS may call this worker.
// Add 'http://localhost:8081' (or your Expo dev port) during local development.

const ALLOWED_ORIGINS = [
    'https://pizzasta.github.io',
    // 'http://localhost:8081', // uncomment for local Expo dev
  ];

const MODEL_DEFAULT = 'claude-opus-4-8';
const MAX_TOKENS_CAP = 1024; // clamp so the endpoint can't be abused for huge outputs

function getAllowedOrigin(origin) {
    return ALLOWED_ORIGINS.includes(origin) ? origin : null;
}

function corsHeaders(origin) {
    return {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

export default {
    async fetch(request, env) {
          const origin = request.headers.get('Origin') ?? '';
          const allowedOrigin = getAllowedOrigin(origin);

      if (request.method === 'OPTIONS') {
              // For preflight: respond with the requesting origin if allowed, else the
            // first entry so the browser at least gets a valid CORS header to inspect.
            const preflightOrigin = allowedOrigin ?? ALLOWED_ORIGINS[0];
              return new Response(null, { headers: corsHeaders(preflightOrigin) });
      }

      // Reject requests from unlisted origins.
      if (!allowedOrigin) {
              return new Response('Forbidden', { status: 403 });
      }

      if (request.method !== 'POST') {
              return json({ error: 'POST only' }, 405, allowedOrigin);
      }
          if (!env.ANTHROPIC_API_KEY) {
                  return json({ error: 'server missing ANTHROPIC_API_KEY' }, 500, allowedOrigin);
          }

      let body;
          try {
                  body = await request.json();
          } catch {
                  return json({ error: 'invalid JSON' }, 400, allowedOrigin);
          }

      const { system, messages, model, max_tokens } = body || {};
          if (!Array.isArray(messages) || messages.length === 0) {
                  return json({ error: 'messages required' }, 400, allowedOrigin);
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
              return json({ error: 'upstream error', status: upstream.status, detail }, 502, allowedOrigin);
      }

      const data = await upstream.json();
          const text = (data.content || [])
            .filter((b) => b.type === 'text')
            .map((b) => b.text)
            .join('')
            .trim();

      return json({ text }, 200, allowedOrigin);
    },
};

function json(obj, status = 200, origin = ALLOWED_ORIGINS[0]) {
    return new Response(JSON.stringify(obj), {
          status,
          headers: { 'content-type': 'application/json', ...corsHeaders(origin) },
    });
}
