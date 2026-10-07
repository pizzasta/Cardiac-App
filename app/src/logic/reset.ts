// Reset — a one-minute, state-matched breathing pacer.
//
// The check-in tells us which way the signal is off, so the reset picks a
// pattern for that direction instead of one generic "breathe" exercise:
// wired → longer exhales to help it land, flat → an even, brightening rhythm,
// steady → box breathing to hold the line. Framed as a pause, never treatment.
import { Level } from './pulselog';

export type PhaseKind = 'in' | 'hold' | 'out';

export interface BreathPhase {
  kind: PhaseKind;
  secs: number;
}

export interface ResetPattern {
  id: 'long-exhale' | 'brighten' | 'box';
  title: string;
  why: string;
  phases: BreathPhase[];
  rounds: number;
}

export const RESETS: Record<Level, ResetPattern> = {
  wired: {
    id: 'long-exhale',
    title: 'Long exhale',
    why: 'Running hot. Making the out-breath longer than the in-breath is a simple way to give that energy somewhere to land.',
    phases: [
      { kind: 'in', secs: 4 },
      { kind: 'out', secs: 6 },
    ],
    rounds: 6,
  },
  flat: {
    id: 'brighten',
    title: 'Brightening breath',
    why: 'Running low. An even, slightly fuller rhythm with a short pause up top can feel like turning the lights back on.',
    phases: [
      { kind: 'in', secs: 4 },
      { kind: 'hold', secs: 2 },
      { kind: 'out', secs: 4 },
    ],
    rounds: 6,
  },
  steady: {
    id: 'box',
    title: 'Box breath',
    why: 'Already steady. Four even sides — a minute to lock in the state before the next thing.',
    phases: [
      { kind: 'in', secs: 4 },
      { kind: 'hold', secs: 4 },
      { kind: 'out', secs: 4 },
      { kind: 'hold', secs: 4 },
    ],
    rounds: 4,
  },
};

export const PHASE_LABEL: Record<PhaseKind, string> = {
  in: 'Breathe in',
  hold: 'Hold',
  out: 'Breathe out',
};

export function resetFor(level: Level | null | undefined): ResetPattern {
  return RESETS[level ?? 'steady'] ?? RESETS.steady;
}

export function roundSecs(p: ResetPattern): number {
  return p.phases.reduce((sum, ph) => sum + ph.secs, 0);
}

export function totalSecs(p: ResetPattern): number {
  return roundSecs(p) * p.rounds;
}

export interface PhaseState {
  done: boolean;
  round: number; // 1-based
  phase: BreathPhase;
  // 0–1 progress through the current phase.
  progress: number;
  secsLeft: number; // whole seconds left in the current phase (≥1 while running)
}

// Where the pacer is after `elapsed` seconds.
export function phaseAt(p: ResetPattern, elapsed: number): PhaseState {
  const last = p.phases[p.phases.length - 1];
  const total = totalSecs(p);
  if (elapsed >= total) {
    return { done: true, round: p.rounds, phase: last, progress: 1, secsLeft: 0 };
  }

  const t = Math.max(0, elapsed);
  const per = roundSecs(p);
  const round = Math.floor(t / per) + 1;
  let within = t % per;
  for (const phase of p.phases) {
    if (within < phase.secs) {
      return {
        done: false,
        round,
        phase,
        progress: within / phase.secs,
        secsLeft: Math.ceil(phase.secs - within),
      };
    }
    within -= phase.secs;
  }
  return { done: false, round, phase: last, progress: 1, secsLeft: 0 };
}

// Orb scale for the current phase: grows on the in-breath, shrinks on the out,
// rests where it is on a hold (full after an in, small after an out).
export function orbScale(p: ResetPattern, state: PhaseState, min = 0.55, max = 1): number {
  const span = max - min;
  if (state.phase.kind === 'in') return min + span * state.progress;
  if (state.phase.kind === 'out') return max - span * state.progress;
  const idx = p.phases.indexOf(state.phase);
  const prev = p.phases[(idx - 1 + p.phases.length) % p.phases.length];
  return prev.kind === 'in' ? max : min;
}
