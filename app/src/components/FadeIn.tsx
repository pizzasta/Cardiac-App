import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import { useReducedMotion } from '../hooks';

// A reusable mount transition: fade + gentle lift. Used to give every screen
// change a soft, cinematic entrance instead of a hard swap.
export default function FadeIn({
  children,
  duration = 420,
  lift = 12,
  style,
}: {
  children: React.ReactNode;
  duration?: number;
  lift?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const v = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();

  // With reduced motion the screen just appears.
  useEffect(() => {
    if (reduced) {
      v.stopAnimation();
      v.setValue(1);
      return;
    }
    Animated.timing(v, { toValue: 1, duration, useNativeDriver: true }).start();
  }, [v, duration, reduced]);

  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [lift, 0] });

  return (
    <Animated.View style={[{ flex: 1, opacity: v, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}
