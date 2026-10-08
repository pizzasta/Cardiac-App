// Asks for a store rating at a good moment (see reviewPolicy.ts). Never
// throws, and does nothing on web or where the store prompt isn't available.
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { parseReviewState, ReviewMoment, shouldAskForReview } from './reviewPolicy';

export type { ReviewMoment } from './reviewPolicy';

const KEY = 'circadia.reviewAsks';
// Let the moment land (the hop, the success sound) before the prompt.
const DELAY_MS = 1500;

export async function maybeAskForReview(_moment: ReviewMoment, checkIns: number): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const state = parseReviewState(await AsyncStorage.getItem(KEY));
    if (!shouldAskForReview(state, checkIns)) return;
    if (!(await StoreReview.isAvailableAsync())) return;
    if (!(await StoreReview.hasAction())) return;
    await AsyncStorage.setItem(KEY, JSON.stringify({ count: state.count + 1, last: Date.now() }));
    setTimeout(() => {
      StoreReview.requestReview().catch(() => {});
    }, DELAY_MS);
  } catch {
    // Never let a rating prompt get in the way.
  }
}
