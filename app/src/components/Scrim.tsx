import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { daylightNow } from '../world/clock';

// A see-through shade over the 3D world so text stays readable while the world
// keeps showing. `light` for hero screens, `strong` behind dense content.
// Opacity of the shade at the top, middle and bottom of the screen.
const SHADES = {
  light: [0.05, 0.25, 0.72],
  medium: [0.35, 0.55, 0.85],
  strong: [0.6, 0.74, 0.9],
} as const;

// In daylight the sky behind the UI is brighter, so the top and middle of the
// shade darken with it to keep text readable at any hour.
const DAY_BOOST = [0.4, 0.3, 0];

function colorsFor(shade: keyof typeof SHADES, day: number): [string, string, string] {
  return SHADES[shade].map(
    (a, i) => `rgba(6,6,10,${Math.min(0.92, a + day * DAY_BOOST[i]).toFixed(2)})`
  ) as [string, string, string];
}

export default function Scrim({ shade = 'medium' }: { shade?: keyof typeof SHADES }) {
  const day = daylightNow();
  return (
    <LinearGradient
      pointerEvents="none"
      colors={colorsFor(shade, day)}
      locations={[0, 0.45, 1]}
      style={StyleSheet.absoluteFill}
    />
  );
}
