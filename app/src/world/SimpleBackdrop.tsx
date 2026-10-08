// The battery-friendly alternative to the 3D world: a still gradient that
// follows the same time of day (night, golden day, deep-pink dusk) and a soft
// horizon, with no animation and no GPU work.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalHour } from './clock';
import { daylight, mixHex, sunElevation, sunsetGlow } from './rig';

const NIGHT = ['#05060c', '#0b0b18', '#120a16'];
const DAY = ['#2c3550', '#6d5a6e', '#2a1e24'];
const DUSK = ['#1a0a1e', '#5a1238', '#a3104e'];

export default function SimpleBackdrop() {
  const hour = useLocalHour();
  const elevation = sunElevation(hour);
  const day = daylight(elevation);
  const dusk = sunsetGlow(hour, elevation);
  const colors = NIGHT.map((n, i) => mixHex(mixHex(n, DAY[i], day), DUSK[i], dusk * 0.8)) as [
    string,
    string,
    string,
  ];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={colors} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
      {/* A dark hill line so the screen still reads as a landscape. */}
      <LinearGradient
        colors={['rgba(6,6,10,0)', 'rgba(6,6,10,0.85)', '#06060A']}
        locations={[0, 0.35, 1]}
        style={styles.ground}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ground: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '42%' },
});
