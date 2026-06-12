# Circadia

**Know your rhythm. Work with your nervous system, not against it.**

Circadia is an AI wellness app that reads your energy, stress, and sleep patterns and turns them into a living daily rhythm. You take a short quiz, get assigned a rhythm animal, and from then on the app shapes your day around how your nervous system actually works — when to focus, when to recover, when to socialize, when to stop.

It should feel like Spotify Wrapped found out who you are, Finch grew up, and Apple Health learned to talk.

---

## Table of Contents
1. [Concept & Positioning](#1-concept--positioning)
2. [Onboarding Flow](#2-onboarding-flow)
3. [Archetype System](#3-archetype-system)
4. [App Structure & Navigation](#4-app-structure--navigation)
5. [Home / Dashboard](#5-home--dashboard)
6. [AI Interaction Examples](#6-ai-interaction-examples)
7. [Notifications](#7-notifications)
8. [Viral & Social Features](#8-viral--social-features)
9. [Retention Mechanics](#9-retention-mechanics)
10. [Monetization](#10-monetization)
11. [Premium Features](#11-premium-features)
12. [Visual Branding & UI/UX System](#12-visual-branding--uiux-system)
13. [TikTok / Viral Hooks](#13-tiktok--viral-hooks)
14. [App Store Positioning](#14-app-store-positioning)
15. [Launch Strategy](#15-launch-strategy)
16. [Feature Roadmap](#16-feature-roadmap)
17. [Why This Wins](#17-why-this-wins)

---

## 1. Concept & Positioning

### The one-liner
A personalized rhythm engine for your nervous system.

### The real problem
Productivity apps assume everyone runs on the same clock. Wellness apps tell you to "breathe" without knowing anything about you. People are exhausted, overstimulated, and out of sync with their own bodies — and they *feel* it but can't name it.

Circadia names it. It gives people language ("I'm a Dolphin, I crash at 2pm and I'm a light sleeper") and then acts on it. The animal isn't a gimmick — it's the entry point to genuinely useful, adaptive scheduling.

### Positioning statement
> For overstimulated, ambitious people who feel out of sync with their own energy, Circadia is the AI that learns your nervous system and rebuilds your day around it — so you stop white-knuckling through and start running on your actual rhythm.

### Where it sits
- **Not** a meditation app (Calm/Headspace) — it's about *timing and pattern*, not just relaxation.
- **Not** a habit tracker (Finch/Streaks) — it adapts to you instead of demanding streaks.
- **Not** a clinical health app — it's warm, identity-driven, shareable.
- It's the **operating layer between how you feel and how you plan your day.**

### Tone rules (the guardrails for everything)
- Smart, calm, personal, a little mysterious.
- Talks like a perceptive friend who happens to know neuroscience — never a therapist, never a hype coach, never a fortune cookie.
- No fake-deep poetry. No "manifest your best self." No corporate-wellness "wellness journey."
- Specific over vague. "You've had 3 short-sleep nights — protect tomorrow's morning" beats "honor your rest."

---

## 2. Onboarding Flow

Goal: under 90 seconds to the reveal. The reveal is the dopamine hit; everything before it earns it. The quiz must feel like a TikTok personality test, not an intake form.

### Step 0 — The hook screen (pre-quiz)
Full-bleed animated gradient, single line: **"What's your rhythm animal?"** One button: *Find out (60 sec)*. No signup yet. Friction kills virality — the reveal comes before the account.

### Step 1 — The quiz (8 questions, swipeable cards)
Each question is one card, large type, 2–4 tappable answers, soft haptic on select, gradient shifts subtly with each answer. No "Next" button — selecting advances.

1. **Sleep** — "When does your brain actually shut off at night?" (Easily / Takes forever / Wired late / Crash hard then wake up)
2. **Mornings** — "First hour awake, you're…" (Sharp / Foggy / Anxious / Slow but fine)
3. **Social energy** — "After a day around people you feel…" (Charged / Drained / Fine but need to decompress / Depends who)
4. **Stress shape** — "When stress hits, you…" (Speed up / Shut down / Get scattered / Overthink everything)
5. **Focus timing** — "Your best deep-work window is…" (Early AM / Midday / Late afternoon / Night)
6. **The crash** — "Your energy dips hardest around…" (Mid-morning / 2–4pm / Evening / It's random)
7. **Overwhelm** — "Too much at once and you…" (Multitask harder / Freeze / Mask it and push through / Need to disappear)
8. **Recovery** — "You actually recover by…" (Alone & quiet / Movement / People you trust / Total novelty)

### Step 2 — The "reading" moment (3–4 sec)
A loading beat that builds anticipation without feeling fake. Pulse animation, copy cycling:
> *Reading your patterns… / Mapping your energy curve… / Matching your rhythm…*
This is theater, and that's fine — Wrapped does the same thing. Keep it short.

### Step 3 — The reveal
Big animated archetype card. Animal illustration breathes/pulses. Name + tagline + a 2-line "this is you" that feels uncannily accurate (because it's drawn from their actual answers, not generic).
> **You're a Dolphin.** Light sleeper, sharp mind, runs hot. You notice everything — which is a gift and the reason you're tired.

Three quick stat chips: *Peak focus: late morning · Crash risk: 2pm · Recharge: solitude.*

CTA: **See my rhythm** → this is where the soft account wall appears (Apple/Google/email).

### Step 4 — Connect (optional, skippable)
Offer Health/Calendar/Sleep connection with a clear value trade ("Connect sleep → I'll auto-tune your mornings"). Skippable — never block the first dashboard.

### Step 5 — First dashboard
Land on a *pre-populated* Today screen built from quiz answers. Never an empty state. The first thing they see should already be useful and personal.

---

## 3. Archetype System

### Design principle
The animal is the **identity skin**; under it is a real model. Every archetype maps to 4 underlying axes the AI actually uses:
- **Arousal baseline** (how activated the nervous system runs: high ↔ low)
- **Recovery style** (how they refill: solo ↔ social, still ↔ moving)
- **Peak window** (when cognition is best: morning ↔ night)
- **Failure mode** (how they break under load: scatter / freeze / mask / crash)

This means two "Wolves" can differ, and the AI personalizes within the archetype.

### The core six

| Animal | One-liner | Arousal | Peak | Failure mode | Recharge |
|---|---|---|---|---|---|
| 🐬 **Dolphin** | Overstimulated, sharp, light sleeper | High | Late morning | Scatter / can't switch off | Solitude, quiet |
| 🐺 **Wolf** | Night energy, creative in bursts | Med (nocturnal) | Night | Crash after the burst | Novelty, movement |
| 🐻 **Bear** | Steady and reliable, burnout-prone | Low-med | Midday | Slow-burn crash | Deep rest, routine |
| 🐦 **Hummingbird** | Fast, anxious, multitasking | High | Scattered | Freeze / spin out | Grounding, one thing at a time |
| 🦊 **Fox** | Hyper-alert planner, always scanning | Med-high | Early AM | Over-control, can't relax | Permission to stop |
| 🐙 **Octopus** | Emotionally absorbent, social masker | Variable | Variable | Mask until empty | Decompression, low-demand company |

### Evolving archetypes (the retention engine)
Your animal isn't permanent. As Circadia learns your real data, it surfaces **states** and **shifts**:
- **Phases:** "You're in a *Restless Dolphin* phase — 4 short-sleep nights this week."
- **Evolution:** sustained change in patterns can shift your core animal over weeks. ("Your rhythm is moving toward Bear — steadier sleep, slower crashes. Keep going.")
- **Sub-types unlocked over time:** Calm Dolphin, Wired Dolphin, Recovering Bear, etc. These are collectible and shareable without being childish.

### Compatibility layer
Each pairing has a real interaction note, not horoscope fluff:
> **Dolphin + Bear:** You move fast, they move steady. You'll feel "slowed down," they'll feel "rushed." Schedule hard conversations in *their* peak window (midday), not your late-night one.

---

## 4. App Structure & Navigation

Five-tab bottom bar. Mobile-first. The center tab is the AI, slightly raised/glowing — it's the heart of the app.

```
┌─────────────────────────────────────────────┐
│                                             │
│                 [ SCREEN ]                  │
│                                             │
├─────────────────────────────────────────────┤
│  Today    Rhythm    ◉ Pulse   Circle  You   │
└─────────────────────────────────────────────┘
```

- **Today** — the adaptive daily schedule + check-ins. Default landing.
- **Rhythm** — your patterns over time: energy curve, sleep, mood, streaks of *consistency* (not perfection). The "data that feels like a story" tab.
- **◉ Pulse** *(center)* — the AI companion. Talk to it, get your daily summary, ask "when should I…?" Ambient pulsing icon.
- **Circle** — friends, compatibility, shared reports. The social/viral layer (opt-in, private by default).
- **You** — archetype profile, evolution history, settings, premium.

---

## 5. Home / Dashboard ("Today")

The Today screen is a **single scrollable flow**, not a grid of widgets. It reads top-to-bottom like a calm narrative of your day.

**1. The pulse header (top)**
A living gradient that reflects your *current* predicted state. Morning = warm rising tones, mid-afternoon crash window = cooler/dimmer, evening wind-down = deep dusk. One line of dynamic copy:
> *"Good morning. Your focus should be sharp until about 1pm — let's use it."*

**2. The rhythm ribbon**
A horizontal energy curve for today (predicted), with your current position marked by a moving dot. Tap any point → "what to do here." This is the signature visual.

**3. Now card**
The single most relevant action for this moment. Just one. ("Deep work window open — 90 min. Want me to silence Circle and start a focus timer?")

**4. Today's flow**
3–5 time-anchored suggestions, draggable, dismissible:
- *9:30 — Hardest task here. You're sharpest now.*
- *2:00 — Crash incoming. Walk + water, not coffee.*
- *6:30 — Hard convos land better now than at night.*
- *10:00 — Wind-down. Screens down, [soundscape] on.*

**5. Check-in nudge**
A soft, optional one-tap mood/energy capture (emoji-scale + optional voice note). Feeds the model. Never guilt-trips if skipped.

**6. Tonight**
A forward-looking sleep/recovery card based on the day's load. ("Heavy day. Aim for lights-out by 11 — I'll remind you at 10:30.")

Design law: **no empty states, no red, no streak-shaming, never more than one primary action visible at once.**

---

## 6. AI Interaction Examples

The AI (call it **Pulse**) is the product's soul. It's proactive but never naggy, specific, and it references *real* data. It earns trust by being right and by knowing when to shut up.

**Daily summary (morning):**
> Morning. You slept 6h10 — third short night this week. That usually means your 2pm crash hits earlier and harder for you. I moved your deep-focus block to 9:30 and kept the afternoon light. Don't schedule anything that needs willpower after 3.

**Asking it something:**
> **You:** when should I work out today?
> **Pulse:** Not this morning — your body's still catching up on sleep. Late afternoon, around 5, your energy lifts and movement will actually help you sleep tonight. Skip it entirely if today felt like too much; that's a valid answer too.

**Burnout warning (the high-value moment):**
> I want to flag something. Your sleep is down, your check-ins have trended low for 5 days, and you've packed every afternoon. As a Bear, that's exactly the pattern that precedes your crashes. Not a lecture — just: can we protect one afternoon this week? I'll help you find which one.

**Schedule mismatch insight:**
> You scheduled your biggest meeting at 8am. You're a Wolf — your brain doesn't really come online till 11. If you can't move it, give yourself a slow win first: don't make 8am the day's first hard thing.

**Emotional check-in (low day):**
> You marked today a 2. I'm not going to fix that with a tip. Want a 4-minute thing that usually helps your nervous system specifically, or do you just want the day to be lighter? Either's fine.

**Voice/tone constraints for the AI:**
- Max ~3 sentences unless asked for more.
- Always one concrete, doable thing.
- Names the *pattern* it saw (proof it's paying attention).
- Offers an out. Never moralizes about rest, food, or productivity.

---

## 7. Notifications

Notifications are tuned to the user's archetype and timed to their predicted state — a Wolf gets nothing at 8am; a Fox gets a "permission to stop" ping in the evening. They sound like a person, not a system.

- *(Dolphin, 1:45pm)* "Crash window in 15. Water + 5 min off the screen now = no 4pm spiral. Trust me on this one."
- *(Wolf, 11pm)* "You're in your good hours. One creative thing, then a real stop time — set it now so future-you isn't wrecked tomorrow."
- *(Fox, 9pm)* "Everything that needs you today, you did. You're allowed to stop scanning. Wind-down soundscape's ready."
- *(Bear, Monday AM)* "Light week ahead, but I see two heavy afternoons. Want me to space them out before they stack into a crash?"
- **Weekly drop (Sunday):** "Your week in rhythm is ready 🌙 — your best focus day might surprise you." → opens shareable report.
- **Re-engagement (gentle, after 3 days away):** "No pressure. Your rhythm's still here when you want it. Quick check-in?"

Rules: never more than ~2/day default. Never red badges. Never "You broke your streak!" Every notification is timed to a *state*, not a clock.

---

## 8. Viral & Social Features

- **The reveal share card** — auto-generated, gorgeous, animated archetype card built for Stories/TikTok. "I'm a Dolphin 🐬 — what's your rhythm animal?" with a link. This is the primary growth loop.
- **Weekly Rhythm Report** — Wrapped-style, swipeable, screenshot-bait. "Your sharpest day was Tuesday. You crashed every day at 2:14pm (eerily consistent). Your mood lifted whenever you moved before noon."
- **Compatibility** — invite a friend/partner, see how your rhythms interact, get real co-scheduling advice. ("Plan trips around the Bear, not the Wolf.")
- **Circle** — small private groups (couples, roommates, teams) sharing energy states so people stop scheduling 8am calls for night owls.
- **Evolution moments** — when your archetype shifts, you get a shareable "I evolved" card. Built-in re-share trigger every few weeks.
- **Burnout-saved moments** — when the app flags a crash before it happens and you avoid it, it celebrates quietly and offers a share ("Caught a crash before it caught me").

---

## 9. Retention Mechanics

The trap is making this feel like another streak app. Circadia retains through *self-knowledge compounding*, not guilt.

- **Daily check-in** — 5-second, one-tap, builds the data that makes everything more accurate. Framed as "teaching your rhythm," not a chore.
- **Consistency, not streaks** — track "rhythm consistency %" that's forgiving (missing a day barely dents it). No streak-shame, ever.
- **The weekly reveal** — a recurring Wrapped-style dopamine hit every Sunday. The single strongest retention driver.
- **Evolving archetype** — your animal changing over time gives a long-term reason to keep feeding data. Collectible sub-types.
- **Accuracy flywheel** — the longer you use it, the scarier-accurate the predictions get. Users stay because *it knows them* and starting over elsewhere means losing that.
- **Forward hooks** — every screen ends with a reason to come back ("Tonight's sleep target set — check in tomorrow to see if you hit your morning peak").
- **Win-back** — gentle, archetype-aware re-engagement; never desperate.

---

## 10. Monetization

**Model: freemium subscription + a generous, genuinely useful free tier.** The free tier must be good enough to share; paid is for depth and automation.

### Free
- Quiz + archetype + reveal share card
- Basic daily flow (3 suggestions/day)
- Daily check-in + basic weekly report
- Limited Pulse AI (a few exchanges/day)

### Circadia+ — ~$9.99/mo or $59.99/yr
- Unlimited Pulse AI + proactive coaching
- Full adaptive scheduling + Calendar/Health/Sleep sync
- Evolving archetypes, sub-types, deep pattern history
- Full Wrapped-style weekly + monthly + yearly reports
- Burnout prediction + recovery plans
- Compatibility & Circle (advanced)
- Soundscapes library

### Add-on / future revenue
- **Soundscapes & sleep audio** — premium pack or licensed artist drops.
- **Circle for Teams / Couples** — small B2B and relationship tier.
- **Annual "Rhythm Year in Review"** — a paid, premium Wrapped-style artifact (also a huge viral/acquisition moment).
- **Partnerships** — non-clinical wellness brands (mattresses, supplements, light therapy) via *contextual, opt-in* suggestions only — never ads that break the calm.

Pricing psychology: anchor on the yearly (≈ 50% off monthly), free trial of Circadia+ unlocked *right after the reveal* when motivation peaks.

---

## 11. Premium Features (the "worth paying for" list)

- **Proactive AI coaching** — Pulse reaches out before problems, not after.
- **Auto-scheduling** — reads your calendar and *rearranges* tasks into your real energy windows (with approval).
- **Burnout radar** — multi-signal early warning + a concrete recovery plan.
- **Deep rhythm analytics** — energy/mood/sleep correlations, "your 2pm crash is worst on days you skip breakfast"-type insights.
- **Evolution tracking** — full archetype history and sub-type collection.
- **Adaptive soundscapes** — audio that matches your *current* predicted state (focus / crash / wind-down).
- **Yearly Rhythm Wrapped** — the premium annual artifact.
- **Circle Pro** — shared rhythms for couples/teams with co-scheduling.

---

## 12. Visual Branding & UI/UX System

### Brand feeling
Calm, alive, intelligent. Like bioluminescence in dark water. Premium without being cold. Nature-adjacent without being granola.

### Color
- **Base:** deep dusk navy / near-black (`#0E1424` ish) — the canvas. Dark-first.
- **Living gradients:** aurora-like blends that shift by time-of-day and state — teal→violet (focus), coral→amber (morning), indigo→deep blue (wind-down). The gradient is the brand.
- **Accent:** a single luminous teal/aqua for the pulse and primary actions.
- Each archetype has its own gradient signature (Dolphin = cool teal-silver, Wolf = violet-midnight, Bear = warm amber-earth, etc.).

### Type
- Clean, modern, slightly warm sans (e.g., a humanist grotesque). Large, confident headers; generous line-height; never cramped. Type carries the calm.

### Motion (this is core, not decoration)
- **Pulse animation** — a soft, breathing pulse (≈ resting heart/breath rate) on the AI and key elements. Subtle. Never distracting.
- **Ambient gradient drift** — backgrounds slowly move, like water.
- **Haptics** — gentle on every key interaction (check-in, reveal, suggestion accept).
- **Reveal** — the archetype card "breathes" to life; the single most polished animation in the app.

### Material
- Soft glassmorphism for cards (frosted, low-contrast borders, faint inner glow).
- Lots of negative space. One focal point per screen.
- Rounded, organic shapes — nothing sharp or clinical.

### Illustration
- Stylized, semi-abstract animals made of flowing light/particles — *not* cute cartoon mascots, *not* realistic. Think "constellation/aurora animal." This keeps it shareable and premium for adults.

### UX laws
1. One primary action per screen.
2. No red, no shame, no empty states.
3. Always show *why* (the pattern behind every suggestion).
4. Calm by default — animation supports, never competes.
5. The reveal and the weekly report get the most design love (they drive growth).

---

## 13. TikTok / Viral Hooks

The growth engine is identity + "it's so accurate it's scary." Lean into POV, reveal, and duet formats.

**Hook formats:**
- "POV: an app figured out you're a Dolphin and now your whole day makes sense 🐬"
- "Tell me your rhythm animal without telling me your rhythm animal." (comment-bait)
- "It said I crash at 2:14pm every day. I checked my screen time. It was right." (the accuracy flex)
- "This app read me harder than my therapist and I've never recovered."
- "Which rhythm animal are you? (the Octopus ones are NOT okay 🐙)" — playful archetype rivalry.
- "Things only Wolves will understand 🐺" — archetype-as-community content.
- Couple/duet: "We took the rhythm test and now we know why we fight at night." (compatibility angle)
- Reveal-reaction trend: people filming their reaction to the reveal screen.

**Mechanics:**
- Every reveal/report card is a *built-for-vertical-video* asset with a clean link/CTA.
- Seed archetype "rivalries" (Wolves vs Bears) — tribes drive comments and shares.
- Micro-creator seeding over big influencers: real, "this is eerily me" reactions convert better than ads.
- The accuracy angle is the moat — concrete, true-feeling specifics ("2:14pm") outperform vibes.

---

## 14. App Store Positioning

**Name:** Circadia
**Subtitle:** Your rhythm, decoded by AI
**Category:** Health & Fitness (primary), Lifestyle (secondary)

**Short pitch (top of listing):**
> Circadia learns your energy, stress, and sleep patterns and rebuilds your day around them. Take the 60-second quiz, meet your rhythm animal, and let AI guide when to focus, recover, and rest — personalized to your nervous system.

**Screenshot order (the listing is a funnel):**
1. The reveal card — "Meet your rhythm animal" (the hook).
2. The Today screen with the energy ribbon — "Your day, tuned to you."
3. A Pulse AI conversation — "AI that actually knows you."
4. The weekly Wrapped report — "Your week in rhythm."
5. Burnout radar — "It warns you before you crash."
6. Compatibility — "See how your rhythms fit."

**Keywords:** rhythm, energy, circadian, nervous system, AI wellness, mood tracker, sleep, focus, personality, archetype, burnout.

**ASO note:** the quiz/archetype angle drives the install (curiosity); the AI/scheduling angle drives the rating and retention. Lead with curiosity, back it with depth.

---

## 15. Launch Strategy

**Phase 0 — Pre-launch (waitlist + curiosity)**
- Standalone web version of the quiz: "What's your rhythm animal?" → result + "the full app is coming, join the list." Pure top-of-funnel virality before the app exists.
- Seed the six archetypes as content. Build the tribes early.

**Phase 1 — Closed beta**
- Small invite group; obsess over prediction accuracy and the reveal/report polish. These two features are the whole growth loop — they must be flawless before scale.

**Phase 2 — TikTok-first public launch**
- 50–100 micro-creators across wellness/productivity/"that girl"/ADHD/night-owl niches do genuine reveal-reaction content. No scripts — authentic "this is scary accurate" beats polished ads.
- Launch the share-card loop: every reveal is a recruitment ad.

**Phase 3 — Wrapped moment**
- Time a big "Rhythm Report" push (weekly at first, then a seasonal/yearly artifact) as a recurring viral spike, à la Spotify Wrapped.

**Phase 4 — Compatibility / Circle expansion**
- Push the couples/friends angle to turn single users into invite engines.

**North-star metric:** % of new users who share their reveal card. That single number predicts whether the loop compounds.

---

## 16. Feature Roadmap

**V1 (Launch) — "Know your rhythm"**
- Quiz → archetype reveal → share card
- Adaptive Today screen + energy ribbon
- Daily check-ins
- Basic Pulse AI + daily summaries
- Weekly Rhythm Report (Wrapped-style)
- Freemium + Circadia+ trial

**V2 — "It knows you" (depth)**
- Calendar / Health / Sleep sync → real-data predictions
- Burnout radar + recovery plans
- Auto-scheduling (rearrange tasks into energy windows)
- Adaptive soundscapes
- Evolving archetypes + sub-types

**V3 — "Together" (social)**
- Compatibility + Circle (couples/friends/teams)
- Shared rhythms & co-scheduling
- Evolution share moments
- Yearly Rhythm Wrapped

**V4 — "Ecosystem" (platform)**
- Wearable deep integration (HRV, real circadian signals)
- Voice-first Pulse companion
- Circle for Teams (B2B)
- Optional clinician/coach export (opt-in)
- Open API / partner integrations

---

## 17. Why This Wins

1. **Identity is the hook, utility is the moat.** The animal gets people in the door (TikTok-quiz energy); the adaptive scheduling and accurate predictions keep them (Apple Health depth). Most apps have one or the other.
2. **The accuracy flywheel is defensible.** The longer you use it, the better it knows you — and switching means starting over. That's real retention, not gamified guilt.
3. **Two built-in viral loops:** the reveal card (acquisition) and the weekly Wrapped report (recurring re-share). Growth is structural, not paid.
4. **It fills a genuine gap:** between vague wellness apps and rigid productivity apps, nobody owns "work *with* your nervous system." Circadia owns that sentence.
5. **The tone is the differentiator.** Calm, specific, a little mysterious, never cringe — in a category drowning in fake-deep wellness-speak, sounding like a smart, perceptive friend is a competitive advantage.

---

*Next steps when you're ready: pick a build path (native iOS / React Native / web prototype), and I can scaffold the onboarding quiz + archetype-scoring logic + reveal screen as a working prototype.*
