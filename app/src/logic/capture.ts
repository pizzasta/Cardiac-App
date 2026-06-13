import React from 'react';

// Web fallback: no native image capture. Callers fall back to text sharing.
export const canCaptureImage = false;

export async function captureAndShare(_ref: React.RefObject<unknown>): Promise<boolean> {
  return false;
}
