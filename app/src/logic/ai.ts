import Anthropic from '@anthropic-ai/sdk';
import { ARCHETYPES } from '../data/archetypes';
import { Option, QUIZ } from '../data/quiz';
import { RhythmResult } from './score';

// ---------------------------------------------------------------------------
// Pulse — Circadia's AI companion.
//
// SECURITY NOTE: For a real release this MUST go through a backend proxy.
// EXPO_PUBLIC_* values are bundled into the client, so the key here would ship
// to users. This direct-from-client setup is for the prototype only; swap
// `callClaude` to hit your own `/api/pulse` endpoint before launch.
// ---------------------------------------------------------------------------

const MODEL = 'claude-opus-4-8';
const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

export const hasAI = () => !!API_KEY;

const client = API_KEY
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

BOUNDARIES:
- You are not a doctor or therapist. Don't diagnose, name conditions, or give medical, psychiatric, or medication advice.
- If they describe something clinical or concerning (e.g. persistent insomnia, panic, deep lows, self-harm), say plainly that this is worth talking to a qualified professional about — calm, brief, no alarm — then offer what you genuinely can help with.`;
}

async function callClaude(
  system: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  maxTokens: number
): Promise<string> {
  if (!client) throw new Error('no-api-key');
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages,
  });
  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
}

// The opening personalized reading shown when Pulse first loads.
// Falls back to the archetype's static reading if AI is unavailable or errors.
export async function generateReading(
  result: RhythmResult,
  answers: Option[]
): Promise<string> {
  if (!hasAI()) return ARCHETYPES[result.animal].reading;
  try {
    return await callClaude(
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
  try {
    return await callClaude(
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
