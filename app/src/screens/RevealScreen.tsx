import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ARCHETYPES } from '../data/archetypes';
import { RhythmResult } from '../logic/score';

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

  // Entrance: the card "breathes" to life — the most polished moment.
  const enter = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0)).current;

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

    Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: 2800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [enter, breath]);

  const cardScale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  const glowScale = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const glowOpacity = breath.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.55] });

  return (
    <LinearGradient colors={a.gradient} style={styles.fill}>
      <Animated.View
        style={[
          styles.card,
          { opacity: enter, transform: [{ scale: cardScale }] },
        ]}
      >
        <Text style={styles.kicker}>YOU’RE A</Text>

        <View style={styles.emojiWrap}>
          <Animated.View
            style={[
              styles.glow,
              { backgroundColor: a.accent, opacity: glowOpacity, transform: [{ scale: glowScale }] },
            ]}
          />
          <Text style={styles.emoji}>{a.emoji}</Text>
        </View>

        <Text style={styles.name}>{a.name}</Text>
        <Text style={styles.oneLiner}>{a.oneLiner}</Text>
        <Text style={styles.reading}>{a.reading}</Text>

        <View style={styles.chips}>
          <Chip label="Peak focus" value={result.peak} accent={a.accent} />
          <Chip label="Crash risk" value={result.crash} accent={a.accent} />
          <Chip label="Recharge" value={result.recharge} accent={a.accent} />
        </View>
      </Animated.View>

      <Pressable style={styles.cta} onPress={onContinue}>
        <Text style={styles.ctaText}>See my rhythm  →</Text>
      </Pressable>
      <Pressable onPress={onRetake} hitSlop={12}>
        <Text style={styles.retake}>Retake the quiz</Text>
      </Pressable>
    </LinearGradient>
  );
}

function Chip({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <View style={styles.chip}>
      <Text style={[styles.chipLabel, { color: accent }]}>{label}</Text>
      <Text style={styles.chipValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 },
  card: {
    flex: 1,
    backgroundColor: 'rgba(14,20,36,0.45)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    padding: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: {
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 5,
    fontSize: 13,
    fontWeight: '700',
  },
  emojiWrap: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  glow: { position: 'absolute', width: 150, height: 150, borderRadius: 75 },
  emoji: { fontSize: 84 },
  name: { color: '#fff', fontSize: 44, fontWeight: '900' },
  oneLiner: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  reading: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 16,
    maxWidth: 320,
  },
  chips: { flexDirection: 'row', gap: 10, marginTop: 26 },
  chip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  chipLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  chipValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  cta: {
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 22,
  },
  ctaText: { color: '#0E1424', fontSize: 18, fontWeight: '700' },
  retake: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
    fontWeight: '600',
  },
});
