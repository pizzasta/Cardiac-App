// Wildhour's Privacy Policy, Terms of Use, account-deletion and support pages.
//
// Single source of truth: the in-app Legal screen renders these documents, and
// `npm run gen:legal` renders the same content to public/*/index.html, which
// ships with the web build as the public URLs the app stores require.
//
// Keep this file free of imports so the generator can load it on its own.
// Every statement here must match what the code actually does. When data
// flows change, update this file in the same PR and re-run `npm run gen:legal`.
//
// Before public launch: replace OPERATOR and CONTACT_EMAIL with the real legal
// entity and a monitored inbox, and have counsel review.

export const LEGAL = {
  appName: 'Wildhour',
  // The person or company legally responsible for the app.
  operator: 'Wildhour',
  contactEmail: 'support@wildhour.app',
  webBase: 'https://pizzasta.github.io/Cardiac-App',
  updated: 'October 7, 2026',
};

export type LegalDocId = 'privacy' | 'terms' | 'delete-account' | 'support';

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalDoc {
  id: LegalDocId;
  title: string;
  // Label for navigation (tabs in the app, links on the web pages).
  shortTitle: string;
  intro: string;
  sections: LegalSection[];
}

const E = LEGAL.contactEmail;

export const PRIVACY: LegalDoc = {
  id: 'privacy',
  title: 'Privacy Policy',
  shortTitle: 'Privacy',
  intro:
    'This policy explains what Wildhour collects, why, who it is shared with, and the choices you have. We wrote it to be read, not skimmed past.',
  sections: [
    {
      heading: 'The short version',
      bullets: [
        'Wildhour works without an account. Until you sign in, your quiz answers and check-ins stay on your device.',
        'If you create an account, we store your data so it syncs across devices. You can delete it, or your whole account, in the app at any time.',
        'Ask Wildhour sends your question and some of your Wildhour data to an AI service, and only after you allow it.',
        'We don’t sell your data, show ads, or use advertising or analytics trackers.',
        'Wildhour is a self-awareness tool, not a medical service.',
      ],
    },
    {
      heading: 'Who we are',
      paragraphs: [
        `${LEGAL.operator} (“we”, “us”) operates the Wildhour app and website and is responsible for your personal data under this policy. Contact us at ${E}.`,
      ],
    },
    {
      heading: 'What we collect',
      paragraphs: ['Stored on your device, always:'],
      bullets: [
        'Your quiz answers and the rhythm profile they produce (rhythm animal, peak, dip and recharge notes).',
        'Daily check-ins: an energy level (Wired, Steady or Flat), an optional reason (sleep, people, work, body or nothing) and the time you logged it.',
        'Experiments you start and their dates.',
        'App settings, such as sound and volume, interface sounds, and whether you allowed Ask Wildhour.',
      ],
    },
    {
      heading: 'If you create an account',
      paragraphs: [
        'We store your email address, your name if you give it (or your name from Google if you sign in with Google), and an account ID. We also store copies of your quiz answers, results, check-ins and check-in streak counts so they sync across your devices.',
      ],
    },
    {
      heading: 'If you use Ask Wildhour',
      paragraphs: [
        'Ask Wildhour answers come from an AI model provided by Anthropic. When you ask a question, Wildhour sends it through our server to Anthropic together with the context needed to answer: your rhythm profile, your quiz answers, the conversation so far and, for check-in questions, a summary of your recent check-ins. We ask for your permission before the first request, and you can withdraw it in Settings.',
        'To prevent abuse, our server counts requests per account or, if you are not signed in, per IP address. IP addresses are stored only as a one-way hash, and anonymous counters are deleted within about a day.',
      ],
    },
    {
      heading: 'Other features',
      bullets: [
        'Voice input (web only): your browser turns speech into text. Some browsers, such as Chrome, send the audio to the browser maker to do this. We receive only the text.',
        'Spoken replies use your device’s built-in text-to-speech.',
        'Reminders are scheduled on your device. We don’t run a push-notification server or collect push tokens.',
        'Exports you create (CSV) go wherever you choose to save or share them.',
      ],
    },
    {
      heading: 'What we don’t collect',
      paragraphs: [
        'We don’t collect your location, contacts, photos, camera or microphone recordings, advertising identifiers or payment details. Wildhour contains no advertising or third-party analytics SDKs and doesn’t track you across other apps or websites.',
      ],
    },
    {
      heading: 'Health-related information',
      paragraphs: [
        'Check-ins describe how you feel, so we treat them, and your quiz answers, as sensitive health-related data. This includes “consumer health data” under laws such as Washington’s My Health My Data Act. We use it only to provide the features you ask for. We never sell it or use it for advertising, and we share it only with the service providers listed below so they can run those features.',
        'We ask for your consent before storing it in an account and before sending it to the AI service. You can withdraw consent at any time by turning off Ask Wildhour in Settings, deleting your data, or deleting your account.',
      ],
    },
    {
      heading: 'How we use your data',
      bullets: [
        'To give you your rhythm profile, daily plan, trends, experiment results and Days like today.',
        'To sync your data across devices when you have an account.',
        'To answer your Ask Wildhour questions.',
        'To keep the service secure and prevent abuse, for example with usage limits.',
        'To comply with the law and respond to lawful requests.',
      ],
      paragraphs: [
        'We don’t use your data to train AI models. Anthropic processes Ask Wildhour requests under its commercial API terms, which don’t allow it to train its models on that data.',
      ],
    },
    {
      heading: 'Legal bases (EEA and UK)',
      bullets: [
        'Contract: to provide the app and your account.',
        'Explicit consent: for health-related data stored in your account and sent to the AI service.',
        'Legitimate interests: to keep the service secure and prevent abuse.',
        'Legal obligation: where the law requires us to keep or disclose information.',
      ],
    },
    {
      heading: 'Who we share data with',
      paragraphs: [
        'We share data only with service providers that process it on our behalf and under our instructions:',
      ],
      bullets: [
        'Supabase: database and sign-in for accounts.',
        'Anthropic: generates Ask Wildhour answers.',
        'Google: only if you choose “Sign in with Google”.',
        'GitHub and Vercel: host the web version. Like most hosts, they may keep standard request logs, such as IP address and browser type, for security.',
        'Apple and Google: distribute the mobile app under their own privacy policies.',
      ],
    },
    {
      heading: 'More about sharing',
      paragraphs: [
        'We may disclose data if the law requires it, to protect people’s safety, or as part of a merger or sale. In a merger or sale, this policy would continue to apply and we would tell you first. We do not sell personal data or share it for cross-context behavioral advertising.',
      ],
    },
    {
      heading: 'International transfers',
      paragraphs: [
        'Our providers may process data in the United States and other countries. Where the law requires it, transfers are covered by safeguards such as the European Commission’s Standard Contractual Clauses.',
      ],
    },
    {
      heading: 'How long we keep data',
      bullets: [
        'On your device: until you delete it in Settings, delete the app, or clear the site’s data.',
        'In your account: until you delete it or your account. Deleted data is removed from our live database straight away. It may remain in our provider’s encrypted backups for a limited period, typically up to 30 days.',
        'Ask Wildhour: we don’t store your questions or answers on our server. Anthropic may keep requests for a limited period under its terms (currently up to 30 days) for trust and safety.',
        'Usage-limit counters: anonymous counters are deleted within about a day; account counters are deleted with your account.',
      ],
    },
    {
      heading: 'Your choices and rights',
      bullets: [
        'Access and portability: Settings → Data & privacy → Export my data downloads every check-in as a CSV file.',
        'Correction: retake the quiz or update today’s check-in at any time.',
        'Deletion: Settings → Data & privacy → Delete my data, or Delete my account. You can also ask us at the address below.',
        'Withdraw consent: turn off Ask Wildhour in Settings, sign out, or delete your data.',
        'Object, restrict, or complain: email us. In the EEA or UK you can also complain to your local data protection authority.',
      ],
      paragraphs: [
        'Depending on where you live (for example California, Colorado, Connecticut, Virginia, Texas, Oregon, Washington or Nevada), you may have rights to know, access, correct, delete and port your data. You may also have the right to opt out of its sale, targeted advertising or profiling, and to limit how sensitive data is used. We don’t sell data, target ads or profile you, and we use sensitive data only to provide the service.',
        `To exercise any right, email ${E} from your account’s email address. We may need to verify your identity, and we will respond within 45 days. An authorized agent may act for you with your written permission. If we decline your request, you can appeal by replying with “Appeal” in the subject line. We will never treat you differently for exercising your rights.`,
      ],
    },
    {
      heading: 'Security',
      paragraphs: [
        'Data travels over encrypted connections. Account data is protected by access rules that let each account read only its own records, and API keys stay on our server, never in the app. Data on your device is protected by your device’s own security. No system is perfectly secure, so please use a strong password.',
      ],
    },
    {
      heading: 'Children',
      paragraphs: [
        'Wildhour is for adults aged 18 and over. It isn’t directed at children, and we don’t knowingly collect their data. If you believe a child has used Wildhour, contact us and we will delete their data.',
      ],
    },
    {
      heading: 'Changes to this policy',
      paragraphs: [
        'We will update the date above when this policy changes. If a change materially affects how we use your data, we will tell you in the app before it takes effect and, where required, ask for your consent again.',
      ],
    },
    {
      heading: 'Contact',
      paragraphs: [`Questions or requests: ${E}.`],
    },
  ],
};

