import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { ARCHETYPES, TINTS } from '../data/archetypes';
import { RhythmResult } from '../logic/score';
import { DISCLAIMER_SHORT } from '../data/disclaimer';
import { F } from '../theme';
import AnimalEmblem from '../world/AnimalEmblem';
import { playSfx } from '../logic/sfx';
import { haptic } from '../logic/haptics';
import { useReducedMotion } from '../hooks';
import Scrim from '../components/Scrim';
import PressableScale from '../components/PressableScale';
import { blendFor, displayName } from '../data/blends';

export default function RevealScreen({
  result,
  onContinue,
  onRetake,
  onShare,
}: {
  result: RhythmResult;
  onContinue: () => void;
  onRetake: () => void;
  onShare: () => void;
}) {
  const a = ARCHETYPES[result.animal];
  const blend = blendFor(result);
  // The animal is the hero: as large as the screen comfortably allows.
  const { width } = useWindowDimensions();
  const size = Math.round(Math.min(320, Math.max(220, width - 72)));

  // Entrance: the content lifts and fades in, then the animal arrives on a
  // single heartbeat — one thump with a pink glow bloom.
  const enter = useRef(new Animated.Value(0)).current;
  const beat = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();

  // Once per reveal, not again when the reduced-motion setting resolves.
  useEffect(() => {
    playSfx('reveal');
    const buzz = setTimeout(() => haptic('success'), 160);
    return () => clearTimeout(buzz);
  }, []);

  useEffect(() => {
    if (reduced) {
      enter.stopAnimation();
      beat.stopAnimation();
      enter.setValue(1);
      beat.setValue(0);
      return;
    }
    Animated.spring(enter, {
      toValue: 1,
      friction: 7,
      tension: 50,
      useNativeDriver: true,
    }).start();

    Animated.sequence([
      Animated.delay(160),
      Animated.timing(beat, { toValue: 1, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(beat, { toValue: 0, duration: 260, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]).start();
  }, [enter, beat, reduced]);

  const lift = enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });
  const beatScale = beat.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] });
  const glowOpacity = beat.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.6] });

  return (
    <View style={styles.fill}>
      <Scrim shade="light" />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: enter, transform: [{ translateY: lift }] }}>
          <Text style={styles.kicker}>YOU’RE A</Text>

          {/* The moving 3D animal — the hero, arriving on a heartbeat. */}
          <Animated.View style={[styles.emblemWrap, { transform: [{ scale: beatScale }] }]}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.emblemGlow,
                {
                  width: size + 24,
                  height: size + 24,
                  borderRadius: (size + 24) / 2,
                  backgroundColor: a.accent,
                  opacity: glowOpacity,
                },
              ]}
            />
            <View
              style={[
                styles.emblem,
                { width: size, height: size, borderRadius: size / 2, borderColor: `${a.accent}55` },
              ]}
            >
              <AnimalEmblem
                animal={a.id}
                accent={TINTS[a.id]}
                emoji={a.emoji}
                bg={a.gradient[1]}
                distance={3.3}
                emojiSize={Math.round(size * 0.45)}
                style={StyleSheet.absoluteFill}
              />
            </View>
          </Animated.View>

          <Text style={styles.name}>{displayName(result)}</Text>
          {blend && (
            <Text style={[styles.streak, { color: a.accent }]}>
              {a.name} with a {ARCHETYPES[blend.streak].name} streak {ARCHETYPES[blend.streak].emoji}
            </Text>
          )}
          <Text style={styles.oneLiner}>{a.oneLiner}</Text>
          {blend && <Text style={styles.blendLine}>{blend.line}</Text>}
          <Text style={styles.reading}>{a.reading}</Text>

          {!!result.reasons?.length && (
            <View style={[styles.traitCard, styles.whyCard]}>
              <Text style={[styles.traitLabel, { color: a.accent }]}>WHY YOU GOT {a.name.toUpperCase()}</Text>
              {result.reasons.map((line) => {
                const [q, ans] = line.split(' → ');
                return (
                  <View key={line} style={styles.whyRow}>
                    <Text style={styles.whyQ}>{q}</Text>
                    <Text style={styles.whyA}>{ans}</Text>
                  </View>
                );
              })}
              {result.runnerUp && (
                <Text style={styles.whyNote}>
                  It was close: your answers also pointed toward {ARCHETYPES[result.runnerUp].name}.
                </Text>
              )}
            </View>
          )}

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

          <PressableScale style={styles.cta} onPress={onContinue}>
            <Text style={styles.ctaText}>See my rhythm  →</Text>
          </PressableScale>
          <Pressable style={[styles.shareBtn, { borderColor: `${a.accent}66` }]} onPress={onShare}>
            <Text style={[styles.shareText, { color: a.accent }]}>Share this  ↗</Text>
          </Pressable>
          <Pressable onPress={onRetake} hitSlop={12} accessibilityRole="button">
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
  fill: { flex: 1, backgroundColor: 'transparent' },
  body: { paddingHorizontal: 24, paddingTop: 70, paddingBottom: 96, alignItems: 'center' },
  kicker: {
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 4,
    fontSize: 12,
    fontFamily: F.mono,
    textAlign: 'center',
  },
  emblemWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: 18 },
  emblemGlow: { position: 'absolute' },
  emblem: {
    borderWidth: 1,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  name: { color: '#fff', fontSize: 44, fontFamily: F.display, textAlign: 'center' },
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
    backgroundColor: 'rgba(18,18,20,0.4)',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  traitLabel: { fontSize: 11, fontFamily: F.mono, letterSpacing: 1, marginBottom: 4 },
  traitText: { color: '#fff', fontSize: 14, lineHeight: 20 },
  blendLine: { color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 8 },
  streak: { fontSize: 15, fontWeight: '700', textAlign: 'center', marginTop: 2, marginBottom: 6 },
  whyCard: { borderColor: 'rgba(255,255,255,0.18)', marginTop: 18, marginBottom: 2 },
  whyRow: { marginTop: 8 },
  whyQ: { color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 17 },
  whyA: { color: '#fff', fontSize: 14, fontWeight: '700', lineHeight: 20 },
  whyNote: { color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 17, marginTop: 10 },
  chips: { flexDirection: 'row', gap: 10, marginTop: 18, width: '100%', maxWidth: 360 },
  chip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  chipLabel: { fontSize: 11, fontFamily: F.mono, letterSpacing: 0.5 },
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
  ctaText: { color: '#08080A', fontSize: 18, fontWeight: '700' },
  shareBtn: {
    borderWidth: 1,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    alignSelf: 'stretch',
    maxWidth: 360,
    width: '100%',
  },
  shareText: { fontSize: 15, fontWeight: '700' },
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
