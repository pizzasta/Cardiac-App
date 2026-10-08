// The "Simple background" setting: a still gradient instead of the 3D world,
// to save battery. Stored on the device only.
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Battery from 'expo-battery';

export const SIMPLE_BG_KEY = 'circadia.simpleBackground';

export async function loadSimpleBackground(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(SIMPLE_BG_KEY)) === 'on';
  } catch {
    return false;
  }
}

export function saveSimpleBackground(on: boolean): void {
  AsyncStorage.setItem(SIMPLE_BG_KEY, on ? 'on' : 'off').catch(() => {});
}

// True while the phone is in Low Power Mode (iOS) or battery saver (Android);
// the app then uses the simple background automatically. Always false on web.
export function useLowPowerMode(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let sub: { remove: () => void } | undefined;
    Battery.isLowPowerModeEnabledAsync().then(setOn).catch(() => {});
    try {
      sub = Battery.addLowPowerModeListener(({ lowPowerMode }) => setOn(lowPowerMode));
    } catch {
      // Not supported on this device.
    }
    return () => sub?.remove();
  }, []);
  return on;
}