export const TERMS: LegalDoc = {
  id: 'terms',
  title: 'Terms of Use',
  shortTitle: 'Terms',
  intro:
    'These terms are the agreement between you and Wildhour for using the app and website. By using Wildhour you agree to them. If you don’t agree, please don’t use Wildhour.',
  sections: [
    {
      heading: 'Who can use Wildhour',
      paragraphs: ['You must be at least 18 years old and able to form a binding agreement.'],
    },
    {
      heading: 'Not medical advice',
      paragraphs: [
        'Wildhour helps you notice your own rhythms. It is not a medical or mental-health service, and nothing in it is a diagnosis, treatment or substitute for professional care. Rhythm animals, plans, forecasts, resets, experiments and insights are reflections generated by the app from your own answers and check-ins. They are not validated assessments, biological measurements or predictions.',
        'If you may be experiencing a medical or mental-health emergency, contact your local emergency services right away. In the US you can call or text 988 to reach the Suicide & Crisis Lifeline.',
      ],
    },
    {
      heading: 'Breathing resets',
      paragraphs: [
        'Breathe gently during resets, and stop if you feel dizzy, light-headed or uncomfortable. Talk to a professional before using breathing exercises if you have a heart or lung condition, or are pregnant.',
      ],
    },
    {
      heading: 'Ask Wildhour',
      paragraphs: [
        'Ask Wildhour answers are generated by AI. They may be wrong, incomplete or out of date, so use your own judgment and check anything important with a qualified professional. Please don’t enter other people’s personal information.',
      ],
    },
    {
      heading: 'Your account',
      paragraphs: [
        'Give accurate information and keep your sign-in details secure. You are responsible for activity on your account. Tell us at once if you think someone else has accessed it.',
      ],
    },
    {
      heading: 'Acceptable use',
      paragraphs: ['Please don’t:'],
      bullets: [
        'Use Wildhour unlawfully or to harm anyone.',
        'Try to get around usage limits, access other people’s data, or disrupt or probe our systems.',
        'Copy, resell or reverse-engineer the service except where the law allows.',
        'Use Ask Wildhour to generate harmful or unlawful content.',
      ],
    },
    {
      heading: 'Your content',
      paragraphs: [
        'Your check-ins and answers belong to you. You give us permission to store and process them only to run Wildhour for you, as described in our Privacy Policy.',
      ],
    },
    {
      heading: 'Our content',
      paragraphs: [
        'Wildhour’s software, design, text, illustrations and sounds belong to us or our licensors. We give you a personal, non-transferable licence to use the app for your own non-commercial purposes. If you send us feedback, we may use it without owing you anything.',
      ],
    },
    {
      heading: 'Changes and availability',
      paragraphs: [
        'Wildhour is currently free. We may change, pause or discontinue features, and we will try to give notice of significant changes. We may suspend accounts that break these terms. You can stop using Wildhour and delete your data or account at any time.',
      ],
    },
    {
      heading: 'Third-party services',
      paragraphs: [
        'Some features rely on third parties, such as sign-in providers, the AI service and app stores. Their own terms apply to your use of them.',
      ],
    },
    {
      heading: 'Disclaimers',
      paragraphs: [
        'To the extent the law allows, Wildhour is provided “as is” and “as available”, without warranties of any kind, including fitness for a particular purpose. We don’t promise that it will be uninterrupted, error-free or right for your situation.',
      ],
    },
    {
      heading: 'Limitation of liability',
      paragraphs: [
        'To the extent the law allows, we aren’t liable for indirect, incidental, special or consequential losses. Our total liability for any claim relating to Wildhour is limited to the greater of USD 50 or the amount you paid us in the 12 months before the claim. Nothing in these terms limits liability that cannot be limited by law, or takes away rights you have as a consumer.',
      ],
    },
    {
      heading: 'Governing law',
      paragraphs: [
        'These terms are governed by the laws of the place where the operator of Wildhour is established, without regard to conflict-of-law rules. If you are a consumer, you also keep the protection of the mandatory laws of the country where you live, and you may bring claims in your local courts.',
      ],
    },
    {
      heading: 'App store terms',
      paragraphs: [
        'If you downloaded Wildhour from the Apple App Store, these terms are between you and us, not Apple. Apple has no obligation to provide maintenance or support. If the app fails to meet any applicable warranty, you may tell Apple, which may refund the purchase price (if any). Apple has no other warranty obligation and is not responsible for claims relating to the app, including product-liability, legal-compliance, consumer-protection or intellectual-property claims. You confirm you are not in a country subject to a US Government embargo and are not on a US Government list of prohibited or restricted parties. Apple and its subsidiaries are third-party beneficiaries of these terms and may enforce them. Google Play’s terms apply to downloads from Google Play.',
      ],
    },
    {
      heading: 'Changes to these terms',
      paragraphs: [
        'We will update the date above when these terms change, and tell you in the app about significant changes. If you keep using Wildhour after a change takes effect, you accept the updated terms.',
      ],
    },
    {
      heading: 'Contact',
      paragraphs: [`Questions about these terms: ${E}.`],
    },
  ],
};

