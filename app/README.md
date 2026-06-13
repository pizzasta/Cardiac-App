# Circadia — Onboarding Prototype

A runnable Expo (React Native) prototype of Circadia's onboarding loop:
**hook → 8-question quiz → "reading" beat → animated archetype reveal**, with
real archetype-scoring logic and personalized result chips.

See [`../CIRCADIA.md`](../CIRCADIA.md) for the full product concept.

## Run it

```bash
cd app
npm install

# Optional — turns on the AI companion (Pulse). Without it the app still runs,
# falling back to the static archetype reading.
export EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...

npm start        # then press w (web), i (iOS sim), or a (Android),
                 # or scan the QR with Expo Go on your phone
```

## What's here

| Path | What it does |
|---|---|
| `App.tsx` | 5-stage flow state machine (hook → quiz → reading → reveal → pulse) |
| `src/data/quiz.ts` | The 8 questions; each option carries a weight vector over the 6 animals |
| `src/data/archetypes.ts` | The six archetypes: copy, gradient signatures, accents |
| `src/logic/score.ts` | Scoring: sums answer vectors, picks the archetype, pulls personalized chips |
| `src/logic/ai.ts` | Pulse AI — Claude-powered personalized reading + chat (Anthropic SDK) |
| `src/screens/HookScreen.tsx` | "What's your rhythm animal?" with breathing pulse |
| `src/screens/QuizScreen.tsx` | Swipe-free quiz; selecting an answer advances + haptics |
| `src/screens/ReadingScreen.tsx` | Short anticipation beat before the reveal |
| `src/screens/RevealScreen.tsx` | The centerpiece — animated archetype card |
| `src/screens/PlanScreen.tsx` | Archetype rhythm plan — adaptive daily flow + tips |
| `src/screens/PulseScreen.tsx` | The AI companion — reading + chat + voice |
| `src/data/plans.ts` | Per-archetype rhythm plans (daily flow + tips) |
| `src/logic/voice.ts` / `.native.ts` | Speech-to-text (Web Speech API on web; native fallback) |
| `src/three/Rainforest.native.tsx` | 3D Amazon-rainforest backdrop (Three.js / `@react-three/fiber` on `expo-gl`) |
| `src/three/Rainforest.tsx` | Web fallback — layered-gradient rainforest (no Three.js) |

The flow is now **hook → quiz → reading → reveal → plan → pulse**, and the
tinted rainforest sits behind the reveal, plan, and Pulse screens (each themed
to the archetype's accent).

## The rhythm plan

After the reveal, "See my rhythm" opens a per-archetype **rhythm plan**
(`src/data/plans.ts`): a time-anchored daily flow (e.g. a Dolphin's "1:45 —
crash incoming, water not coffee") plus targeted tips for focus, recovery,
sleep, and the archetype's specific failure mode. Each plan is grounded in that
animal's peak window, crash, and recharge style — not generic wellness copy.

## Voice (Pulse)

Pulse is voice-activated:
- **Speech-to-text** — tap the mic and talk; on **web** this uses the browser's
  Web Speech API (`voice.ts`). On **native** it degrades gracefully (`voice.native.ts`)
  — on-device STT needs a custom dev build, not Expo Go — and the mic hides.
- **Spoken replies** — the 🔊 toggle has Pulse speak its answers via
  `expo-speech` (works on native and web). Tap the reading card to hear it.

## The 3D rainforest backdrop

The Hook screen ("What's your rhythm animal?") renders an immersive, stylized
Amazon-rainforest scene tuned to Circadia's dusk palette — deep teal-green
depth fog, an instanced layered canopy, a faint shaft of canopy light, and
bioluminescent spores drifting up through the trees, under a slow breathing
camera.

- **Native (iOS/Android):** real 3D via Three.js + `@react-three/fiber` on
  `expo-gl` (`Rainforest.native.tsx`). Trees and foliage are `InstancedMesh`;
  spores are a single animated `Points` — kept light for mobile.
- **Web:** a CSS/gradient approximation (`Rainforest.tsx`) so the Pages bundle
  stays light — **Three.js is not included in the web build** (Metro resolves
  the `.native` vs base file per platform).

`metro.config.js` enables package exports and stubs `node:` builtins so the
native bundle resolves cleanly (the Anthropic SDK references `node:fs` in a
credentials path the app never executes).

## The AI companion (Pulse)

`src/logic/ai.ts` calls Claude (`claude-opus-4-8`) via the official
`@anthropic-ai/sdk`. It feeds the user's **actual quiz answers + archetype**
into a system prompt that enforces Circadia's voice (perceptive friend who
knows neuroscience — specific, calm, one concrete action, never fake-deep), then:

- **`generateReading`** — the opening personalized read on the Pulse screen.
- **`askPulse`** — answers follow-up questions ("when should I work out?").

Both **degrade gracefully**: with no API key (or on any error) the reading
falls back to the static archetype copy and chat is disabled, so the app always
runs.

> ⚠️ **Security:** `EXPO_PUBLIC_*` values are bundled into the client, so this
> direct-from-device setup is for the prototype only. Before release, move the
> Claude call behind a backend proxy (`/api/pulse`) and drop the public key.

## How scoring works

Each quiz answer holds a small point vector across the six animals
(e.g. "Wired late" → `{ wolf: 3, dolphin: 1 }`). Answers are summed and the
top animal wins (ties broken toward more distinctive archetypes so results
don't collapse to the safe middle). Three answers are also tagged so the
reveal's **Peak focus / Crash risk / Recharge** chips come from the user's
*actual* responses — the "scary accurate" feel.

## Not yet built (next steps)

The Today dashboard and weekly report are specced in `CIRCADIA.md` but not yet
built. The reveal's "See my rhythm" button now opens **Pulse** (the AI
companion); the adaptive Today dashboard is the next screen to add.
