import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { AnimalId } from '../data/archetypes';
import { REMINDERS } from '../data/reminders';

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
  return true;
}

export async function disable(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
