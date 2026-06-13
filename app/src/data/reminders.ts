import { AnimalId } from './archetypes';

// Daily local-notification schedule per archetype, in 24h local time. Tuned to
// each animal's crash window and wind-down so the nudges land when they help.

export interface Reminder {
  hour: number;
  minute: number;
  title: string;
  body: string;
}

export const REMINDERS: Record<AnimalId, Reminder[]> = {
  dolphin: [
    { hour: 13, minute: 30, title: 'Crash window in 15', body: 'Water + 5 min off the screen now — not coffee. Trust me on this one.' },
    { hour: 21, minute: 30, title: 'Wind down', body: 'Screens down, soundscape on. A light sleeper needs the runway.' },
  ],
  wolf: [
    { hour: 11, minute: 0, title: 'Slow start is fine', body: 'Don’t make this hour the day’s first hard thing. Ease in.' },
    { hour: 23, minute: 0, title: 'Set your stop time', body: 'You’re in your good hours — one creative thing, then a real cutoff.' },
  ],
  bear: [
    { hour: 18, minute: 0, title: 'Ease off', body: 'The evening dip is real. Stop adding to the pile; let the day land.' },
    { hour: 22, minute: 0, title: 'Protect your rest', body: 'Same wind-down, same time. Rest is maintenance, not a reward.' },
  ],
  hummingbird: [
    { hour: 9, minute: 0, title: 'Pick one thing', body: 'Before the day pulls you twelve directions, name the single priority.' },
    { hour: 21, minute: 30, title: 'Brain dump', body: 'Write tomorrow’s list so the loop stops running at night.' },
  ],
  fox: [
    { hour: 17, minute: 0, title: 'Move to discharge', body: 'Burn off the alertness so it doesn’t follow you to bed.' },
    { hour: 21, minute: 0, title: 'Permission to stop', body: 'Everything that needed you today, you did. You can stop scanning.' },
  ],
  octopus: [
    { hour: 14, minute: 0, title: 'Low-demand stretch', body: 'Take the mask off for a bit — solo or quiet work now.' },
    { hour: 21, minute: 30, title: 'Unload the day', body: 'You carry other people’s moods. Set them down before bed.' },
  ],
};
