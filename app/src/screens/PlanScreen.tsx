import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ARCHETYPES } from '../data/archetypes';
import { PLANS } from '../data/plans';
import { DISCLAIMER_FULL } from '../data/disclaimer';
import { RhythmResult } from '../logic/score';
import Rainforest from '../three/Rainforest';

export default function PlanScreen({
  result,
  onBack,
  onPulse,
  onLegal,
}: {
  result: RhythmResult;
  onBack: () => void;
  // Optional `seed` opens Pulse with a question already asked (e.g. "go deeper
  // on this tip"), so the tips are powered by the AI, not just static text.
  onPulse: (seed?: string) => void;
  onLegal: () => void;
}) {
  const a = ARCHETYPES[result.animal];
  const plan = PLANS[result.animal];

  return (
    <View style={styles.fill}>
      <Rainforest style={StyleSheet.absoluteFill} accent={a.accent} />
      <LinearGradient
        colors={[`${a.gradient[0]}cc`, 'rgba(8,21,17,0.78)', 'rgba(8,21,17,0.92)']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Your rhythm plan</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.animal}>
          {a.emoji}  {a.name}
        </Text>
        <Text style={styles.intro}>{plan.intro}</Text>

        <View style={styles.chips}>
          <Chip label="Peak" value={result.peak} accent={a.accent} />
          <Chip label="Crash" value={result.crash} accent={a.accent} />
          <Chip label="Recharge" value={result.recharge} accent={a.accent} />
        </View>

        <Text style={styles.section}>SLEEP WINDOW</Text>
        <View style={styles.sleepCard}>
          <View style={styles.sleepTimes}>
            <View style={styles.sleepCol}>
              <Text style={styles.sleepColLabel}>WIND DOWN</Text>
              <Text style={[styles.sleepTime, { color: a.accent }]}>{plan.sleep.bedtime}</Text>
            </View>
            <Text style={styles.sleepArrow}>→</Text>
            <View style={styles.sleepCol}>
              <Text style={styles.sleepColLabel}>WAKE</Text>
              <Text style={[styles.sleepTime, { color: a.accent }]}>{plan.sleep.wake}</Text>
            </View>
          </View>
          <Text style={styles.sleepNote}>{plan.sleep.note}</Text>
        </View>

        <Text style={styles.section}>TODAY’S FLOW</Text>
        <View style={styles.timeline}>
          {plan.flow.map((f, i) => (
            <View key={i} style={styles.flowRow}>
              <View style={styles.timeCol}>
                <Text style={[styles.time, { color: a.accent }]}>{f.time}</Text>
                {i < plan.flow.length - 1 && <View style={styles.connector} />}
              </View>
              <View style={styles.flowCard}>
                <Text style={styles.flowTitle}>{f.title}</Text>
                <Text style={styles.flowNote}>{f.note}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.section}>TIPS FOR A {a.name.toUpperCase()}</Text>
        <Text style={styles.tipsHint}>Tap a tip to go deeper with Pulse.</Text>
        {plan.tips.map((t, i) => (
          <Pressable
            key={i}
            style={styles.tipCard}
            onPress={() =>
              onPulse(
                `As a ${a.name}, give me a deeper, personal tip on ${t.label.toLowerCase()} — building on this: "${t.text}". One concrete thing I can do today.`
              )
            }
          >
            <View style={styles.tipHead}>
              <Text style={[styles.tipLabel, { color: a.accent }]}>{t.label}</Text>
              <Text style={[styles.tipGo, { color: a.accent }]}>Ask Pulse ›</Text>
            </View>
            <Text style={styles.tipText}>{t.text}</Text>
          </Pressable>
        ))}

        <Pressable style={[styles.cta, { backgroundColor: a.accent }]} onPress={() => onPulse()}>
          <Text style={styles.ctaText}>Talk to Pulse  →</Text>
        </Pressable>

        <Text style={styles.disclaimer}>{DISCLAIMER_FULL}</Text>
        <Pressable onPress={onLegal} hitSlop={10}>
          <Text style={styles.legalLink}>Terms & Privacy</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Chip({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <View style={styles.chip}>
      <Text style={[styles.chipLabel, { color: accent }]}>{label}</Text>
      <Text style={styles.chipValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#081511' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  back: { color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: '600', width: 48 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  body: { paddingHorizontal: 22, paddingBottom: 40 },
  animal: { color: '#fff', fontSize: 30, fontWeight: '900', marginTop: 8 },
  intro: { color: 'rgba(255,255,255,0.82)', fontSize: 15, lineHeight: 22, marginTop: 8 },
  chips: { flexDirection: 'row', gap: 10, marginTop: 18 },
  chip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  chipLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  chipValue: { color: '#fff', fontSize: 13, fontWeight: '600', marginTop: 4, textAlign: 'center' },
  section: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 30,
    marginBottom: 14,
  },
  sleepCard: {
    backgroundColor: 'rgba(14,20,36,0.5)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
  },
  sleepTimes: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18 },
  sleepCol: { alignItems: 'center', minWidth: 92 },
  sleepColLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  sleepTime: { fontSize: 26, fontWeight: '900', marginTop: 4 },
  sleepArrow: { color: 'rgba(255,255,255,0.4)', fontSize: 22, fontWeight: '700' },
  sleepNote: { color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 20, marginTop: 14, textAlign: 'center' },
  timeline: {},
  flowRow: { flexDirection: 'row', gap: 14 },
  timeCol: { alignItems: 'center', width: 52 },
  time: { fontSize: 13, fontWeight: '800' },
  connector: { flex: 1, width: 2, backgroundColor: 'rgba(255,255,255,0.15)', marginTop: 4 },
  flowCard: {
    flex: 1,
    backgroundColor: 'rgba(14,20,36,0.45)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  flowTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  flowNote: { color: 'rgba(255,255,255,0.78)', fontSize: 14, lineHeight: 20, marginTop: 4 },
  tipCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  tipsHint: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: -6, marginBottom: 14 },
  tipHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  tipLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  tipGo: { fontSize: 12, fontWeight: '700' },
  tipText: { color: '#fff', fontSize: 15, lineHeight: 22 },
  cta: {
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 26,
  },
  ctaText: { color: '#0E1424', fontSize: 18, fontWeight: '700' },
  disclaimer: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 20,
  },
  legalLink: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginTop: 12,
  },
});
