import { PLANS } from '../data/plans';
import { effectiveFlowMinutes } from './forecast';
import { personalFlow } from './personalPlan';

describe('personalFlow', () => {
  it('moves the focus step to the time the person said they focus best', () => {
    const flow = personalFlow(PLANS.wolf.flow, { peak: 'late afternoon', crash: 'unpredictable' });
    const focus = flow.find((f) => f.kind === 'focus');
    expect(focus?.time).toBe('4:00');
    expect(focus?.personal).toBe(true);
  });

  it('moves the dip step and keeps the day in order', () => {
    const flow = personalFlow(PLANS.bear.flow, { peak: 'midday', crash: '2–4pm' });
    expect(flow.find((f) => f.kind === 'dip')?.time).toBe('2:30');
    const mins = effectiveFlowMinutes(flow);
    mins.slice(1).forEach((m, i) => expect(m).toBeGreaterThan(mins[i]));
  });

  it('keeps the wind-down last and never schedules focus after it', () => {
    const flow = personalFlow(PLANS.fox.flow, { peak: 'late night', crash: 'the evening' });
    expect(flow[flow.length - 1].title).toBe(PLANS.fox.flow[PLANS.fox.flow.length - 1].title);
    expect(flow.find((f) => f.kind === 'focus')?.personal).toBeUndefined();
  });

  it('leaves the template alone when the answer matches or is unknown', () => {
    const flow = personalFlow(PLANS.octopus.flow, { peak: 'variable', crash: 'unpredictable' });
    expect(flow.map((f) => f.time)).toEqual(PLANS.octopus.flow.map((f) => f.time));
    expect(flow.some((f) => f.personal)).toBe(false);
  });

  it('keeps every plan in chronological order for every answer', () => {
    const peaks = ['early morning', 'midday', 'late afternoon', 'late night'];
    const crashes = ['mid-morning', '2–4pm', 'the evening', 'unpredictable'];
    Object.values(PLANS).forEach((plan) =>
      peaks.forEach((peak) =>
        crashes.forEach((crash) => {
          const mins = effectiveFlowMinutes(personalFlow(plan.flow, { peak, crash }));
          mins.slice(1).forEach((m, i) => expect(m).toBeGreaterThan(mins[i]));
        })
      )
    );
  });
});

describe('personalFlow: swapping with a plain step', () => {
  it('moves focus to the person\'s time even when another step sits there', () => {
    // Dolphin's template has light work at 4:00; a late-afternoon person swaps them.
    const flow = personalFlow(PLANS.dolphin.flow, { peak: 'late afternoon', crash: '2–4pm' });
    expect(flow.find((f) => f.kind === 'focus')?.time).toBe('4:00');
    expect(flow.find((f) => f.title === 'Light, low-stakes work')?.time).toBe('9:30');
    const mins = effectiveFlowMinutes(flow);
    mins.slice(1).forEach((m, i) => expect(m).toBeGreaterThan(mins[i]));
  });
});
