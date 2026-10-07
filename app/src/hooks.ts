import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Top padding that respects the device's safe area (notch / Dynamic Island),
// with a sensible floor for web and non-notch devices.
export function useTopInset(base = 44): number {
  const insets = useSafeAreaInsets();
  return Math.max(insets.top + 8, base);
}

// Bottom padding that clears the home indicator, with a floor for devices
// without one.
export function useBottomInset(base = 16): number {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom + 8, base);
}

// True when the OS asks for reduced motion; the 3D world and entrance
// animations go still.
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => alive && setReduced(v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduced;
}
