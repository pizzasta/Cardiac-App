import { AnimalId } from './archetypes';

// The "detailed plan" unlocked by signing in — a deeper, weekly-grain layer
// beyond the daily flow.

export const DEEP_DIVE: Record<AnimalId, string[]> = {
  dolphin: [
    'Weekly: schedule your two hardest projects on back-to-back mornings, then a deliberately light afternoon after each.',
    'Caffeine cutoff by 1pm — as a light sleeper it lingers and steepens tonight’s fall-asleep time.',
    'Build a 20-minute “sensory offload” into the day (walk, no audio) — your nervous system needs the input to drop, not just the task.',
    'Track which afternoons you crashed hardest; you’ll usually find a too-busy morning the day before.',
  ],
  wolf: [
    'Protect a 3-hour uninterrupted evening block 3+ nights a week — that’s where your best work actually happens.',
    'Anchor wake time even after late nights; let bedtime drift, not the alarm, to keep the rhythm from sliding later each week.',
    'Front-load all shallow work (email, calls) into the late morning so the night is free for deep focus.',
    'Set a hard “last screen” alarm — the burst ends cleaner with an external cutoff than willpower.',
  ],
  bear: [
    'Map your week for the two heaviest days and put a genuinely light day between them — the crash comes from stacking, not single days.',
    'Schedule recovery like a meeting; unprotected rest gets eaten and your decline is invisible until it isn’t.',
    'Keep one fixed, boring weekend anchor (same wake, same walk) so the rhythm doesn’t reset every Monday.',
    'Watch your “I’m fine” streaks — for you that phrase often precedes the slow-build crash by about a week.',
  ],
  hummingbird: [
    'Cap open projects at three. A written “not now” list is how you stop fast turning into frozen.',
    'Use 25/5 focus cycles; the short timer is permission to single-task without your brain protesting.',
    'Do a 5-minute morning triage: one must-do, two nice-to-dos, everything else parked.',
    'Notice the scatter→freeze tipping point; when you feel it, shrink the task, don’t add structure.',
  ],
  fox: [
    'Block your first 90 minutes as no-meeting deep work — that’s your sharpest, least-scanned window.',
    'Schedule a daily “planning close”: 15 minutes to set tomorrow, then a rule that the plan is done being re-checked.',
    'Put movement at ~5pm to physically discharge the alertness before it follows you to bed.',
    'Give yourself an explicit end-of-day signal (a phrase, a walk) — your off-switch is a ritual, not a feeling.',
  ],
  octopus: [
    'Bookend social blocks with solo recovery time — never schedule people back-to-back-to-back.',
    'Run a midday energy check (1–5). Acting on a 2 early is how you avoid the all-at-once empty.',
    'Pick one low-demand day a week with minimal emotional labor scheduled on purpose.',
    'After heavy interactions, do a 10-minute “unload” (note or walk) so you’re not carrying others’ moods to bed.',
  ],
};
