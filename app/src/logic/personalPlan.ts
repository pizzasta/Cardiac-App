// Personal plan — the animal's daily flow, re-timed from the person's own
// answers. The quiz asks when they focus best and when they dip; the plan
// should use those times, not the archetype's defaults.
import { FlowItem } from '../data/plans';
import { effectiveFlowMinutes } from './forecast';
import { RhythmResult } from './score';

// Quiz answer (tag value) → minutes after midnight.
const PEAK_AT: Record<string, number> = {
  'early morning': 8 * 60 + 30,
  midday: 12 * 60,
  'late afternoon': 16 * 60,
  'late night': 21 * 60,
};
const DIP_AT: Record<string, number> = {
  'mid-morning': 10 * 60 + 30,
  '2–4pm': 14 * 60 + 30,
  'the evening': 18 * 60 + 30,
};

// Keep a re-timed step at least this far from its neighbours and from the
// last step of the day (wind-down), so the flow still reads as a day.
const MIN_GAP = 45;

function label(mins: number): string {
  const m = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60) % 12 || 12;
  return `${h}:${String(m % 60).padStart(2, '0')}`;
}

export function personalFlow(flow: FlowItem[], result: Pick<RhythmResult, 'peak' | 'crash'>): FlowItem[] {
  if (flow.length < 2) return flow;
  const times = effectiveFlowMinutes(flow);
  const items = flow.map((item, i) => ({ item: { ...item }, at: times[i] }));
  const windDown = items[items.length - 1].at;

  const retime = (kind: 'focus' | 'dip', at: number | undefined) => {
    if (at == null) return;
    const target = items.find((x) => x.item.kind === kind);
    if (!target || target.at === at) return;
    if (at > windDown - MIN_GAP) return; // never after the wind-down
    const clashes = items.filter((x) => x !== target && Math.abs(x.at - at) < MIN_GAP);
    const last = items[items.length - 1];
    if (clashes.length > 1) return;
    if (clashes.length === 1) {
      // A plain step sits at that time: trade places with it. Never move the
      // wind-down or the other personal (focus/dip) step.
      const other = clashes[0];
      if (other === last || other.item.kind) return;
      other.at = target.at;
    }
    target.at = at;
    target.item.personal = true;
    // The template note talks about the archetype's usual time, so swap it.
    target.item.note =
      kind === 'focus'
        ? `You said you focus best in the ${result.peak}. Give this block to the thing that needs real thinking.`
        : `You said your energy tends to dip around ${result.crash}. Try water and a few minutes off-screen before deciding what you need.`;
  };
  retime('focus', PEAK_AT[result.peak]);
  retime('dip', DIP_AT[result.crash]);

  return items
    .sort((a, b) => a.at - b.at)
    .map(({ item, at }) => ({ ...item, time: label(at) }));
}
