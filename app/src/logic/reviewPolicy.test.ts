import { parseReviewState, REVIEW_GAP_DAYS, shouldAskForReview } from './reviewPolicy';

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
