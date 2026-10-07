import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// A see-through shade over the 3D world so text stays readable while the world
// keeps showing. `light` for hero screens, `strong` behind dense content.
const SHADES = {
  light: ['rgba(6,6,10,0.05)', 'rgba(6,6,10,0.25)', 'rgba(6,6,10,0.72)'],
  medium: ['rgba(6,6,10,0.35)', 'rgba(6,6,10,0.55)', 'rgba(6,6,10,0.85)'],
  strong: ['rgba(6,6,10,0.6)', 'rgba(6,6,10,0.74)', 'rgba(6,6,10,0.9)'],
} as const;

export default function Scrim({ shade = 'medium' }: { shade?: keyof typeof SHADES }) {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={SHADES[shade] as unknown as [string, string, string]}
      locations={[0, 0.45, 1]}
      style={StyleSheet.absoluteFill}
    />
  );
}
