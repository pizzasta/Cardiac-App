import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const LINES = [
  'Reading your patterns…',
  'Mapping your energy curve…',
  'Matching your rhythm…',
];

// Short anticipation beat before the reveal. Theater, kept brief.
export default function ReadingScreen({ onDone }: { onDone: () => void }) {
  const [line, setLine] = useState(0);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    const t1 = setTimeout(() => setLine(1), 1100);
    const t2 = setTimeout(() => setLine(2), 2200);
    const t3 = setTimeout(onDone, 3300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone, pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.25] });

  return (
    <LinearGradient colors={['#08080A', '#141016', '#08080A']} style={styles.fill}>
      <Animated.View style={[styles.orb, { transform: [{ scale }] }]} />
      <Text style={styles.text}>{LINES[line]}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  orb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FF2E7E',
    opacity: 0.55,
    marginBottom: 40,
  },
  text: { color: '#fff', fontSize: 18, fontWeight: '600', letterSpacing: 0.4 },
});
