// Haptic feedback, behind a user setting (Settings > Haptics). Every call is
// fire-and-forget, never throws, and does nothing on web.
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

export const HAPTICS_PREF_KEY = 'circadia.haptics';

let enabled = true;

export function hapticsEnabled(): boolean {
  return enabled;
}

export async function loadHapticsPref(): Promise<boolean> {
  try {
    enabled = (await AsyncStorage.getItem(HAPTICS_PREF_KEY)) !== 'off';
  } catch {
    enabled = true;
  }
  return enabled;
}

export function setHapticsEnabled(on: boolean): void {
  enabled = on;
  AsyncStorage.setItem(HAPTICS_PREF_KEY, on ? 'on' : 'off').catch(() => {});
}

export type HapticKind = 'tap' | 'select' | 'success';

export function haptic(kind: HapticKind): void {
  if (!enabled || Platform.OS === 'web') return;
  const run =
    kind === 'tap'
      ? () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      : kind === 'select'
        ? () => Haptics.selectionAsync()
        : () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  try {
    run().catch(() => {});
  } catch {
    // Unavailable on this device.
  }
}
