import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import PulseLine from './PulseLine';
import { F, T } from '../theme';

// On-brand loading indicator: a small live pulse instead of a grey spinner.
export default function PulseLoader({
  color = T.accent,
  label,
  width = 120,
  height = 30,
  style,
}: {
  color?: string;
  label?: string;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.wrap, style]}>
      <PulseLine height={height} color={color} speed={900} style={{ width, opacity: 0.95 }} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'flex-start' },
  label: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontFamily: F.mono, letterSpacing: 1, marginTop: 6 },
});
