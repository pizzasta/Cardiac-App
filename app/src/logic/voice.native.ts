// Native speech-to-text needs on-device recognition that isn't available in
// Expo Go — it requires a custom dev build (e.g. expo-speech-recognition or
// @react-native-voice/voice with a config plugin). We degrade gracefully so the
// app still bundles and runs; the mic button hides when unsupported.
// Pulse's spoken replies (TTS via expo-speech) work on native regardless.

export const voiceSupported = false;

export function listen(
  _onResult: (text: string) => void,
  onEnd: () => void,
  _onError?: (err: string) => void
): () => void {
  onEnd();
  return () => {};
}
