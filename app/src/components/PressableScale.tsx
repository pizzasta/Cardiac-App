import React, { useRef } from 'react';
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

// A Pressable that dips slightly when pressed and springs back, so cards and
// buttons feel physical. Announced as a button unless a role is passed in.
export default function PressableScale({
  style,
  children,
  scaleTo = 0.97,
  accessibilityRole = 'button',
  ...props
}: Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  scaleTo?: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v: number) =>
    Animated.spring(scale, { toValue: v, friction: 6, tension: 260, useNativeDriver: true }).start();

  return (
    <Pressable
      {...props}
      accessibilityRole={accessibilityRole}
      onPressIn={(e) => {
        to(scaleTo);
        props.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        to(1);
        props.onPressOut?.(e);
      }}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
