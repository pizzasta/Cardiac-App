import {
  parsePendingReview,
  parseReviewState,
  REVIEW_GAP_DAYS,
  REVIEW_MAX_ASKS,
  REVIEW_PENDING_DAYS,
  shouldAskForReview,
  shouldShowPendingReview,
} from './reviewPolicy';

const DAY = 24 * 60 * 60 * 1000;
const now = Date.UTC(2026, 9, 8);

describe('shouldAskForReview', () => {
  it('waits until the person has checked in a few times', () => {
    expect(shouldAskForReview({ count: 0, last: null }, 2, now)).toBe(false);
    expect(shouldAskForReview({ count: 0, last: null }, 3, now)).toBe(true);
  });

  it('never asks more than three times', () => {
    expect(shouldAskForReview({ count: 3, last: null }, 30, now)).toBe(false);
  });

  it('leaves a long gap between asks', () => {
    const recent = now - (REVIEW_GAP_DAYS - 1) * DAY;
    const old = now - (REVIEW_GAP_DAYS + 1) * DAY;
    expect(shouldAskForReview({ count: 1, last: recent }, 10, now)).toBe(false);
    expect(shouldAskForReview({ count: 1, last: old }, 10, now)).toBe(true);
  });
});

describe('parseReviewState', () => {
  it('reads a saved state and survives junk', () => {
    expect(parseReviewState('{"count":2,"last":5}')).toEqual({ count: 2, last: 5 });
    expect(parseReviewState(null)).toEqual({ count: 0, last: null });
    expect(parseReviewState('not json')).toEqual({ count: 0, last: null });
  });
});

describe('pending review prompt', () => {
  const fresh = { count: 0, last: null };

  it('shows nothing when no good moment was marked', () => {
    expect(shouldShowPendingReview(null, fresh, now)).toBe(false);
  });

  it('shows a recent good moment at the next pause', () => {
    expect(shouldShowPendingReview(now - DAY, fresh, now)).toBe(true);
  });

  it('lets an old good moment lapse', () => {
    expect(shouldShowPendingReview(now - (REVIEW_PENDING_DAYS + 1) * DAY, fresh, now)).toBe(false);
  });

  it('still respects the ask limits', () => {
    expect(shouldShowPendingReview(now - DAY, { count: REVIEW_MAX_ASKS, last: null }, now)).toBe(false);
    expect(shouldShowPendingReview(now - DAY, { count: 1, last: now - 2 * DAY }, now)).toBe(false);
  });

  it('reads a stored timestamp and survives junk', () => {
    expect(parsePendingReview(String(now))).toBe(now);
    expect(parsePendingReview(null)).toBeNull();
    expect(parsePendingReview('soon')).toBeNull();
  });
});
