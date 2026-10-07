# Circadia — competitive review

How Circadia compares to the apps people already use for energy, mood and sleep, and the features built to set it apart.

## The landscape

| App | What it does well | The gap Circadia fills |
|---|---|---|
| **Rise Science** | Sleep-debt tracking and a daily energy chart with sleep coaching; best with a wearable. | Sleep-only lens. No sense of *how* you break under load (scatter, freeze, mask, crash) or what to do in the moment. |
| **Bearable** | Highly customizable symptom/mood tracking with correlation views and CSV export. | Built for symptom logging and power users; the most useful analysis (correlations, advanced export) is behind the paywall. Heavy to log. |
| **Daylio** | Very fast mood logging, activity tags, streaks and charts. | Tracks but never acts — you see patterns, then go back to a day planned without them. Streaks punish missed days. |
| **How We Feel** | Emotion naming and in-the-moment regulation strategies. | Strategies aren't tied to *when* in your day you're likely to need them. |
| **Calm / Headspace** | Polished guided breathing and meditation content. | Generic sessions; they don't know whether you're wired or flat right now. |
| **Finch** | Warm, gamified self-care habit loop. | Habit-first; it doesn't adapt your schedule to your energy. |

## Where Circadia wins

1. **Identity first, tracking second.** A 60-second quiz gives you a rhythm animal and a usable daily flow *before* any logging. Competitors start empty.
2. **It acts on the data.** The Today dashboard turns your profile into a timed flow, and check-ins adjust nudge timing (`suggestCheckInTime`).
3. **Forgiving consistency, not streak-shaming.** Weekly consistency % and a grace day mean one missed day never resets you to zero.
4. **Honest about uncertainty.** Experiments, Days like today and Good Days are framed as observations, never causes or diagnoses — safer for store review and more trustworthy.

## New in this release

| Feature | What it does | Why it's different |
|---|---|---|
| **What’s next** (Today) | Shows what's coming in your flow and when — "UP NEXT · 10:00 · in 6h 1m", or a `NEXT ·` line under the current block. Refreshes every minute and handles flows that run past midnight. | Rise forecasts from sleep alone; Circadia forecasts from your rhythm profile. You see the dip coming instead of noticing it afterwards. |
| **1-minute reset** | A breathing pacer chosen by your check-in: *wired → long exhale*, *flat → brightening breath*, *steady → box breath*. Offered right after a Wired/Flat check-in and from Today. | Calm/Headspace sessions are generic; How We Feel's strategies aren't tied to your signal. This one meets the state you just logged. |
| **Experiment results** | Experiments now close themselves after their run and show a before/during comparison of your check-ins plus the most-tagged reason. | Daylio and Bearable show correlations; Circadia runs a small personal test and reports back, without claiming cause. |
| **Export my data (free)** | One tap exports every check-in as CSV — downloaded on web, shared on native. Cells are escaped so the file is safe to open in a spreadsheet. | Bearable charges for advanced export. Owning your data is part of the privacy promise. |
| **Days like today** | After a check-in: "3 similar days found", what those days had in common ("Sleep was selected on 2 of the 3"), and **what came next** ("Your next recorded check-in was Steady on 2 of those 3 occasions"). Always shows: *This describes your previous Circadia entries. It doesn't predict what will happen today.* Also on Trends with a small map of your recent check-ins. | No competitor answers "when have I felt like this before?" from your own history. Grounded in logged data, so it demos well in review without overclaiming. |
| **Returning-user restore** | Your rhythm profile is saved on-device; reopening the app goes straight to Today. | Table stakes, but the app didn't do it before: every relaunch went back to the quiz. |

## Naming: plain words over coined names

Similar apps use everyday labels: Daylio has *entries* and *stats*, Bearable has *insights*, How We Feel and Apple Health use *check-in*. Circadia had several invented names (Pulse, Daily Pulse, Signal, Signal Card, Resonance, "Follow the Thread", "Discovery unlocked"), and one of them (Pulse) meant two different things: the AI and the check-in. User-facing copy now uses:

| Was | Now |
|---|---|
| Daily Pulse / "Where's your signal?" / Log my signal | Check-in / "How's your energy?" / Save check-in |
| Pulse (AI companion), Talk to Pulse, Ask Pulse | Ask Circadia, Ask a question, Ask about this |
| Your Signal | Your trends |
| Resonance / See what shifted / Follow the Thread | Days like today / What came next / Ask about these days |
| Discovery unlocked | A pattern is showing |
| Signal Card | Rhythm card |
| "How's your signal?" notification | "Quick check-in?" |

The **rhythm animal** stays: it's the hook, and the one name people should remember. The AI is still clearly disclosed as AI-generated in the Legal screen; it's just no longer a character. Code identifiers (`PulseScreen`, `pulselog`) are unchanged to keep the diff focused.

Landing copy that over-promised was also rewritten: "An AI that actually knows you", "you crash at 2:14pm", "It catches the dip before you do", and a sample answer about sleep debt the app can't measure.

## Idea review: what to build next and what to skip

| Idea | Verdict | Why |
|---|---|---|
| Find days like today ("Pulse Echo") | **Built** as *Days like today* | Already half-existed as Resonance; rebuilt with plain wording and moved to the moment it matters (right after a check-in). |
| Explorable history ("Rhythm Constellation") | **Next**, as an upgrade to the existing map | A 2D map already exists in Days like today. Next step: tap a dot to see that day, with clusters of similar days. Do it in 2D SVG first; 3D adds weight and GPU risk on low-end Android without making it easier to read. |
| Environment evolves from your data ("Rhythm World") | **Later, small** | Let the existing rainforest scene's calm/movement reflect the past week's consistency. Keep it ambient, with a one-line caption, so it never reads as health status. |
| Two versions of tomorrow ("Parallel Day") | **Fold into Experiments** | Overlaps with experiments plus results. Add a 1-day "Try one change tomorrow" experiment instead of a second simulator concept. |
| Camera AR overlay ("Rhythm Lens") | **Skip** | Adds a camera permission and privacy questions in review, plus performance cost, and invites the "is it scanning me?" confusion we're avoiding. Low daily value. |

## Next opportunities (not built yet)

- **Apple Health / Health Connect sleep import** to sharpen the forecast (Rise's main moat).
- **Circle compatibility**: shared "best time to talk" windows for two rhythm animals (CIRCADIA.md §8).
- **Home-screen widget** showing the next shift countdown.
- **Weekly Rhythm Wrapped** shareable card built from `weeklyReport`.
