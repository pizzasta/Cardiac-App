import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function HookScreen({ onStart }: { onStart: () => void }) {
  // Soft breathing pulse — the brand's signature motion.
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.6] });

  return (
    <LinearGradient colors={['#0E1424', '#10394A', '#2BD9C8']} style={styles.fill}>
      <View style={styles.center}>
        <Animated.View style={[styles.orb, { transform: [{ scale }], opacity }]} />
        <Text style={styles.kicker}>CIRCADIA</Text>
        <Text style={styles.title}>What’s your{'\n'}rhythm animal?</Text>
        <Text style={styles.sub}>
          A 60-second read of how your energy actually works.
        </Text>
      </View>

      <Pressable style={styles.cta} onPress={onStart}>
        <Text style={styles.ctaText}>Find out  →</Text>
      </Pressable>
      <Text style={styles.fineprint}>No signup. Just curiosity.</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, paddingHorizontal: 28, paddingBottom: 44 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  orb: {
    position: 'absolute',
    top: '24%',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#2BD9C8',
  },
  kicker: {
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 6,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 18,
  },
  title: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 46,
  },
  sub: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 18,
    maxWidth: 280,
    lineHeight: 23,
  },
  cta: {
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
  },
  ctaText: { color: '#0E1424', fontSize: 18, fontWeight: '700' },
  fineprint: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 14,
    fontSize: 13,
  },
});
