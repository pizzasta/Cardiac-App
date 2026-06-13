// Evidence-backed notes on why circadian rhythm matters. Every entry is grounded
// in a peer-reviewed or public-health source (linked). Phrasing stays faithful to
// the evidence — associations are stated as associations, not promises.

export interface ScienceNote {
  title: string;
  body: string;
  sourceLabel: string;
  sourceUrl: string;
}

export const SCIENCE: ScienceNote[] = [
  {
    title: 'One clock runs many systems',
    body: 'A master clock in the brain’s suprachiasmatic nucleus (SCN) keeps a ~24-hour cycle that coordinates your sleep–wake timing, core body temperature, hormone release, and metabolism — not just when you feel sleepy.',
    sourceLabel: 'Sleep Foundation — What is circadian rhythm?',
    sourceUrl: 'https://www.sleepfoundation.org/circadian-rhythm',
  },
  {
    title: 'Light is the main dial',
    body: 'Morning light signals the SCN to raise cortisol and body temperature, increasing alertness; as darkness falls, melatonin rises and temperature drops to promote sleep. This is why light exposure and timing shift how you feel.',
    sourceLabel: 'Sleep Foundation — Sleep drive & your body clock',
    sourceUrl: 'https://www.sleepfoundation.org/circadian-rhythm/sleep-drive-and-your-body-clock',
  },
  {
    title: 'Regular timing beats raw hours (for mood)',
    body: 'In large accelerometer studies, the regularity of your sleep timing predicts depression and anxiety risk better than sleep duration alone — a consistent schedule appears to matter more than simply sleeping longer.',
    sourceLabel: 'Sleep regularity & incident depression/anxiety (PMC)',
    sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12404321/',
  },
  {
    title: 'Memory consolidates on schedule',
    body: 'Sleep reliably improves recall versus equivalent time awake, and keeping consistent sleep timing is associated with better memory, attention, and impulse control — especially under high cognitive demand.',
    sourceLabel: 'Memory and sleep (PMC)',
    sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7983127/',
  },
  {
    title: 'Steadier rhythm, steadier under stress',
    body: 'People with consistent sleep/wake schedules report fewer acute stress events, and regularity appears to help preserve executive function when stress hits.',
    sourceLabel: 'Sleep/wake regularity & stress (PMC)',
    sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12713908/',
  },
  {
    title: 'Metabolism has a time of day',
    body: 'Glucose tolerance peaks in the morning and declines later in the day. Eating earlier is linked to better glycemic control — in U.S. population data, each hour later that eating started was associated with ~0.6% higher glucose and ~3% higher insulin resistance.',
    sourceLabel: 'Timing of eating & glucose metabolism (PubMed)',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/36771435/',
  },
  {
    title: 'Misalignment carries real risk',
    body: 'Chronic circadian disruption — most studied in night-shift work — is associated with higher cardiovascular risk, and the IARC classified shift work involving circadian disruption as a probable human carcinogen (2007). Aligning your rhythm is partly about avoiding this strain.',
    sourceLabel: 'Shift work, circadian disruption & health (PMC)',
    sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11539914/',
  },
];
