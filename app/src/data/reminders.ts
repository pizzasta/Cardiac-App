import { AnimalId } from './archetypes';

// Daily local-notification schedule per archetype, in 24h local time. Tuned to
// each profile's suggested lower-energy window and wind-down so the nudges land when they help.

export interface Reminder {
  hour: number;
  minute: number;
  title: string;
  body: string;
}

export const REMINDERS: Record<AnimalId, Reminder[]> = {
  dolphin: [
    { hour: 13, minute: 30, title: 'Quick reset?', body: 'Your plan suggests this may be a lower-energy window. Water or a short screen break could be worth trying.' },
    { hour: 21, minute: 30, title: 'Wind down', body: 'Screens down, soundscape on. A light sleeper needs the runway.' },
  ],
  wolf: [
    { hour: 11, minute: 0, title: 'Slow start is fine', body: 'Don’t make this hour the day’s first hard thing. Ease in.' },
    { hour: 23, minute: 0, title: 'Set your stop time', body: 'You’re in your good hours — one creative thing, then a real cutoff.' },
  ],
  bear: [
    { hour: 18, minute: 0, title: 'Ease off', body: 'Your plan suggests a gentler evening may fit here. Consider letting the day land before adding more.' },
    { hour: 22, minute: 0, title: 'Protect your rest', body: 'Same wind-down, same time. Rest is maintenance, not a reward.' },
  ],
  hummingbird: [
    { hour: 9, minute: 0, title: 'Pick one thing', body: 'Before the day pulls you twelve directions, name the single priority.' },
    { hour: 21, minute: 30, title: 'Brain dump', body: 'Write tomorrow’s list so the loop stops running at night.' },
  ],
  fox: [
    { hour: 17, minute: 0, title: 'Movement break?', body: 'A little movement may help create a transition between the day and your evening.' },
    { hour: 21, minute: 0, title: 'Permission to stop', body: 'Everything that needed you today, you did. You can stop scanning.' },
  ],
  octopus: [
    { hour: 14, minute: 0, title: 'Low-demand stretch', body: 'Your plan suggests this could be a good time for solo or quieter work.' },
    { hour: 21, minute: 30, title: 'Unload the day', body: 'You carry other people’s moods. Set them down before bed.' },
  ],
};
