// ResetScreen — a one-minute breathing pacer matched to the current signal.
//
// Defaults to today's check-in level (or Steady), lets the user switch before
// starting, then paces each breath with a growing / shrinking orb. Framed as a
// pause, never as treatment.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTopInset } from '../hooks';
import { ARCHETYPES } from '../data/archetypes';
import { RhythmResult } from '../logic/score';
import { getToday, Level, LEVELS, load } from '../logic/pulselog';
import { PHASE_LABEL, phaseAt, resetFor, totalSecs } from '../logic/reset';
import { F, T } from '../theme';
import { playSfx } from '../logic/sfx';
import Scrim from '../components/Scrim';

const MIN = 0.55;
const MAX = 1;

type Stage = 'ready' | 'running' | 'done';

export default function ResetScreen({
  result,
  level: initialLevel,
  onClose,
  onCheckIn,
}: {
  result: RhythmResult;
  level?: Level;
  onClose: () => void;
  onCheckIn: () => void;
}) {
  const a = ARCHETYPES[result.animal];
  const topInset = useTopInset();
  const [level, setLevel] = useState<Level>(initialLevel ?? 'steady');
  const [stage, setStage] = useState<Stage>('ready');
  const [elapsed, setElapsed] = useState(0);
  const scale = useRef(new Animated.Value(MIN)).current;
  const startedAt = useRef(0);
  const lastPhaseKey = useRef('');

  // Default to today's check-in when the caller didn't pass a level.
  useEffect(() => {
    if (initialLevel) return;
    let alive = true;
    load().then((log) => {
      const t = getToday(log);
      if (alive && t) setLevel(t.level);
    });
    return () => {
      alive = false;
    };
  }, [initialLevel]);

  const pattern = resetFor(level);
  const state = phaseAt(pattern, elapsed);

  // Clock: tick a few times a second while running.
  useEffect(() => {
    if (stage !== 'running') return;
    const id = setInterval(() => {
      const secs = (Date.now() - startedAt.current) / 1000;
      setElapsed(secs);
      if (secs >= totalSecs(pattern)) setStage('done');
    }, 200);
    return () => clearInterval(id);
  }, [stage, pattern]);

  // Orb: on each new phase, glide to that phase's target over its duration.
  useEffect(() => {
    if (stage !== 'running' || state.done) return;
    const key = `${state.round}:${pattern.phases.indexOf(state.phase)}`;
    if (key === lastPhaseKey.current) return;
    lastPhaseKey.current = key;
    if (state.phase.kind !== 'hold') {
      Animated.timing(scale, {
        toValue: state.phase.kind === 'in' ? MAX : MIN,
        duration: state.secsLeft * 1000,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }).start();
    }
    if (state.phase.kind === 'in') playSfx('breatheIn');
    else if (state.phase.kind === 'out') playSfx('breatheOut');
    if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
  }, [stage, state, pattern, scale]);

  useEffect(() => {
    if (stage === 'done') playSfx('complete');
    if (stage === 'done' && Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, [stage]);

  const begin = () => {
    startedAt.current = Date.now();
    lastPhaseKey.current = '';
    scale.setValue(MIN);
    setElapsed(0);
    setStage('running');
  };

  const remaining = Math.max(0, Math.ceil(totalSecs(pattern) - elapsed));

  return (
    <View style={styles.fill}>
      <Scrim shade="light" />

      <View style={[styles.header, { paddingTop: topInset }]}>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.back}>‹ Close</Text>
        </Pressable>
        <Text style={styles.headerTitle}>1-minute reset</Text>
        <View style={{ width: 64 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.kicker}>{pattern.title.toUpperCase()}</Text>

        <View style={styles.stage}>
          <Animated.View
            style={[
              styles.orb,
              { backgroundColor: `${a.accent}33`, borderColor: a.accent, transform: [{ scale }] },
            ]}
          />
          <View style={styles.orbLabel} pointerEvents="none">
            {stage === 'running' ? (
              <>
                <Text style={styles.phase}>{PHASE_LABEL[state.phase.kind]}</Text>
                <Text style={styles.count}>{state.secsLeft}</Text>
              </>
            ) : stage === 'done' ? (
              <Text style={styles.phase}>Done.</Text>
            ) : (
              <Text style={styles.count}>{totalSecs(pattern)}s</Text>
            )}
          </View>
        </View>

        {stage === 'ready' && (
          <>
            <Text style={styles.why}>{pattern.why}</Text>
            <Text style={styles.matchLabel}>MATCHED TO HOW YOU FEEL</Text>
            <View style={styles.levels}>
              {LEVELS.map((l) => {
                const active = l.id === level;
                return (
                  <Pressable
                    key={l.id}
                    onPress={() => setLevel(l.id)}
                    style={[styles.chip, active && { borderColor: a.accent, backgroundColor: `${a.accent}26` }]}
                  >
                    <Text style={[styles.chipText, active && { color: '#fff' }]}>{l.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable style={[styles.cta, { backgroundColor: a.accent }]} onPress={begin}>
              <Text style={styles.ctaText}>Begin</Text>
            </Pressable>
          </>
        )}

        {stage === 'running' && (
          <>
            <Text style={styles.progress}>
              Round {state.round} of {pattern.rounds} · {remaining}s left
            </Text>
            <Pressable onPress={() => setStage('ready')} hitSlop={8}>
              <Text style={styles.stop}>Stop</Text>
            </Pressable>
          </>
        )}

        {stage === 'done' && (
          <>
            <Text style={styles.why}>
              That’s a minute you gave back to yourself. Notice how you feel now. No need to
              force a change.
            </Text>
            <Pressable style={[styles.cta, { backgroundColor: a.accent }]} onPress={onCheckIn}>
              <Text style={styles.ctaText}>Check in now</Text>
            </Pressable>
            <Pressable onPress={begin} hitSlop={8}>
              <Text style={styles.stop}>Go again</Text>
            </Pressable>
          </>
        )}

        <Text style={styles.fine}>
          A pause, not a treatment. Breathe gently and stop if you feel light-headed.
        </Text>
      </View>
    </View>
  );
}

const ORB = 220;

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  back: { color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: '600', width: 64 },
  headerTitle: { color: '#fff', fontSize: 18, fontFamily: F.display },
  body: { flex: 1, paddingHorizontal: 24, paddingBottom: 32, alignItems: 'center' },
  kicker: { color: T.muted, fontFamily: F.mono, fontSize: 12, letterSpacing: 1.5, marginTop: 12 },
  stage: { width: ORB, height: ORB, alignItems: 'center', justifyContent: 'center', marginVertical: 28 },
  orb: { position: 'absolute', width: ORB, height: ORB, borderRadius: ORB / 2, borderWidth: 2 },
  orbLabel: { alignItems: 'center' },
  phase: { color: '#fff', fontFamily: F.display, fontSize: 22 },
  count: { color: 'rgba(255,255,255,0.8)', fontFamily: F.mono, fontSize: 18, marginTop: 6 },
  why: { color: 'rgba(255,255,255,0.8)', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  matchLabel: { color: T.muted, fontFamily: F.mono, fontSize: 11, letterSpacing: 1, marginTop: 22 },
  levels: { flexDirection: 'row', gap: 8, marginTop: 10 },
  chip: {
    borderColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  chipText: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '600' },
  cta: { borderRadius: 26, paddingVertical: 16, alignSelf: 'stretch', alignItems: 'center', marginTop: 24 },
  ctaText: { color: '#08080A', fontSize: 16, fontWeight: '800' },
  progress: { color: T.muted, fontFamily: F.mono, fontSize: 12 },
  stop: { color: T.muted, fontFamily: F.mono, fontSize: 13, marginTop: 18 },
  fine: { color: T.muted, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 'auto', opacity: 0.8 },
});
