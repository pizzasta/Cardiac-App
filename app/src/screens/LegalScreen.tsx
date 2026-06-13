import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DISCLAIMER_FULL } from '../data/disclaimer';

// Starter Terms & Privacy. This is a plain-language template to ship the
// not-medical-advice footprint — have it reviewed by counsel before a real
// launch and fill in the real entity, contact, and data specifics.

const UPDATED = 'June 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>{title}</Text>
      {children}
    </View>
  );
}

export default function LegalScreen({ onClose }: { onClose: () => void }) {
  return (
    <View style={styles.fill}>
      <LinearGradient colors={['#0E1424', '#10231d', '#081511']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Terms & Privacy</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.updated}>Last updated {UPDATED}</Text>

        <Section title="Not medical advice">
          <Text style={styles.p}>{DISCLAIMER_FULL}</Text>
          <Text style={styles.p}>
            If you may be experiencing a medical or mental-health emergency, contact your local
            emergency services. Circadia is not a substitute for professional care.
          </Text>
        </Section>

        <Section title="Using Circadia">
          <Text style={styles.p}>
            Circadia gives you a rhythm archetype, a daily plan, and an AI companion based on a short
            quiz. It’s for personal self-awareness. Archetypes, plans, and tips are general guidance,
            not instructions tailored to your health.
          </Text>
        </Section>

        <Section title="Your data">
          <Text style={styles.p}>
            Your quiz answers are used to generate your archetype and plan. In this version they live
            on your device. If you enable the AI companion, the messages you send are transmitted to
            our AI provider (Anthropic) to generate a reply — please don’t share sensitive medical
            details there.
          </Text>
          <Text style={styles.p}>
            We don’t sell your data. You can clear it any time by retaking the quiz or removing the app.
          </Text>
        </Section>

        <Section title="Pulse (the AI companion)">
          <Text style={styles.p}>
            Pulse’s responses are AI-generated. They can be wrong or incomplete and are not
            professional, medical, or mental-health advice. Use your own judgment, and check anything
            important with a qualified professional.
          </Text>
        </Section>

        <Section title="Contact">
          <Text style={styles.p}>Questions? Reach us at support@circadia.app.</Text>
        </Section>

        <Text style={styles.footer}>
          This is an early draft and may change as Circadia evolves.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, backgroundColor: '#081511' },
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
  body: { paddingHorizontal: 24, paddingBottom: 48 },
  updated: { color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 8, marginBottom: 8 },
  section: { marginTop: 22 },
  h2: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 8 },
  p: { color: 'rgba(255,255,255,0.8)', fontSize: 15, lineHeight: 23, marginBottom: 10 },
  footer: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 28, textAlign: 'center' },
});
