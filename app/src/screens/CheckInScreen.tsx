import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTopInset } from '../hooks';
import { haptic } from '../logic/haptics';
import { maybeAskForReview } from '../logic/review';
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
  buildSignalQuestion,
} from '../logic/pulselog';
import { refreshSmartNudge } from '../logic/notifications';
import PulseLine from '../components/PulseLine';
import SimilarDaysCard from '../components/SimilarDaysCard';
import AnimalEmblem from '../world/AnimalEmblem';
import { TINTS } from '../data/archetypes';
import { F } from '../theme';
import { playSfx } from '../logic/sfx';
import Scrim from '../components/Scrim';
import PressableScale from '../components/PressableScale';

export default function CheckInScreen({
  result,
  onClose,
  onTrends,
  onExplain,
  onReset,
  onSaved,
}: {
  result: RhythmResult;
  onClose: () => void;
  onTrends: () => void;
  onExplain: (seed: string) => void;
  onReset: (level: Level) => void;
  onSaved?: (level: Level) => void;
}) {
  const a = ARCHETYPES[result.animal];
  const morning = new Date().getHours() < 14;

  const [today, setToday] = useState<PulseEntry | undefined>(undefined);
  const [level, setLevel] = useState<Level | null>(null);
  const [reason, setReason] = useState<string | undefined>(undefined);
  const [saved, setSaved] = useState(false);
  const [log, setLog] = useState<PulseEntry[]>([]);
  const [hop, setHop] = useState(0);

  const beat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    load().then((entries) => {
      setLog(entries);
      const t = getToday(entries);
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
    const next = await logToday(level, reason);
    setLog(next);
    // A steady day is a good moment to ask for a rating (rarely; see review.ts).
    if (level === 'steady') maybeAskForReview('steady-checkin', next.length);
    // Re-time the smart nudge to the emerging pattern (native; no-op on web).
    refreshSmartNudge(result.animal).catch(() => {});
    setSaved(true);
    setHop((h) => h + 1);
    onSaved?.(level);
    playSfx('success');
    haptic('success');
    Animated.sequence([
      Animated.timing(beat, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(beat, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  };

  const beatScale = beat.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const read = level ? readFor(a.name, level) : null;

  const topInset = useTopInset();
  return (
    <View style={styles.fill}>
      <Scrim shade="medium" />

      <View style={[styles.header, { paddingTop: topInset }]}>
        <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button">
          <Text style={styles.back}>‹ Close</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Check-in</Text>
        <Pressable onPress={onTrends} hitSlop={12} style={styles.trendsBtn} accessibilityRole="button">
          <Text style={[styles.trendsText, { color: a.accent }]}>Trends</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Your animal mirrors the level you pick, and hops when you save. */}
        <AnimalEmblem
          animal={result.animal}
          accent={TINTS[result.animal]}
          emoji={a.emoji}
          bg={null}
          sparks={false}
          mood={level}
          hop={hop}
          style={styles.companion}
        />
        <Text style={styles.kicker}>{morning ? 'MORNING FORECAST' : 'EVENING REFLECTION'}</Text>
        <Text style={styles.question}>How’s your energy{morning ? '' : ' been today'}?</Text>
        <Text style={styles.sub}>10 seconds. No streak to protect, just an honest read.</Text>

        <View style={styles.levels}>
          {LEVELS.map((l) => {
            const active = level === l.id;
            return (
              <PressableScale
                key={l.id}
                style={[
                  styles.levelCard,
                  active && { borderColor: a.accent, backgroundColor: `${a.accent}1f` },
                ]}
                onPress={() => {
                  playSfx('select');
                  setLevel(l.id);
                  setSaved(false);
                }}
              >
                <View style={[styles.dot, { backgroundColor: active ? a.accent : 'rgba(255,255,255,0.25)' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.levelLabel}>{l.label}</Text>
                  <Text style={styles.levelBlurb}>{l.blurb}</Text>
                </View>
              </PressableScale>
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
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
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
          <>
            <PressableScale style={[styles.cta, { backgroundColor: a.accent }]} onPress={saved ? onTrends : save}>
              <Text style={styles.ctaText}>{saved ? 'See your trends  →' : today ? 'Update today' : 'Save check-in'}</Text>
            </PressableScale>
            {saved && (
              <Pressable
                style={[styles.explainBtn, { borderColor: `${a.accent}66` }]}
                onPress={async () => {
                  // Re-read storage: a background cloud sync may have added entries.
                  const fresh = await load();
                  setLog(fresh);
                  onExplain(buildSignalQuestion(fresh, level, reason));
                }}
              >
                <Text style={[styles.explainText, { color: a.accent }]}>Ask about today  →</Text>
              </Pressable>
            )}
            {saved && level !== 'steady' && (
              <Pressable onPress={() => onReset(level)} hitSlop={8}>
                <Text style={styles.resetLink}>
                  {level === 'wired' ? 'Settle down' : 'Lift your energy'} with a 1-minute reset  →
                </Text>
              </Pressable>
            )}
            {saved && <SimilarDaysCard log={log} accent={a.accent} />}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent' },
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
  companion: { height: 150, marginTop: 4, marginHorizontal: -22 },
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
  explainBtn: { borderWidth: 1, borderRadius: 24, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  explainText: { fontSize: 14, fontWeight: '700' },
  resetLink: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 16 },
});
