import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PulseLine from './PulseLine';
import { T } from '../theme';

// The app-wide backdrop: black canvas, charcoal gradient, a soft pink/red glow,
// and the living ECG pulse line. Replaces the old rainforest visuals (the
// rainforest *sound* lives on separately).

export default function Atmosphere({
  accent = T.accent,
  style,
  pulse = true,
}: {
  accent?: string;
  style?: StyleProp<ViewStyle>;
  pulse?: boolean;
}) {
  return (
    <View style={[StyleSheet.absoluteFill, styles.base, style]}>
      <LinearGradient colors={T.bgGradient} style={StyleSheet.absoluteFill} />
      {/* soft pulse glow */}
      <View style={[styles.glow, { backgroundColor: accent }]} />
      {pulse && <PulseLine height={140} color={accent} style={styles.pulse} />}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: T.bg, overflow: 'hidden' },
  glow: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.14,
  },
  pulse: { position: 'absolute', top: '42%', left: 0, right: 0, opacity: 0.55 },
});
