import React from 'react';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

// Native one-tap export: snapshot the card view to a PNG and open the share
// sheet. Returns false if capture or sharing isn't available (caller falls back
// to text sharing).
export const canCaptureImage = true;

export async function captureAndShare(ref: React.RefObject<unknown>): Promise<boolean> {
  try {
    if (!ref.current) return false;
    const uri = await captureRef(ref as React.RefObject<number>, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
    });
    if (!(await Sharing.isAvailableAsync())) return false;
    await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your Signal Card' });
    return true;
  } catch {
    return false;
  }
}
