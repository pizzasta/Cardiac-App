import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Rainforest from '../three/Rainforest';
import { ARCHETYPES } from '../data/archetypes';
import { DISCLAIMER_SHORT } from '../data/disclaimer';

const ACCENT = '#2BD9C8';

const STEPS = [
  { n: '1', t: 'Answer 8 questions', s: 'Sixty seconds. No account, no fluff.' },
  { n: '2', t: 'Meet your rhythm animal', s: 'How your nervous system actually runs.' },
  { n: '3', t: 'Get your daily plan', s: 'Your real peaks, crashes, and wind-down.' },
];

const FEATURES = [
  { t: 'Your rhythm animal', s: 'Eight questions decode how your nervous system runs.' },
  { t: 'A plan that fits your wiring', s: 'Your real peak, crash, and wind-down — as a daily flow.' },
  { t: 'Pulse, your AI companion', s: 'Ask it anything. It knows your patterns.' },
  { t: 'Sleep on your schedule', s: 'A wind-down and wake window tuned to your chronotype.' },
  { t: 'Nudges that land', s: 'Reminders timed to your rhythm, not the clock.' },
  { t: 'Backed by the science', s: 'Every recommendation traces to real research.' },
];

const STAY = [
  'It learns you — switching elsewhere means losing that.',
  'It’s specific: “you crash at 2:14pm” beats “drink more water.”',
  'It catches the dip before you do.',
  'It sounds like a person you’d actually listen to.',
  'Your rhythm changes, and so does your plan.',
];