export const DELETE_ACCOUNT: LegalDoc = {
  id: 'delete-account',
  title: 'Delete your Wildhour account',
  shortTitle: 'Delete account',
  intro: `How to delete your Wildhour account and data. Wildhour is published by ${LEGAL.operator}.`,
  sections: [
    {
      heading: 'In the app (fastest)',
      bullets: [
        'Open Wildhour and go to Settings.',
        'Under Data & privacy, tap “Delete my account permanently”, then confirm.',
        'Your account and all data stored with it are deleted immediately, and you are signed out.',
      ],
      paragraphs: [
        'To keep your account but remove your data, tap “Delete my data” instead. This deletes your check-ins, results and quiz answers from your device and from your account.',
      ],
    },
    {
      heading: 'Without the app',
      paragraphs: [
        `Email ${E} from the email address on your account, with the subject “Delete my Wildhour account”. We will confirm the request and delete your account within 30 days, then email you to confirm it is done.`,
      ],
    },
    {
      heading: 'What gets deleted',
      bullets: [
        'Your account: email, name and sign-in details.',
        'Your quiz answers, rhythm results, check-ins, streaks and usage-limit counters.',
      ],
      paragraphs: [
        'Deleted data is removed from our live database straight away. It may remain in our provider’s encrypted backups for up to 30 days before being overwritten. We don’t keep any data after deletion unless the law requires it.',
        'Data stored only on your device without an account is removed when you tap “Delete my data” or delete the app.',
      ],
    },
  ],
};

