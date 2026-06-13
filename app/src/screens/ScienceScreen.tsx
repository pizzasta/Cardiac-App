import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SCIENCE } from '../data/science';

// "The science" — verified, cited reasons circadian rhythm matters. Each card
// links to its source so claims are checkable, not vibes.

export default function ScienceScreen({
  accent = '#FF2E7E',
  onClose,
}: {
  accent?: string;
  onClose: () => void;
}) {
  return (
    <View style={styles.fill}>
      <LinearGradient colors={['#08080A', '#141016', '#08080A']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>The science</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.intro}>
          Why working with your rhythm helps — drawn from peer-reviewed and public-health research.
          Tap any card to read the source.
        </Text>

        {SCIENCE.map((n, i) => (
          <Pressable key={i} style={styles.card} onPress={() => Linking.openURL(n.sourceUrl)}>
            <Text style={[styles.cardTitle, { color: accent }]}>{n.title}</Text>
            <Text style={styles.cardBody}>{n.body}</Text>
            <Text style={[styles.source, { color: accent }]}>{n.sourceLabel}  ↗</Text>
          </Pressable>
        ))}

        <Text style={styles.footer}>
          These are research findings, not promises — many are population-level associations, and
          individual results vary. Circadia is for self-awareness, not medical advice.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, backgroundColor: '#08080A' },
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
  body: { paddingHorizontal: 22, paddingBottom: 44 },
  intro: { color: 'rgba(255,255,255,0.78)', fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 18 },
  card: {
    backgroundColor: 'rgba(18,18,20,0.5)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  cardBody: { color: '#fff', fontSize: 15, lineHeight: 22 },
  source: { fontSize: 13, fontWeight: '600', marginTop: 12 },
  footer: { color: 'rgba(255,255,255,0.45)', fontSize: 12, lineHeight: 18, marginTop: 18, textAlign: 'center' },
});
