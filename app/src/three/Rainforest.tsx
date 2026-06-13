import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Web fallback for the native Three.js rainforest. The real 3D scene lives in
// Rainforest.native.tsx (expo-gl); on web we evoke the same dusk-rainforest
// mood with layered gradients, soft canopy silhouettes, and drifting spores —
// no Three.js, so the web/Pages bundle stays light.

function Spore({ delay, left, size }: { delay: number; left: string; size: number }) {
  const rise = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rise, {
        toValue: 1,
        duration: 9000 + delay,
        delay,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [rise, delay]);

  const translateY = rise.interpolate({ inputRange: [0, 1], outputRange: [40, -420] });
  const opacity = rise.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 0.9, 0.9, 0] });

  return (
    <Animated.View
      style={[
        styles.spore,
        { left: left as any, width: size, height: size, borderRadius: size / 2, opacity, transform: [{ translateY }] },
      ]}
    />
  );
}

export default function Rainforest({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.fill, style]}>
      <LinearGradient colors={['#0c2018', '#10392c', '#081511']} style={StyleSheet.absoluteFill} />

      {/* layered canopy silhouettes — far to near */}
      <View style={[styles.canopy, { top: -40, opacity: 0.35, backgroundColor: '#13402f' }]} />
      <View style={[styles.canopy, { top: 30, opacity: 0.5, backgroundColor: '#0d2c20' }]} />

      {/* faint shaft of canopy light */}
      <LinearGradient
        colors={['rgba(191,233,160,0.16)', 'rgba(191,233,160,0)']}
        start={{ x: 0.35, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        style={styles.shaft}
      />

      {/* drifting bioluminescent spores */}
      <Spore delay={0} left="20%" size={6} />
      <Spore delay={2200} left="48%" size={4} />
      <Spore delay={4200} left="68%" size={7} />
      <Spore delay={6200} left="82%" size={4} />
      <Spore delay={1200} left="34%" size={5} />

      {/* trunk silhouettes */}
      <View style={[styles.trunk, { left: '12%', width: 26 }]} />
      <View style={[styles.trunk, { left: '74%', width: 34 }]} />
      <View style={[styles.trunk, { left: '90%', width: 20, opacity: 0.5 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', backgroundColor: '#0c2018' },
  canopy: {
    position: 'absolute',
    left: -60,
    right: -60,
    height: 280,
    borderBottomLeftRadius: 300,
    borderBottomRightRadius: 300,
  },
  shaft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '30%',
    width: '40%',
  },
  spore: {
    position: 'absolute',
    bottom: '20%',
    backgroundColor: '#5fe6c0',
    shadowColor: '#5fe6c0',
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  trunk: {
    position: 'absolute',
    bottom: 0,
    top: '35%',
    backgroundColor: '#0a1a12',
    opacity: 0.7,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
});