export const SUPPORT: LegalDoc = {
  id: 'support',
  title: 'Wildhour support',
  shortTitle: 'Support',
  intro: `Need help? Email ${E} and we will get back to you, usually within a few working days.`,
  sections: [
    {
      heading: 'Common questions',
      bullets: [
        'Change my rhythm animal: open your plan, tap Back to reach your result, and choose Retake.',
        'Turn reminders on or off: Settings → Notifications.',
        'Turn sounds off: tap the speaker button, or go to Settings → Sound.',
        'Get a copy of my data: Settings → Data & privacy → Export my data.',
        'Delete my data or account: see the account deletion page.',
      ],
    },
    {
      heading: 'Important',
      paragraphs: [
        'Wildhour is a self-awareness tool, not a medical service. If you may be experiencing a medical or mental-health emergency, contact your local emergency services. In the US you can call or text 988.',
      ],
    },
  ],
};

export const LEGAL_DOCS: LegalDoc[] = [PRIVACY, TERMS, DELETE_ACCOUNT, SUPPORT];

export function legalUrl(id: LegalDocId): string {
  return `${LEGAL.webBase}/${id}/`;
}

export type LegalBlock = { kind: 'p'; text: string } | { kind: 'list'; items: string[] };

// Display order for a section: a lead-in paragraph ending in ":" introduces
// the list; otherwise the list comes first and paragraphs follow it.
export function sectionBlocks(s: LegalSection): LegalBlock[] {
  const paras = (s.paragraphs ?? []).map((text): LegalBlock => ({ kind: 'p', text }));
  const list: LegalBlock[] = s.bullets?.length ? [{ kind: 'list', items: s.bullets }] : [];
  if (paras.length && list.length && (s.paragraphs?.[0] ?? '').trim().endsWith(':')) {
    return [paras[0], ...list, ...paras.slice(1)];
  }
  return [...list, ...paras];
}
