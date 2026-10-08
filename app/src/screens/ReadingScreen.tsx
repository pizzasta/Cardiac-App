import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useReducedMotion } from '../hooks';
import type { RhythmResult } from '../logic/score';

// Short anticipation beat before the reveal. Instead of generic loading
// lines, it plays back what your answers actually said, one finding at a
// time, so the result feels earned.
const STEP_MS = 850;

export default function ReadingScreen({ result, onDone }: { result: RhythmResult; onDone: () => void }) {
  const findings = [
    { label: 'PEAK FOCUS', value: result.peak },
    { label: 'ENERGY DIP', value: result.crash },
    { label: 'RECHARGE', value: result.recharge },
  ];
  const [shown, setShown] = useState(0);
  const fades = useRef(findings.map(() => new Animated.Value(0))).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
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
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduced]);

  useEffect(() => {
    const timers = fades.map((_, i) => setTimeout(() => setShown(i + 1), 500 + i * STEP_MS));
    timers.push(setTimeout(onDone, 500 + fades.length * STEP_MS + 900));
    return () => timers.forEach(clearTimeout);
  }, [onDone, fades]);

  useEffect(() => {
    if (shown < 1) return;
    const v = fades[shown - 1];
    if (reduced) v.setValue(1);
    else Animated.timing(v, { toValue: 1, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [shown, fades, reduced]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.25] });

  return (
    <LinearGradient colors={['rgba(6,6,10,0)', 'rgba(6,6,10,0.15)', 'rgba(6,6,10,0.55)']} style={styles.fill}>
      <Animated.View style={[styles.orb, { transform: [{ scale }] }]} />
      <Text style={styles.text}>{shown < findings.length ? 'Reading your answers…' : 'Matching your rhythm…'}</Text>
      <View style={styles.findings}>
        {findings.map((f, i) => (
          <Animated.View
            key={f.label}
            style={[
              styles.finding,
              {
                opacity: fades[i],
                transform: [{ translateY: fades[i].interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
              },
            ]}
          >
            <Text style={styles.findingLabel}>{f.label}</Text>
            <Text style={styles.findingValue}>{f.value.charAt(0).toUpperCase() + f.value.slice(1)}</Text>
          </Animated.View>
        ))}
      </View>
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
  findings: { marginTop: 28, gap: 10, width: 260 },
  finding: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(18,18,20,0.55)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  findingLabel: { color: '#FF2E7E', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  findingValue: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
