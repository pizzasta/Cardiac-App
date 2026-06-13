import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Rainforest from '../three/Rainforest';
import { DISCLAIMER_SHORT } from '../data/disclaimer';

export default function HookScreen({
  onStart,
  onLegal,
  onSignIn,
  onSettings,
}: {
  onStart: () => void;
  onLegal: () => void;
  onSignIn: () => void;
  onSettings: () => void;
}) {
  return (
    <View style={styles.fill}>
      {/* Immersive 3D rainforest backdrop (native) / layered fallback (web). */}
      <Rainforest style={StyleSheet.absoluteFill} />

      {/* Dark scrim so the title stays legible over the canopy. */}
      <LinearGradient
        colors={['rgba(8,21,17,0.1)', 'rgba(8,21,17,0.55)', 'rgba(8,21,17,0.9)']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <View style={styles.center}>
          <Text style={styles.kicker}>CIRCADIA</Text>
          <Text style={styles.title}>What’s your{'\n'}rhythm animal?</Text>
          <Text style={styles.sub}>
            A 60-second read of how your energy actually works.
          </Text>
        </View>

        <Pressable style={styles.cta} onPress={onStart}>
          <Text style={styles.ctaText}>Find out  →</Text>
        </Pressable>
        <Text style={styles.fineprint}>
          No signup. Just curiosity. {DISCLAIMER_SHORT}
        </Text>
        <View style={styles.linkRow}>
          <Pressable onPress={onSignIn} hitSlop={10}>
            <Text style={styles.legalLink}>Sign in</Text>
          </Pressable>
          <Text style={styles.linkDot}>·</Text>
          <Pressable onPress={onSettings} hitSlop={10}>
            <Text style={styles.legalLink}>Settings</Text>
          </Pressable>
          <Text style={styles.linkDot}>·</Text>
          <Pressable onPress={onLegal} hitSlop={10}>
            <Text style={styles.legalLink}>Terms</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#081511' },
  content: { flex: 1, paddingHorizontal: 28, paddingBottom: 44 },
  center: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40 },
  kicker: {
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 6,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 18,
  },
  title: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 46,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 12,
  },
  sub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 18,
    maxWidth: 280,
    lineHeight: 23,
  },
  cta: {
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
  },
  ctaText: { color: '#0E1424', fontSize: 18, fontWeight: '700' },
  fineprint: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 14,
    fontSize: 13,
    lineHeight: 18,
  },
  linkRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 8 },
  linkDot: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  legalLink: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