export default function LandingScreen({
  onStart,
  onSignIn,
  onSettings,
  onLegal,
  onScience,
}: {
  onStart: () => void;
  onSignIn: () => void;
  onSettings: () => void;
  onLegal: () => void;
  onScience: () => void;
}) {
  const { height } = useWindowDimensions();
  const animals = Object.values(ARCHETYPES);

  const Cta = ({ label = 'Find your rhythm' }: { label?: string }) => (
    <Pressable style={styles.cta} onPress={onStart}>
      <Text style={styles.ctaText}>{label}  →</Text>
    </Pressable>
  );

  return (
    <View style={styles.fill}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* HERO */}
        <View style={[styles.hero, { minHeight: Math.max(560, height) }]}>
          <Rainforest style={StyleSheet.absoluteFill} accent={ACCENT} />
          <LinearGradient
            colors={['rgba(8,21,17,0.15)', 'rgba(8,21,17,0.55)', 'rgba(8,21,17,0.95)']}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.topLinks}>
            <Pressable onPress={onSignIn} hitSlop={8}>
              <Text style={styles.topLink}>Sign in</Text>
            </Pressable>
            <Text style={styles.topDot}>·</Text>
            <Pressable onPress={onSettings} hitSlop={8}>
              <Text style={styles.topLink}>Settings</Text>
            </Pressable>
          </View>

          <View style={styles.heroBody}>
            <Text style={styles.kicker}>CIRCADIA</Text>
            <Text style={styles.h1}>You’re not tired.{'\n'}You’re out of rhythm.</Text>
            <Text style={styles.sub}>
              A 60-second read of how your energy, stress, and sleep actually work — then a daily
              plan built around it.
            </Text>
            <Cta />
            <Text style={styles.fine}>No signup — just curiosity.</Text>
          </View>
        </View>

        {/* HOOK LINE */}
        <Section>
          <Text style={styles.bigLine}>Most people are living on the wrong schedule.</Text>
          <Text style={styles.bigLineSub}>Find yours.</Text>
          <Cta label="What’s your rhythm animal?" />
        </Section>

        {/* HOW IT WORKS */}
        <Section label="HOW IT WORKS">
          {STEPS.map((s) => (
            <View key={s.n} style={styles.step}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{s.n}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{s.t}</Text>
                <Text style={styles.stepSub}>{s.s}</Text>
              </View>
            </View>
          ))}
        </Section>

        {/* REVEAL PREVIEW */}
        <Section label="SIX RHYTHM ANIMALS">
          <Text style={styles.h2}>Which one are you?</Text>
          <View style={styles.animals}>
            {animals.map((a) => (
              <View key={a.id} style={styles.animalChip}>
                <Text style={styles.animalEmoji}>{a.emoji}</Text>
                <Text style={styles.animalName}>{a.name}</Text>
              </View>
            ))}
          </View>
          <Cta />
        </Section>

        {/* FEATURES */}
        <Section label="WHAT YOU GET">
          {FEATURES.map((f) => (
            <View key={f.t} style={styles.featCard}>
              <Text style={styles.featTitle}>{f.t}</Text>
              <Text style={styles.featSub}>{f.s}</Text>
            </View>
          ))}
        </Section>

        {/* PULSE SPOTLIGHT */}
        <Section label="MEET PULSE">
          <Text style={styles.h2}>An AI that actually knows you.</Text>
          <View style={[styles.bubble, styles.userBubble]}>
            <Text style={styles.userText}>when should I work out today?</Text>
          </View>
          <View style={[styles.bubble, styles.pulseBubble]}>
            <Text style={styles.pulseText}>
              Not this morning — you’re still catching up on sleep. Around 5pm your energy lifts and
              movement will help you sleep tonight. Skip it if today felt like too much; that’s valid too.
            </Text>
          </View>
        </Section>

        {/* WHY PEOPLE STAY */}
        <Section label="WHY PEOPLE STAY">
          <Text style={styles.h2}>It gets more accurate the longer you use it.</Text>
          {STAY.map((s, i) => (
            <View key={i} style={styles.stayRow}>
              <Text style={styles.stayDot}>◆</Text>
              <Text style={styles.stayText}>{s}</Text>
            </View>
          ))}
        </Section>

        {/* SCIENCE STRIP */}
        <Section>
          <Text style={styles.scienceLine}>Backed by real circadian research — not vibes.</Text>
          <Pressable onPress={onScience} hitSlop={8}>
            <Text style={styles.scienceLink}>Read the science  ↗</Text>
          </Pressable>
        </Section>

        {/* FINAL CTA */}
        <Section>
          <Text style={styles.h1b}>Find your rhythm.</Text>
          <Text style={styles.sub}>60 seconds. Free. No signup to start.</Text>
          <Cta />
        </Section>

        {/* FOOTER */}
        <View style={styles.footer}>
          <View style={styles.topLinks}>
            <Pressable onPress={onLegal} hitSlop={8}>
              <Text style={styles.topLink}>Terms & Privacy</Text>
            </Pressable>
            <Text style={styles.topDot}>·</Text>
            <Pressable onPress={onSettings} hitSlop={8}>
              <Text style={styles.topLink}>Settings</Text>
            </Pressable>
          </View>
          <Text style={styles.footNote}>{DISCLAIMER_SHORT}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Section({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      {label ? <Text style={styles.sectionLabel}>{label}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#081511' },
  scroll: { paddingBottom: 40 },

  hero: { paddingHorizontal: 28, justifyContent: 'flex-end', paddingBottom: 56 },
  topLinks: {
    position: 'absolute',
    top: 54,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topLink: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  topDot: { color: 'rgba(255,255,255,0.4)' },
  heroBody: {},
  kicker: { color: 'rgba(255,255,255,0.8)', letterSpacing: 6, fontSize: 13, fontWeight: '700', marginBottom: 16 },
  h1: { color: '#fff', fontSize: 40, fontWeight: '900', lineHeight: 46 },
  h1b: { color: '#fff', fontSize: 34, fontWeight: '900', textAlign: 'center' },
  sub: { color: 'rgba(255,255,255,0.82)', fontSize: 16, lineHeight: 24, marginTop: 16, textAlign: 'center' },
  fine: { color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center', marginTop: 12 },

  section: { paddingHorizontal: 28, paddingVertical: 30, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  sectionLabel: { color: ACCENT, fontSize: 12, fontWeight: '800', letterSpacing: 1.5, marginBottom: 14 },

  bigLine: { color: '#fff', fontSize: 28, fontWeight: '800', lineHeight: 34 },
  bigLineSub: { color: 'rgba(255,255,255,0.7)', fontSize: 18, marginTop: 6, marginBottom: 18 },

  step: { flexDirection: 'row', gap: 14, marginBottom: 18, alignItems: 'center' },
  stepNum: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(43,217,200,0.18)', borderColor: ACCENT, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: ACCENT, fontSize: 16, fontWeight: '800' },
  stepTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  stepSub: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 2 },

  h2: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 16 },
  animals: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  animalChip: { width: '31%', backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  animalEmoji: { fontSize: 28 },
  animalName: { color: '#fff', fontSize: 13, fontWeight: '600', marginTop: 6 },

  featCard: { backgroundColor: 'rgba(14,20,36,0.5)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 10 },
  featTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  featSub: { color: 'rgba(255,255,255,0.72)', fontSize: 14, lineHeight: 20, marginTop: 4 },

  bubble: { maxWidth: '88%', borderRadius: 18, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 10 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: 'rgba(255,255,255,0.92)' },
  pulseBubble: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.14)', borderWidth: 1 },
  userText: { color: '#0E1424', fontSize: 15, fontWeight: '600' },
  pulseText: { color: '#fff', fontSize: 15, lineHeight: 22 },

  stayRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  stayDot: { color: ACCENT, fontSize: 12, marginTop: 4 },
  stayText: { flex: 1, color: '#fff', fontSize: 15, lineHeight: 22 },

  scienceLine: { color: '#fff', fontSize: 17, fontWeight: '600', lineHeight: 24 },
  scienceLink: { color: ACCENT, fontSize: 15, fontWeight: '700', marginTop: 10 },

  cta: { backgroundColor: '#fff', borderRadius: 30, paddingVertical: 17, alignItems: 'center', marginTop: 20, alignSelf: 'center', width: '100%', maxWidth: 380 },
  ctaText: { color: '#0E1424', fontSize: 17, fontWeight: '700' },

  footer: { paddingHorizontal: 28, paddingTop: 28, alignItems: 'center', gap: 12 },
  footNote: { color: 'rgba(255,255,255,0.45)', fontSize: 12, textAlign: 'center' },
});
