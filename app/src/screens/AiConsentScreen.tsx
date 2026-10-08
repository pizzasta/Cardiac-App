// Shown once before the first Ask Wildhour request: says plainly which data
// goes to the third-party AI service, and asks permission (App Store 5.1.2).
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTopInset } from '../hooks';
import { F, T } from '../theme';

export default function AiConsentScreen({
  accent,
  onAllow,
  onDecline,
  onPrivacy,
}: {
  accent: string;
  onAllow: () => void;
  onDecline: () => void;
  onPrivacy: () => void;
}) {
  const topInset = useTopInset();
  return (
    <View style={styles.fill}>
      <LinearGradient colors={T.bgGradient} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={[styles.body, { paddingTop: topInset + 24 }]}>
        <Text style={[styles.kicker, { color: accent }]}>BEFORE YOU ASK</Text>
        <Text style={styles.title}>Ask Wildhour uses an AI service</Text>
        <Text style={styles.p}>
          Answers come from an AI model made by Anthropic. To answer you, Wildhour sends it:
        </Text>
        {[
          'Your question and the conversation so far',
          'Your rhythm profile and quiz answers',
          'A summary of your recent check-ins, when you ask about them',
        ].map((item) => (
          <View key={item} style={styles.row}>
            <Text style={[styles.dot, { color: accent }]}>•</Text>
            <Text style={styles.item}>{item}</Text>
          </View>
        ))}
        <Text style={styles.p}>
          It isn’t used to train AI models, and nothing is sent until you allow it. Answers can be wrong
          and aren’t medical advice. You can change this any time in Settings.
        </Text>
        <Pressable onPress={onPrivacy} hitSlop={8}>
          <Text style={[styles.link, { color: accent }]}>Read the Privacy Policy</Text>
        </Pressable>

        <Pressable style={[styles.cta, { backgroundColor: accent }]} onPress={onAllow}>
          <Text style={styles.ctaText}>Allow and continue</Text>
        </Pressable>
        <Pressable style={styles.ghost} onPress={onDecline}>
          <Text style={styles.ghostText}>Not now</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, backgroundColor: T.bg },
  body: { paddingHorizontal: 24, paddingBottom: 48 },
  kicker: { fontFamily: F.mono, fontSize: 12, letterSpacing: 1.5 },
  title: { color: '#fff', fontFamily: F.display, fontSize: 26, marginTop: 10, marginBottom: 14 },
  p: { color: 'rgba(255,255,255,0.8)', fontSize: 15, lineHeight: 22, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 8, paddingLeft: 4 },
  dot: { fontSize: 15, lineHeight: 22 },
  item: { color: '#fff', fontSize: 15, lineHeight: 22, flex: 1 },
  link: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  cta: { borderRadius: 26, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
  ctaText: { color: '#08080A', fontSize: 16, fontWeight: '800' },
  ghost: { borderRadius: 26, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  ghostText: { color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: '700' },
});
