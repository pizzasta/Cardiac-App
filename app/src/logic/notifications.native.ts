import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { AnimalId } from '../data/archetypes';
import { REMINDERS } from '../data/reminders';
import { load as loadLog, suggestCheckInTime } from './pulselog';

// A dedicated, adaptive daily check-in nudge — separate from the static rhythm
// reminders so we can re-time just this one as the user's pattern emerges.
const CHECKIN_ID = 'circadia-checkin';

// Real, OS-scheduled local notifications. These fire even when the app is
// closed (native), so opting in genuinely delivers daily rhythm nudges.

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Native can schedule recurring reminders; web cannot (see notifications.ts).
export const canSchedule = true;

async function ensureAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('rhythm', {
      name: 'Rhythm nudges',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export async function isEnabled(): Promise<boolean> {
  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) return false;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.length > 0;
}

export async function enable(animal: AnimalId): Promise<boolean> {
  let { granted } = await Notifications.getPermissionsAsync();
  if (!granted) {
    granted = (await Notifications.requestPermissionsAsync()).granted;
  }
  if (!granted) return false;

  await ensureAndroidChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const r of REMINDERS[animal]) {
    await Notifications.scheduleNotificationAsync({
      content: { title: r.title, body: r.body },
      // Daily repeating calendar trigger.
      trigger: {
        hour: r.hour,
        minute: r.minute,
        repeats: true,
        channelId: 'rhythm',
      } as Notifications.NotificationTriggerInput,
    });
  }

  await scheduleCheckIn(animal);
  return true;
}

// Schedule (or replace) the single adaptive check-in nudge.
async function scheduleCheckIn(animal: AnimalId): Promise<void> {
  const base = REMINDERS[animal][0]; // crash window = sensible cold-start time
  const log = await loadLog();
  const t = suggestCheckInTime(log, { hour: base.hour, minute: base.minute });
  await Notifications.cancelScheduledNotificationAsync(CHECKIN_ID).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: CHECKIN_ID,
    content: {
      title: 'How’s your signal?',
      body: '10-second check-in — catch your rhythm before it dips.',
    },
    trigger: {
      hour: t.hour,
      minute: t.minute,
      repeats: true,
      channelId: 'rhythm',
    } as Notifications.NotificationTriggerInput,
  });
}

// Called after a check-in so the nudge re-times to the emerging pattern. No-op
// if the user hasn't enabled notifications.
export async function refreshSmartNudge(animal: AnimalId): Promise<void> {
  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) return;
  await ensureAndroidChannel();
  await scheduleCheckIn(animal);
}

export async function disable(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
