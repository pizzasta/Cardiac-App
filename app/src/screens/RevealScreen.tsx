import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ARCHETYPES } from '../data/archetypes';
import { RhythmResult } from '../logic/score';
import { DISCLAIMER_SHORT } from '../data/disclaimer';
import AnimalEmblem from '../three/AnimalEmblem';

export default function RevealScreen({
  result,
  onContinue,
  onRetake,
}: {
  result: RhythmResult;
  onContinue: () => void;
  onRetake: () => void;
}) {
  const a = ARCHETYPES[result.animal];

  // Entrance: the content lifts and fades in as the animal comes to life.
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Animated.spring(enter, {
      toValue: 1,
      friction: 7,
      tension: 50,
      useNativeDriver: true,
    }).start();
  }, [enter]);

  const lift = enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });

  return (
    <View style={styles.fill}>
      <LinearGradient colors={a.gradient} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(8,21,17,0.2)', 'rgba(8,21,17,0.55)']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: enter, transform: [{ translateY: lift }] }}>
          <Text style={styles.kicker}>YOU’RE A</Text>

          {/* The moving 3D animal — the hero of the reveal. */}
          <View style={[styles.emblem, { borderColor: `${a.accent}55` }]}>
            <AnimalEmblem
              animal={a.id}
              accent={a.accent}
              emoji={a.emoji}
              bg={a.gradient[1]}
              style={StyleSheet.absoluteFill}
            />
          </View>

          <Text style={styles.name}>{a.name}</Text>
          <Text style={styles.oneLiner}>{a.oneLiner}</Text>
          <Text style={styles.reading}>{a.reading}</Text>

          <View style={styles.traits}>
            <View style={[styles.traitCard, { borderColor: `${a.accent}44` }]}>
              <Text style={[styles.traitLabel, { color: a.accent }]}>AT YOUR BEST</Text>
              <Text style={styles.traitText}>{a.strength}</Text>
            </View>
            <View style={[styles.traitCard, { borderColor: 'rgba(255,255,255,0.18)' }]}>
              <Text style={[styles.traitLabel, { color: 'rgba(255,255,255,0.7)' }]}>WATCH FOR</Text>
              <Text style={styles.traitText}>{a.watchOut}</Text>
            </View>
          </View>

          <View style={styles.chips}>
            <Chip label="Peak focus" value={result.peak} accent={a.accent} />
            <Chip label="Crash risk" value={result.crash} accent={a.accent} />
            <Chip label="Recharge" value={result.recharge} accent={a.accent} />
          </View>

          <Pressable style={styles.cta} onPress={onContinue}>
            <Text style={styles.ctaText}>See my rhythm  →</Text>
          </Pressable>
          <Pressable onPress={onRetake} hitSlop={12}>
            <Text style={styles.retake}>Retake the quiz</Text>
          </Pressable>
          <Text style={styles.disclaimer}>{DISCLAIMER_SHORT}</Text>
        </Animated.View>
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
  body: { paddingHorizontal: 24, paddingTop: 70, paddingBottom: 44, alignItems: 'center' },
  kicker: {
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 5,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  emblem: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    overflow: 'hidden',
    alignSelf: 'center',
    marginVertical: 18,
  },
  name: { color: '#fff', fontSize: 44, fontWeight: '900', textAlign: 'center' },
  oneLiner: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  reading: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 16,
    maxWidth: 340,
    alignSelf: 'center',
  },
  traits: { width: '100%', maxWidth: 360, gap: 10, marginTop: 22 },
  traitCard: {
    backgroundColor: 'rgba(14,20,36,0.4)',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  traitLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  traitText: { color: '#fff', fontSize: 14, lineHeight: 20 },
  chips: { flexDirection: 'row', gap: 10, marginTop: 18, width: '100%', maxWidth: 360 },
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
  cta: {
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 26,
    alignSelf: 'stretch',
    maxWidth: 360,
    width: '100%',
  },
  ctaText: { color: '#0E1424', fontSize: 18, fontWeight: '700' },
  retake: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
    fontWeight: '600',
  },
  disclaimer: {
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 12,
  },
});
