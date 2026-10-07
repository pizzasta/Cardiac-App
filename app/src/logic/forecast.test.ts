import { PLANS } from '../data/plans';
import { currentFlowIndex, effectiveFlowMinutes, formatCountdown, nextShift } from './forecast';

// Local-time constructor so tests are timezone-independent.
const at = (h: number, m = 0) => new Date(2026, 9, 7, h, m);

describe('effectiveFlowMinutes', () => {
  it('resolves AM/PM-less labels into an increasing timeline', () => {
    expect(effectiveFlowMinutes(PLANS.dolphin.flow)).toEqual([570, 825, 960, 1290]);
  });

  it('lets a late flow wrap to midnight', () => {
    expect(effectiveFlowMinutes(PLANS.wolf.flow)).toEqual([660, 900, 1260, 1440]);
  });
});

describe('currentFlowIndex', () => {
  it('picks the most recently passed item', () => {
    expect(currentFlowIndex(PLANS.dolphin.flow, at(14, 0))).toBe(1);
  });

  it('falls back to the first item before the day starts', () => {
    expect(currentFlowIndex(PLANS.dolphin.flow, at(7, 0))).toBe(0);
  });

  it('keeps a past-midnight item current in the small hours', () => {
    expect(currentFlowIndex(PLANS.wolf.flow, at(0, 30))).toBe(3);
  });
});

describe('nextShift', () => {
  it('counts down to the next item today', () => {
    const next = nextShift(PLANS.dolphin.flow, at(13, 0));
    expect(next?.item.title).toBe(PLANS.dolphin.flow[1].title);
    expect(next?.minutesUntil).toBe(45);
    expect(next?.tomorrow).toBe(false);
  });

  it('rolls over to tomorrow after the last item', () => {
    const next = nextShift(PLANS.dolphin.flow, at(23, 30));
    expect(next?.index).toBe(0);
    expect(next?.tomorrow).toBe(true);
    expect(next?.minutesUntil).toBe(600);
  });

  it('does not add an extra day after a midnight-wrapping flow', () => {
    const next = nextShift(PLANS.wolf.flow, at(2, 0));
    expect(next?.index).toBe(0);
    expect(next?.minutesUntil).toBe(540);
  });

  it('handles an empty flow', () => {
    expect(nextShift([], at(12))).toBeNull();
  });
});

describe('formatCountdown', () => {
  it('formats minutes and hours', () => {
    expect(formatCountdown(0)).toBe('now');
    expect(formatCountdown(45)).toBe('in 45 min');
    expect(formatCountdown(80)).toBe('in 1h 20m');
    expect(formatCountdown(180)).toBe('in 3h');
  });
});
