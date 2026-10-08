import { DRAG_YAW, dragEnd, dragMove, dragStart, look, stepDrag, TILT_YAW, tiltToLook } from './look';

describe('drag to look', () => {
  it('turns with the finger and stays within range', () => {
    dragStart(200, 0);
    dragMove(100, 16);
    expect(look.dragYaw).toBeGreaterThan(0);
    dragMove(-5000, 32);
    expect(look.dragYaw).toBeLessThanOrEqual(DRAG_YAW);
    dragEnd();
  });

  it('coasts, then drifts back to centre', () => {
    let s = { yaw: 0.3, vel: 1 };
    s = stepDrag(s.yaw, s.vel, false, 0.05);
    expect(s.yaw).toBeGreaterThan(0.3 * Math.exp(-0.9 * 0.05) - 1e-9);
    for (let i = 0; i < 400; i++) s = stepDrag(s.yaw, s.vel, false, 0.05);
    expect(s.yaw).toBe(0);
    expect(s.vel).toBe(0);
  });

  it('holds still while the finger is down', () => {
    expect(stepDrag(0.2, 3, true, 0.05)).toEqual({ yaw: 0.2, vel: 3 });
  });
});

describe('tiltToLook', () => {
  it('ignores a slightly shaky hand', () => {
    expect(tiltToLook(0.01, -0.01)).toEqual({ yaw: 0, pitch: 0 });
  });

  it('turns with the tilt, within limits', () => {
    expect(tiltToLook(0.2, 0).yaw).toBeLessThan(0);
    expect(Math.abs(tiltToLook(5, 0).yaw)).toBeCloseTo(TILT_YAW);
  });
});
