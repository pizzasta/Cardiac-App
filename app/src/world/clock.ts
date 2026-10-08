import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { daylight, sunElevation } from './rig';

// Where the ?hour= preview is allowed: development, local testing and
// preview deployments. The public site always follows the real clock.
function canPreviewHour(g: any): boolean {
  if (typeof __DEV__ !== 'undefined' && __DEV__) return true;
  const host: string = g.location?.hostname ?? '';
  return host === 'localhost' || host === '127.0.0.1' || host.endsWith('.vercel.app');
}

// The person's local hour (0–24). On web, ?hour=19.5 previews a time of day
// for design review and QA (see canPreviewHour).
export function localHour(): number {
  const g: any = globalThis;
  const forced =
    Platform.OS === 'web' && g.location && canPreviewHour(g)
      ? parseFloat(new URLSearchParams(g.location.search).get('hour') ?? '')
      : NaN;
  if (Number.isFinite(forced)) return forced;
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
}


// The local hour as React state: refreshed every minute and whenever the app
// returns to the foreground, so the sky and the screen shades stay in step
// with the clock even on long-lived screens.
export function useLocalHour(): number {
  const [hour, setHour] = useState(localHour);
  useEffect(() => {
    const tick = () => setHour(localHour());
    const id = setInterval(tick, 60000);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') tick();
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, []);
  return hour;
}

// Daylight (0 night to 1 day) as React state; see useLocalHour.
export function useDaylight(): number {
  return daylight(sunElevation(useLocalHour()));
}
