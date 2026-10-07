// Forecast — where you are in today's flow, and what's coming next.
//
// Pure, UI-free time math over an archetype's authored flow (data/plans.ts).
// Most flow labels omit AM/PM, so they're resolved into an increasing timeline
// before comparing against the clock.
import { FlowItem } from '../data/plans';

const DAY = 24 * 60;
// Before this hour, a flow that runs past midnight is still "tonight".
const LATE_NIGHT_CUTOFF = 4 * 60;

export function parseFlowTime(label: string): { mins: number; explicitMeridiem: boolean } {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(label.trim());
  if (!match) return { mins: -1, explicitMeridiem: false };

  let hour = parseInt(match[1], 10) % 12;
  const minute = parseInt(match[2], 10);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === 'PM') hour += 12;

  return { mins: hour * 60 + minute, explicitMeridiem: !!meridiem };
}

// The flow is authored in chronological order, while many labels omit AM/PM.
// Convert those labels into an increasing timeline so 1:45 after 9:30 becomes
// 13:45, and a final 12:00 after 9:00 can represent midnight (1440).
export function effectiveFlowMinutes(flow: FlowItem[]): number[] {
  const out: number[] = [];
  let previous = -1;

  for (const item of flow) {
    const parsed = parseFlowTime(item.time);
    if (parsed.mins < 0) {
      out.push(previous);
      continue;
    }

    let value = parsed.mins;
    if (!parsed.explicitMeridiem) {
      while (value <= previous) value += 12 * 60;
    }

    out.push(value);
    previous = value;
  }

  return out;
}

// Minutes since midnight, shifted past 24h when the flow wraps midnight and
// it's still the small hours (so 00:30 sits after a 23:00 item, not before).
function nowOnTimeline(timeline: number[], now: Date): number {
  const mins = now.getHours() * 60 + now.getMinutes();
  const wraps = timeline.some((value) => value >= DAY);
  return wraps && mins < LATE_NIGHT_CUTOFF ? mins + DAY : mins;
}

// The flow item whose time has most recently passed = where you are 'now'.
// Before the first daytime item we intentionally fall back to item 0.
export function currentFlowIndex(flow: FlowItem[], now = new Date()): number {
  if (flow.length === 0) return -1;

  const timeline = effectiveFlowMinutes(flow);
  const nowMinutes = nowOnTimeline(timeline, now);

  let idx = 0;
  for (let i = 0; i < timeline.length; i++) {
    if (timeline[i] >= 0 && timeline[i] <= nowMinutes) idx = i;
  }
  return idx;
}

export interface NextShift {
  index: number;
  item: FlowItem;
  minutesUntil: number;
  // True when the next shift is tomorrow's first item.
  tomorrow: boolean;
}

// The next flow item still ahead of `now`, rolling over to tomorrow's first
// item once the day's flow is done.
export function nextShift(flow: FlowItem[], now = new Date()): NextShift | null {
  const timeline = effectiveFlowMinutes(flow);
  const valid = timeline.map((t, i) => ({ t, i })).filter(({ t }) => t >= 0);
  if (!valid.length) return null;

  const nowMinutes = nowOnTimeline(timeline, now);
  const ahead = valid.find(({ t }) => t > nowMinutes);
  if (ahead) {
    return { index: ahead.i, item: flow[ahead.i], minutesUntil: ahead.t - nowMinutes, tomorrow: false };
  }

  const first = valid[0];
  const sinceMidnight = now.getHours() * 60 + now.getMinutes();
  return {
    index: first.i,
    item: flow[first.i],
    minutesUntil: (((first.t - sinceMidnight) % DAY) + DAY) % DAY,
    tomorrow: true,
  };
}

// "in 45 min", "in 1h 20m", "in 3h".
export function formatCountdown(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 1) return 'now';
  if (m < 60) return `in ${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `in ${h}h ${rest}m` : `in ${h}h`;
}
