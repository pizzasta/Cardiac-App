import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Top padding that respects the device's safe area (notch / Dynamic Island),
// with a sensible floor for web and non-notch devices.
export function useTopInset(base = 44): number {
  const insets = useSafeAreaInsets();
  return Math.max(insets.top + 8, base);
}
