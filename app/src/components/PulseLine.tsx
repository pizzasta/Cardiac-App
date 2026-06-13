import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, View, ViewStyle } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { T } from '../theme';

// The brand element: a continuously scrolling ECG/heartbeat signal. One beat
// repeats and scrolls left, so the "nervous system" always reads as alive.

const SEG = 130; // px per heartbeat
const TILES = 14; // enough to cover wide screens
const TOTAL = SEG * TILES;

function beatPoints(height: number): string {
  const y = height / 2;
  const a = height * 0.36; // spike amplitude
  // one beat: flat → small bump → sharp spike → flat
  const shape: [number, number][] = [
    [0, y],
    [SEG * 0.28, y],
    [SEG * 0.34, y - a * 0.22],
    [SEG * 0.4, y + a * 0.1],
    [SEG * 0.46, y],
    [SEG * 0.52, y - a],
    [SEG * 0.58, y + a * 0.55],
    [SEG * 0.64, y],
    [SEG * 0.72, y],
    [SEG, y],
  ];
  const pts: string[] = [];
  for (let i = 0; i < TILES; i++) {
    for (const [x, yy] of shape) pts.push(`${x + i * SEG},${yy.toFixed(1)}`);
  }
  return pts.join(' ');
}

export default function PulseLine({
  height = 64,
  color = T.accent,
  glow = T.accent2,
  speed = 1100,
  style,
}: {
  height?: number;
  color?: string;
  glow?: string;
  speed?: number; // ms per beat
  style?: StyleProp<ViewStyle>;
}) {
  const x = useRef(new Animated.Value(0)).current;
  const points = beatPoints(height);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(x, {
        toValue: 1,
        duration: speed,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [x, speed]);

  const translateX = x.interpolate({ inputRange: [0, 1], outputRange: [0, -SEG] });

  return (
    <View style={[{ height, overflow: 'hidden' }, style]}>
      <Animated.View style={{ width: TOTAL, height, transform: [{ translateX }] }}>
        <Svg width={TOTAL} height={height}>
          {/* glow underlay */}
          <Polyline points={points} fill="none" stroke={glow} strokeWidth={7} strokeOpacity={0.18} />
          <Polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeOpacity={0.95} />
        </Svg>
      </Animated.View>
    </View>
  );
}
