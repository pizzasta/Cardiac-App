import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { AnimalId } from '../data/archetypes';

// Web fallback for the native 3D emblem: the archetype emoji, animated with a
// per-animal motion signature plus a breathing accent glow. No Three.js, so the
// web/Pages bundle stays light.

const MOTION: Record<AnimalId, { dur: number; rotate: string; floatY: number }> = {
  dolphin: { dur: 3200, rotate: '8deg', floatY: 14 },
  wolf: { dur: 2600, rotate: '6deg', floatY: 10 },
  bear: { dur: 4200, rotate: '4deg', floatY: 8 },
  hummingbird: { dur: 900, rotate: '12deg', floatY: 18 },
  fox: { dur: 2400, rotate: '10deg', floatY: 12 },
  octopus: { dur: 3000, rotate: '14deg', floatY: 16 },
};

export default function AnimalEmblem({
  animal,
  accent,
  emoji = '✦',
  bg = '#0b1a16',
  style,
}: {
  animal: AnimalId;
  accent: string;
  emoji?: string;
  bg?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useRef(new Animated.Value(0)).current;
  const m = MOTION[animal];

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: m.dur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: m.dur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [t, m.dur]);

  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [m.floatY, -m.floatY] });
  const rotate = t.interpolate({ inputRange: [0, 1], outputRange: [`-${m.rotate}`, m.rotate] });
  const glow = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 0.6, 0.3] });
  const glowScale = t.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] });

  return (
    <View style={[styles.wrap, { backgroundColor: bg }, style]}>
      <Animated.View
        style={[styles.glow, { backgroundColor: accent, opacity: glow, transform: [{ scale: glowScale }] }]}
      />
      <Animated.Text style={[styles.emoji, { transform: [{ translateY }, { rotate }] }]}>
        {emoji}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  glow: { position: 'absolute', width: 140, height: 140, borderRadius: 70 },
  emoji: { fontSize: 96 },
});
