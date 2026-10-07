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
4. **Honest about uncertainty.** Experiments, Resonance and Good Days are framed as observations, never causes or diagnoses — safer for store review and more trustworthy.

## New in this release

| Feature | What it does | Why it's different |
|---|---|---|
| **Next-shift forecast** (Today) | Shows what's coming in your flow and when — "UP NEXT · 10:00 · in 6h 1m", or a `NEXT ·` line under the current block. Refreshes every minute and handles flows that run past midnight. | Rise forecasts from sleep alone; Circadia forecasts from your rhythm profile. You see the dip coming instead of noticing it afterwards. |
| **State-matched 60-second reset** | A breathing pacer chosen by your check-in: *wired → long exhale*, *flat → brightening breath*, *steady → box breath*. Offered right after a Wired/Flat check-in and from Today. | Calm/Headspace sessions are generic; How We Feel's strategies aren't tied to your signal. This one meets the state you just logged. |
| **Experiment results** | Experiments now close themselves after their run and show a before/during comparison of your check-ins plus the most-tagged reason. | Daylio and Bearable show correlations; Circadia runs a small personal test and reports back, without claiming cause. |
| **Export my data (free)** | One tap exports every check-in as CSV — downloaded on web, shared on native. Cells are escaped so the file is safe to open in a spreadsheet. | Bearable charges for advanced export. Owning your data is part of the privacy promise. |
| **Returning-user restore** | Your rhythm profile is saved on-device; reopening the app goes straight to Today. | Table stakes, but the app didn't do it before: every relaunch went back to the quiz. |

## Next opportunities (not built yet)

- **Apple Health / Health Connect sleep import** to sharpen the forecast (Rise's main moat).
- **Circle compatibility**: shared "best time to talk" windows for two rhythm animals (CIRCADIA.md §8).
- **Home-screen widget** showing the next shift countdown.
- **Weekly Rhythm Wrapped** shareable card built from `weeklyReport`.
