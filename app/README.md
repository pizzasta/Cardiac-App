# Circadia — Onboarding Prototype

A runnable Expo (React Native) prototype of Circadia's onboarding loop:
**hook → 8-question quiz → "reading" beat → animated archetype reveal**, with
real archetype-scoring logic and personalized result chips.

See [`../CIRCADIA.md`](../CIRCADIA.md) for the full product concept.

## Run it

```bash
cd app
npm install
npm start        # then press w (web), i (iOS sim), or a (Android),
                 # or scan the QR with Expo Go on your phone
```

## What's here

| Path | What it does |
|---|---|
| `App.tsx` | 4-stage flow state machine (hook → quiz → reading → reveal) |
| `src/data/quiz.ts` | The 8 questions; each option carries a weight vector over the 6 animals |
| `src/data/archetypes.ts` | The six archetypes: copy, gradient signatures, accents |
| `src/logic/score.ts` | Scoring: sums answer vectors, picks the archetype, pulls personalized chips |
| `src/screens/HookScreen.tsx` | "What's your rhythm animal?" with breathing pulse |
| `src/screens/QuizScreen.tsx` | Swipe-free quiz; selecting an answer advances + haptics |
| `src/screens/ReadingScreen.tsx` | Short anticipation beat before the reveal |
| `src/screens/RevealScreen.tsx` | The centerpiece — animated archetype card |

## How scoring works

Each quiz answer holds a small point vector across the six animals
(e.g. "Wired late" → `{ wolf: 3, dolphin: 1 }`). Answers are summed and the
top animal wins (ties broken toward more distinctive archetypes so results
don't collapse to the safe middle). Three answers are also tagged so the
reveal's **Peak focus / Crash risk / Recharge** chips come from the user's
*actual* responses — the "scary accurate" feel.

## Not yet built (next steps)

The Today dashboard, Pulse AI, and weekly report are specced in `CIRCADIA.md`
but out of scope for this onboarding prototype. The reveal's "See my rhythm"
button is where that flow begins.
