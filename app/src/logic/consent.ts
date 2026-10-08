import AsyncStorage from '@react-native-async-storage/async-storage';

// Consent for sending personal data to the third-party AI service behind Ask
// Wildhour. Asked once, before the first request; revocable in Settings.

export const AI_CONSENT_KEY = 'circadia.aiConsent';

export async function hasAiConsent(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(AI_CONSENT_KEY)) === 'granted';
  } catch {
    return false;
  }
}

export async function setAiConsent(granted: boolean): Promise<void> {
  try {
    if (granted) await AsyncStorage.setItem(AI_CONSENT_KEY, 'granted');
    else await AsyncStorage.removeItem(AI_CONSENT_KEY);
  } catch {
    // best-effort; the caller's in-memory state still reflects the choice
  }
}
