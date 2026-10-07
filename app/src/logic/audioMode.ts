// Shared expo-av audio session setup (native only; imported by .native files).
// Respect the iOS silent switch, mix with whatever else is playing, and stop
// when the app goes to the background.
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

let ready: Promise<void> | null = null;

export function ensureAudioMode(): Promise<void> {
  if (!ready) {
    ready = Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      shouldDuckAndroid: true,
    }).catch(() => {
      ready = null;
    });
  }
  return ready;
}
