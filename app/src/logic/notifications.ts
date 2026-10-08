import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnimalId } from '../data/archetypes';

// Web fallback. Browsers can grant notification permission, but a static site
// can't reliably fire recurring daily reminders (that needs the native app or a
// push backend). So we request permission and confirm, and surface canSchedule
// = false so the UI can explain the limitation honestly.
//
// A site can't revoke its own notification permission, so turning reminders
// off is stored as a local opt-out. Reminders count as on only when the
// browser has granted permission and the person hasn't opted out.

export const canSchedule = false;

const OPT_OUT_KEY = 'circadia.webNotifsOff';

async function optedOut(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(OPT_OUT_KEY)) === '1';
  } catch {
    return false;
  }
}

async function setOptedOut(off: boolean): Promise<void> {
  try {
    if (off) await AsyncStorage.setItem(OPT_OUT_KEY, '1');
    else await AsyncStorage.removeItem(OPT_OUT_KEY);
  } catch {
    // Storage unavailable: the switch just won't remember the choice.
  }
}

export async function isEnabled(): Promise<boolean> {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false;
  return !(await optedOut());
}

export async function enable(_animal: AnimalId): Promise<boolean> {
  if (typeof Notification === 'undefined') return false;
  let perm = Notification.permission;
  if (perm !== 'granted') perm = await Notification.requestPermission();
  if (perm !== 'granted') return false;
  await setOptedOut(false);
  try {
    new Notification('Circadia', {
      body: 'Notifications on. Open the app on your phone for daily rhythm nudges.',
    });
  } catch {
    /* no-op */
  }
  return true;
}

export async function disable(): Promise<void> {
  // Browser permission lives in site settings; remember the opt-out instead.
  await setOptedOut(true);
}

// Smart check-in nudge is native-only (recurring local notifications). No-op on
// web so callers can stay platform-agnostic.
export async function refreshSmartNudge(_animal: AnimalId): Promise<void> {
  /* no-op on web */
}
