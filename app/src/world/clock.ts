import { Platform } from 'react-native';
import { daylight, sunElevation } from './rig';

// The person's local hour (0–24). On web, ?hour=19.5 previews a time of day
// for design review and QA.
export function localHour(): number {
  const g: any = globalThis;
  const forced =
    Platform.OS === 'web' && g.location ? parseFloat(new URLSearchParams(g.location.search).get('hour') ?? '') : NaN;
  if (Number.isFinite(forced)) return forced;
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
}

// Daylight right now, 0 (night) to 1 (day).
export function daylightNow(): number {
  return daylight(sunElevation(localHour()));
}
