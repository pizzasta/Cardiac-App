import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ARCHETYPES } from '../data/archetypes';
import { RhythmResult } from '../logic/score';
import {
  getToday,
  Level,
  LEVELS,
  load,
  logToday,
  PulseEntry,
  readFor,
  REASONS,
} from '../logic/pulselog';
import PulseLine from '../components/PulseLine';
import { F, T } from '../theme';

export default function CheckInScreen({
  result,
  onClose,
  onTrends,
}: {
  result: RhythmResult;
  onClose: () => void;
  onTrends: () => void;
}) {
  const a = ARCHETYPES[result.animal];
  const morning = new Date().getHours() < 14;

  const [today, setToday] = useState<PulseEntry | undefined>(undefined);
  const [level, setLevel] = useState<Level | null>(null);
  const [reason, setReason] = useState<string | undefined>(undefined);
  const [saved, setSaved] = useState(false);

  const beat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    load().then((log) => {
      const t = getToday(log);
      setToday(t);
      if (t) {
        setLevel(t.level);
        setReason(t.reason);
        setSaved(true);
      }
    });
  }, []);

  const save = async () => {
    if (!level) return;
    await logToday(level, reason);
    setSaved(true);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Animated.sequence([
      Animated.timing(beat, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(beat, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  };

  const beatScale = beat.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const read = level ? readFor(a.name, level) : null;

  return (
    <View style={styles.fill}>
      <LinearGradient colors={T.bgGradient} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.back}>‹ Close</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Daily Pulse</Text>
        <Pressable onPress={onTrends} hitSlop={12} style={styles.trendsBtn}>
          <Text style={[styles.trendsText, { color: a.accent }]}>Trends</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>{morning ? 'MORNING FORECAST' : 'EVENING REFLECTION'}</Text>
        <Text style={styles.question}>Where’s your signal{morning ? '' : ' been'}?</Text>
        <Text style={styles.sub}>10 seconds. No streak to protect — just an honest read.</Text>

        <View style={styles.levels}>
          {LEVELS.map((l) => {
            const active = level === l.id;
            return (
              <Pressable
                key={l.id}
                style={[
                  styles.levelCard,
                  active && { borderColor: a.accent, backgroundColor: `${a.accent}1f` },
                ]}
                onPress={() => {
                  setLevel(l.id);
                  setSaved(false);
                }}
              >
                <View style={[styles.dot, { backgroundColor: active ? a.accent : 'rgba(255,255,255,0.25)' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.levelLabel}>{l.label}</Text>
                  <Text style={styles.levelBlurb}>{l.blurb}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {level && (
          <>
            <Text style={styles.reasonLabel}>WHAT’S DRIVING IT? (optional)</Text>
            <View style={styles.reasons}>
              {REASONS.map((r) => {
                const active = reason === r;
                return (
                  <Pressable
                    key={r}
                    style={[styles.chip, active && { borderColor: a.accent, backgroundColor: `${a.accent}26` }]}
                    onPress={() => setReason(active ? undefined : r)}
                  >
                    <Text style={[styles.chipText, active && { color: '#fff' }]}>{r}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {read && saved && (
          <Animated.View style={[styles.readCard, { transform: [{ scale: beatScale }], borderColor: `${a.accent}55` }]}>
            <PulseLine height={48} color={a.accent} style={{ opacity: 0.7, marginBottom: 14 }} />
            <Text style={styles.readText}>{read.read}</Text>
            <Text style={[styles.moveLabel, { color: a.accent }]}>ONE MOVE</Text>
            <Text style={styles.moveText}>{read.move}</Text>
            <Text style={styles.tomorrow}>
              {morning
                ? 'Check back tonight to see how the day actually ran.'
                : 'Come back in the morning for tomorrow’s forecast.'}
            </Text>
          </Animated.View>
        )}

        {level && (
          <Pressable style={[styles.cta, { backgroundColor: a.accent }]} onPress={saved ? onTrends : save}>
            <Text style={styles.ctaText}>{saved ? 'See your trends  →' : today ? 'Update today' : 'Log my signal'}</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  back: { color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: '600', width: 64 },
  headerTitle: { color: '#fff', fontSize: 18, fontFamily: F.display },
  trendsBtn: { width: 64, alignItems: 'flex-end' },
  trendsText: { fontSize: 14, fontWeight: '700' },
  body: { paddingHorizontal: 22, paddingBottom: 48 },
  kicker: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: F.mono, letterSpacing: 1.5, marginTop: 14 },
  question: { color: '#fff', fontSize: 30, fontFamily: F.display, marginTop: 10 },
  sub: { color: 'rgba(255,255,255,0.65)', fontSize: 14, lineHeight: 20, marginTop: 8 },
  levels: { gap: 10, marginTop: 24 },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(18,18,20,0.5)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  dot: { width: 14, height: 14, borderRadius: 7 },
  levelLabel: { color: '#fff', fontSize: 17, fontWeight: '700' },
  levelBlurb: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 2 },
  reasonLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontFamily: F.mono, letterSpacing: 1, marginTop: 26, marginBottom: 12 },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  chipText: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '600' },
  readCard: {
    backgroundColor: 'rgba(18,18,20,0.55)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    marginTop: 26,
  },
  readText: { color: '#fff', fontSize: 17, lineHeight: 24, fontWeight: '600' },
  moveLabel: { fontSize: 11, fontFamily: F.mono, letterSpacing: 1, marginTop: 18 },
  moveText: { color: 'rgba(255,255,255,0.85)', fontSize: 15, lineHeight: 21, marginTop: 6 },
  tomorrow: { color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 19, marginTop: 16, fontStyle: 'italic' },
  cta: { borderRadius: 26, paddingVertical: 16, alignItems: 'center', marginTop: 26 },
  ctaText: { color: '#08080A', fontSize: 16, fontWeight: '800' },
});
