import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimalId, TINTS } from '../data/archetypes';

const SCENES: Record<AnimalId, { glow: string; mote: string; horizon: string }> = {
  dolphin: { glow: '#4FC3F7', mote: '#BDEBFF', horizon: '#082538' },
  wolf: { glow: '#9B6BFF', mote: '#D9C8FF', horizon: '#17112B' },
  bear: { glow: '#FF9F45', mote: '#FFD3A3', horizon: '#2B1A0E' },
  hummingbird: { glow: '#3DDC97', mote: '#B8F5D8', horizon: '#0A261D' },
  fox: { glow: '#FF6B3D', mote: '#FFD0C0', horizon: '#2A120C' },
  octopus: { glow: '#FF5DA2', mote: '#FFC3DD', horizon: '#29101E' },
};

export default function ImmersiveScene({
  animal,
  style,
}: {
  animal: AnimalId;
  style?: StyleProp<ViewStyle>;
}) {
  const scene = SCENES[animal];
  const drift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 12000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 12000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [drift]);

  const nearX = drift.interpolate({ inputRange: [0, 1], outputRange: [-8, 10] });
  const farX = drift.interpolate({ inputRange: [0, 1], outputRange: [5, -5] });

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.clip, style]}>
      <LinearGradient colors={['#08080A', scene.horizon, '#08080A']} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.farGlow, { backgroundColor: scene.glow, transform: [{ translateX: farX }] }]} />
      <Animated.View style={[styles.orb, styles.o1, { backgroundColor: scene.mote, transform: [{ translateX: nearX }] }]} />
      <Animated.View style={[styles.orb, styles.o2, { backgroundColor: TINTS[animal], transform: [{ translateX: farX }] }]} />
      <Animated.View style={[styles.orb, styles.o3, { backgroundColor: scene.mote, transform: [{ translateX: nearX }] }]} />
      <View style={styles.vignette} />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden', backgroundColor: '#08080A' },
  farGlow: { position: 'absolute', width: 380, height: 380, borderRadius: 190, opacity: 0.13, top: '18%', left: '8%' },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.18 },
  o1: { width: 7, height: 7, top: '23%', left: '20%' },
  o2: { width: 11, height: 11, top: '47%', right: '16%', opacity: 0.12 },
  o3: { width: 5, height: 5, top: '68%', left: '63%' },
  vignette: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.08)' },
});
