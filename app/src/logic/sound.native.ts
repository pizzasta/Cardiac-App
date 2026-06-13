// Native ambience would need a bundled audio asset played on a loop via
// expo-av (the Web Audio API used on web isn't available on native). We don't
// ship an audio file in the prototype, so this is a graceful no-op — the sound
// toggle hides on native. Drop a rainforest loop in assets/ and wire expo-av
// here to enable it.

export const soundSupported = false;

export async function start(): Promise<void> {
  /* no-op */
}

export async function stop(): Promise<void> {
  /* no-op */
}
