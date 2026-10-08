// "Look around": the world behaves like a window. Tilting the phone turns
// the view a little, and a sideways drag swings it further, with momentum,
// before it drifts back to centre. Shared module state so touch handlers at
// the app root and the 3D camera can meet without re-rendering anything.
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { DeviceMotion } from 'expo-sensors';

// Largest turn (radians) each input may add.
export const TILT_YAW = 0.26;
export const TILT_PITCH = 0.12;
export const DRAG_YAW = 0.45;
// Radians of turn per pixel dragged.
const DRAG_GAIN = 0.0042;

export const look = {
  dragYaw: 0,
  dragVel: 0,
  dragging: false,
  lastX: 0,
  lastT: 0,
  tiltYaw: 0,
  tiltPitch: 0,
};

const clamp = (v: number, a: number) => Math.max(-a, Math.min(a, v));

export function dragStart(x: number, t: number): void {
  look.dragging = true;
  look.lastX = x;
  look.lastT = t;
  look.dragVel = 0;
}

export function dragMove(x: number, t: number): void {
  if (!look.dragging) return;
  const dx = x - look.lastX;
  const dt = Math.max(1, t - look.lastT) / 1000;
  // Dragging right turns the view left, like pulling a scene with a finger.
  const turn = -dx * DRAG_GAIN;
  look.dragYaw = clamp(look.dragYaw + turn, DRAG_YAW);
  look.dragVel = turn / dt;
  look.lastX = x;
  look.lastT = t;
}

export function dragEnd(): void {
  look.dragging = false;
}

// Advance momentum and the slow return to centre. Pure on its inputs so it
// can be tested; returns the new drag yaw and velocity.
export function stepDrag(yaw: number, vel: number, dragging: boolean, dt: number): { yaw: number; vel: number } {
  if (dragging) return { yaw, vel };
  // Momentum fades quickly; then a gentle spring brings the view home.
  const nextVel = vel * Math.exp(-4 * dt);
  const coast = clamp(yaw + nextVel * dt, DRAG_YAW);
  const home = coast * Math.exp(-0.9 * dt);
  return { yaw: Math.abs(home) < 1e-4 ? 0 : home, vel: Math.abs(nextVel) < 1e-3 ? 0 : nextVel };
}

// Map device tilt (radians, relative to how the phone was held a moment ago)
// to a view turn, with a soft dead zone so a steady hand stays still.
export function tiltToLook(dGamma: number, dBeta: number): { yaw: number; pitch: number } {
  const soft = (v: number) => (Math.abs(v) < 0.02 ? 0 : v - Math.sign(v) * 0.02);
  return {
    yaw: clamp(-soft(dGamma) * 0.9, TILT_YAW) || 0,
    pitch: clamp(soft(dBeta) * 0.5, TILT_PITCH),
  };
}

// Listens to the phone's orientation while `enabled`. The resting position
// follows slowly, so however the phone is held becomes "centre" again.
export function useDeviceTilt(enabled: boolean): void {
  useEffect(() => {
    look.tiltYaw = 0;
    look.tiltPitch = 0;
    if (!enabled || Platform.OS === 'web') return;
    let base: { b: number; g: number } | null = null;
    let sub: { remove: () => void } | undefined;
    // Cleanup can run before the sensor check resolves; don't subscribe then.
    let cancelled = false;
    DeviceMotion.isAvailableAsync()
      .then((ok) => {
        if (!ok || cancelled) return;
        DeviceMotion.setUpdateInterval(33);
        sub = DeviceMotion.addListener(({ rotation }) => {
          if (!rotation) return;
          const b = rotation.beta;
          const g = rotation.gamma;
          if (!base) base = { b, g };
          // Re-centre over a few seconds.
          base.b += (b - base.b) * 0.01;
          base.g += (g - base.g) * 0.01;
          const t = tiltToLook(g - base.g, b - base.b);
          look.tiltYaw = t.yaw;
          look.tiltPitch = t.pitch;
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      sub?.remove();
      look.tiltYaw = 0;
      look.tiltPitch = 0;
    };
  }, [enabled]);
}

// Mobile web: iOS Safari only shares orientation after a tap and a permission
// prompt, so this is wired to the first touch. Desktop browsers have no tilt
// and keep the mouse parallax instead.
let webTiltStarted = false;
export function startWebTilt(): void {
  if (Platform.OS !== 'web' || webTiltStarted) return;
  const g: any = globalThis;
  const Evt = g.DeviceOrientationEvent;
  if (!Evt || !('ontouchstart' in g)) return;
  webTiltStarted = true;
  const listen = () => {
    let base: { b: number; g: number } | null = null;
    g.addEventListener('deviceorientation', (e: { beta: number | null; gamma: number | null }) => {
      if (e.beta == null || e.gamma == null) return;
      const b = (e.beta * Math.PI) / 180;
      const gm = (e.gamma * Math.PI) / 180;
      if (!base) base = { b, g: gm };
      base.b += (b - base.b) * 0.01;
      base.g += (gm - base.g) * 0.01;
      const t = tiltToLook(gm - base.g, b - base.b);
      look.tiltYaw = t.yaw;
      look.tiltPitch = t.pitch;
    });
  };
  if (typeof Evt.requestPermission === 'function') {
    Evt.requestPermission()
      .then((r: string) => r === 'granted' && listen())
      .catch(() => {});
  } else {
    listen();
  }
}
