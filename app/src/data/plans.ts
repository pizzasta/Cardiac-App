import { AnimalId } from './archetypes';

// Per-archetype Circadia rhythm plan: a time-anchored daily flow plus targeted
// tips. Grounded in each animal's traits (peak window, crash, failure mode,
// recharge) so it reads as a real plan, not generic wellness filler.

export interface FlowItem {
  time: string;
  title: string;
  note: string;
}

export interface Tip {
  label: string;
  text: string;
}

export interface RhythmPlan {
  intro: string;
  flow: FlowItem[];
  tips: Tip[];
}

export const PLANS: Record<AnimalId, RhythmPlan> = {
  dolphin: {
    intro: 'Sharp and easily overstimulated. Front-load focus, defend the 2pm dip, end the day quiet.',
    flow: [
      { time: '9:30', title: 'Hardest task here', note: "You're sharpest late morning — spend it on the thing that needs real thinking." },
      { time: '1:45', title: 'Crash incoming', note: 'Water + 5 min off the screen now. Not coffee — it deepens the spiral.' },
      { time: '4:00', title: 'Light, low-stakes work', note: 'Admin, replies, tidying. Nothing that needs willpower.' },
      { time: '9:30', title: 'Wind-down, screens down', note: 'A light sleeper needs a real runway. Dim everything, soundscape on.' },
    ],
    tips: [
      { label: 'Focus', text: 'Single-task in the morning. One tab, one thing — your edge dulls fast when split.' },
      { label: 'Recovery', text: 'You recharge alone and quiet. Protect one solo window a day; it’s maintenance, not a treat.' },
      { label: 'Sleep', text: 'Same lights-out time every night matters more for you than for most. Anchor it.' },
    ],
  },
  wolf: {
    intro: 'Your good hours start when others wind down. Protect the night burst, set a real stop time.',
    flow: [
      { time: '11:00', title: 'Slow start, no hard wins yet', note: 'You’re not online till late morning. Don’t make 9am the day’s first hard thing.' },
      { time: '3:00', title: 'Ramp into focus', note: 'Energy lifts through the afternoon — start the work that matters now.' },
      { time: '9:00', title: 'Creative burst', note: 'Your best hours. One ambitious thing — but set the stop time first.' },
      { time: '12:00', title: 'Hard stop', note: 'Future-you pays for the all-nighter. Decide the cutoff before you start.' },
    ],
    tips: [
      { label: 'Focus', text: 'Schedule deep work for the evening. Mornings are for low-stakes momentum.' },
      { label: 'Recovery', text: 'Movement and novelty refill you faster than rest does. Change the scene.' },
      { label: 'Sleep', text: 'You’ll fight a 10pm bedtime. Aim consistent-late instead of impossibly-early.' },
    ],
  },
  bear: {
    intro: 'Steady and reliable — which is exactly why you crash slowly. Protected rest is the whole plan.',
    flow: [
      { time: '10:00', title: 'Steady build', note: 'You don’t spike — you sustain. Start the main work and keep an even pace.' },
      { time: '1:00', title: 'Peak window', note: 'Midday is your best stretch. Put the important meeting or task here.' },
      { time: '6:00', title: 'Ease off', note: 'Evening dip is real. Stop adding to the pile; let the day land.' },
      { time: '10:30', title: 'Real rest', note: 'Deep, boring routine wins. Same wind-down, same time.' },
    ],
    tips: [
      { label: 'Burnout', text: 'Your crashes are slow-burn. Protect one afternoon a week before it stacks.' },
      { label: 'Recovery', text: 'You refill on deep rest and routine — not novelty. Don’t over-schedule recovery.' },
      { label: 'Movement', text: 'A short midday walk keeps the steady engine from sliding into fog.' },
    ],
  },
  hummingbird: {
    intro: 'Fast and scattered. The plan isn’t to slow down everywhere — it’s to land on one thing at a time.',
    flow: [
      { time: '9:00', title: 'Pick ONE thing', note: 'Before the day pulls you twelve directions, name the single priority.' },
      { time: '11:00', title: 'One focused block', note: '25 minutes, one task, everything else closed. Then a real break.' },
      { time: '3:00', title: 'Reset the spin', note: 'When scattered hits, stop and do a 2-minute grounding — feet, breath, water.' },
      { time: '9:30', title: 'Brain dump, then off', note: 'Write tomorrow’s list so the loop stops running at night.' },
    ],
    tips: [
      { label: 'Focus', text: 'Multitasking feels productive and isn’t — for you it’s the freeze trigger. One lane.' },
      { label: 'Recovery', text: 'Grounding beats stimulation. One thing, slowly, with your full attention.' },
      { label: 'Overwhelm', text: 'When it’s too much, shrink the task, don’t add structure. Smallest next step only.' },
    ],
  },
  fox: {
    intro: 'Hyper-alert and always scanning. Your peak is early — and your hardest skill is permission to stop.',
    flow: [
      { time: '8:00', title: 'Deep work, first thing', note: 'You’re sharpest early. Use it before the scanning takes over.' },
      { time: '12:00', title: 'Plan, then release', note: 'Set the day’s plan, then stop re-checking it. Trust the version you made.' },
      { time: '5:00', title: 'Movement to discharge', note: 'Burn off the alertness physically so it doesn’t follow you to bed.' },
      { time: '9:00', title: 'Permission to stop', note: 'Everything that needed you today, you did. You’re allowed to stop scanning.' },
    ],
    tips: [
      { label: 'Focus', text: 'Protect the first 90 minutes — that’s your sharpest, scan-free window.' },
      { label: 'Recovery', text: 'You don’t relax on command. Give yourself an explicit “done” signal each evening.' },
      { label: 'Sleep', text: 'Over-control keeps you wired. A fixed shutdown ritual tells the brain it’s safe to drop.' },
    ],
  },
  octopus: {
    intro: 'You read every room so well you forget your own state. The plan is decompression before empty.',
    flow: [
      { time: '10:00', title: 'Check your own gauge', note: 'Before absorbing everyone else, name your own energy: 1–5. Plan from that.' },
      { time: '2:00', title: 'Low-demand stretch', note: 'Schedule solo or low-social work midday so the mask comes off.' },
      { time: '5:30', title: 'Decompress, don’t mask', note: 'After people, take real quiet before the next thing. Don’t stack social.' },
      { time: '9:30', title: 'Unload the day', note: 'You carry others’ moods. Set them down — note, walk, or talk to someone safe.' },
    ],
    tips: [
      { label: 'Energy', text: 'You don’t run out loudly — you run out all at once. Catch it early with check-ins.' },
      { label: 'Recovery', text: 'Decompression and low-demand company refill you. Total isolation can overcorrect.' },
      { label: 'Boundaries', text: 'Masking through exhaustion is the failure mode. A short “I need 10” protects the week.' },
    ],
  },
};
