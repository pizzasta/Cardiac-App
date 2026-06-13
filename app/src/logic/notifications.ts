import { AnimalId } from '../data/archetypes';

// Web fallback. Browsers can grant notification permission, but a static site
// can't reliably fire recurring daily reminders (that needs the native app or a
// push backend). So we request permission and confirm, and surface canSchedule
// = false so the UI can explain the limitation honestly.

export const canSchedule = false;

export async function isEnabled(): Promise<boolean> {
  return typeof Notification !== 'undefined' && Notification.permission === 'granted';
}

export async function enable(_animal: AnimalId): Promise<boolean> {
  if (typeof Notification === 'undefined') return false;
  let perm = Notification.permission;
  if (perm !== 'granted') perm = await Notification.requestPermission();
  if (perm !== 'granted') return false;
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
  /* Browser notification permission is managed in site settings; nothing to cancel. */
}
