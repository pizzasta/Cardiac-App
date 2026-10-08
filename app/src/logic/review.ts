// Asks for a store rating at a good moment (see reviewPolicy.ts). Never
// throws, and does nothing on web or where the store prompt isn't available.
//
// Apple's guidance is not to show the prompt in response to a tap, so a good
// moment (a steady check-in, the first-week recap, a finished experiment) only
// marks a prompt as pending. It's shown the next time the person comes back
// to the app from the background, a natural pause between tasks.
import { AppState, AppStateStatus, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import {
  parsePendingReview,
  parseReviewState,
  ReviewMoment,
  shouldAskForReview,
  shouldShowPendingReview,
} from './reviewPolicy';

export type { ReviewMoment } from './reviewPolicy';

const KEY = 'circadia.reviewAsks';
const PENDING_KEY = 'circadia.reviewPending';
// Let the app settle back on screen before the prompt.
const DELAY_MS = 1500;

let listening = false;
let lastState: AppStateStatus = AppState.currentState;
let showing = false;

function listenForReturn(): void {
  if (listening) return;
  listening = true;
  AppState.addEventListener('change', (next) => {
    // Only a real return from the background counts; system alerts (like a
    // permission dialog) flip the app to "inactive" and back.
    const returned = lastState === 'background' && next === 'active';
    lastState = next;
    if (returned) void showPendingReview();
  });
}

async function showPendingReview(): Promise<void> {
  if (showing) return;
  showing = true;
  try {
    const pendingAt = parsePendingReview(await AsyncStorage.getItem(PENDING_KEY));
    if (pendingAt == null) return;
    const state = parseReviewState(await AsyncStorage.getItem(KEY));
    // Whatever happens next, this good moment has been used up.
    await AsyncStorage.removeItem(PENDING_KEY);
    if (!shouldShowPendingReview(pendingAt, state)) return;
    if (!(await StoreReview.isAvailableAsync())) return;
    if (!(await StoreReview.hasAction())) return;
    await AsyncStorage.setItem(KEY, JSON.stringify({ count: state.count + 1, last: Date.now() }));
    setTimeout(() => {
      StoreReview.requestReview().catch(() => {});
    }, DELAY_MS);
  } catch {
    // Never let a rating prompt get in the way.
  } finally {
    showing = false;
  }
}

// Records a good moment. The prompt itself waits for the next return to the app.
export async function maybeAskForReview(_moment: ReviewMoment, checkIns: number): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    listenForReturn();
    const state = parseReviewState(await AsyncStorage.getItem(KEY));
    if (!shouldAskForReview(state, checkIns)) return;
    await AsyncStorage.setItem(PENDING_KEY, String(Date.now()));
  } catch {
    // Never let a rating prompt get in the way.
  }
}
