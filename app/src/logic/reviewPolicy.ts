// When to ask for an App Store / Play rating. Pure, so it can be tested.
//
// Only at a good moment (a steady check-in, finishing the first week or an
// experiment), only once the person has really used the app, and rarely:
// at most three times ever and never within four months of the last ask.
// The stores rate-limit the prompt too; this keeps us well inside that.

export type ReviewMoment = 'steady-checkin' | 'first-week' | 'experiment-done';

export interface ReviewState {
  count: number; // times we've asked
  last: number | null; // epoch ms of the last ask
}

export const REVIEW_MIN_CHECKINS = 3;
export const REVIEW_MAX_ASKS = 3;
export const REVIEW_GAP_DAYS = 120;

const DAY_MS = 24 * 60 * 60 * 1000;

export function shouldAskForReview(state: ReviewState, checkIns: number, now = Date.now()): boolean {
  if (checkIns < REVIEW_MIN_CHECKINS) return false;
  if (state.count >= REVIEW_MAX_ASKS) return false;
  if (state.last != null && now - state.last < REVIEW_GAP_DAYS * DAY_MS) return false;
  return true;
}

export function parseReviewState(raw: string | null): ReviewState {
  try {
    const v = raw ? JSON.parse(raw) : null;
    if (v && typeof v.count === 'number') {
      return { count: v.count, last: typeof v.last === 'number' ? v.last : null };
    }
  } catch {
    // Corrupt value: start fresh.
  }
  return { count: 0, last: null };
}
