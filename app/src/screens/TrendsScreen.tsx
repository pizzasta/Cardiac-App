import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTopInset } from '../hooks';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { ARCHETYPES, TINTS } from '../data/archetypes';
import { RhythmResult } from '../logic/score';
import {
  checkInsInWindow,
  currentStreak,
  Level,
  load,
  PulseEntry,
  series,
  trendInsight,
  yFor,
} from '../logic/pulselog';
import { useAuth } from '../logic/auth';
import { fetchStreak, fetchWeeksTracked, pullCheckIns, subscribeCheckIns } from '../logic/sync';
import { F, T } from '../theme';

const DAYS = 14;
const VW = 320;
const VH = 110;

export default function TrendsScreen({
  result,
  onClose,
  onCheckIn,
  onShare,
}: {
  result: RhythmResult;
  onClose: () => void;
  onCheckIn: () => void;
  onShare: () => void;
}) {
  const a = ARCHETYPES[result.animal];
  const tint = TINTS[result.animal];
  const { user } = useAuth();
  const [log, setLog] = useState<PulseEntry[]>([]);
  const [server, setServer] = useState<{ current: number; longest: number } | null>(null);
  const [weeks, setWeeks] = useState<number | null>(null);

  useEffect(() => {
    load().then(setLog);
  }, []);

  // When signed in, pull the cloud copy and read the authoritative streak +
  // weeks-tracked from Supabase (streaks table + emotional_trends view), and
  // subscribe to realtime check-in changes so other devices update live.
  useEffect(() => {
    if (!user) return;
    let active = true;
    const refresh = async () => {
      await pullCheckIns();
      if (!active) return;
      const fresh = await load();
      if (active) setLog(fresh);
      fetchStreak().then((s) => active && setServer(s));
      fetchWeeksTracked().then((w) => active && setWeeks(w));
    };
    refresh();
    const unsubscribe = subscribeCheckIns(refresh);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [user]);

  const data = series(log, DAYS);
  const rhythm = checkInsInWindow(log, DAYS);
  const streak = currentStreak(log);
  const hasData = log.length > 0;

  // Build contiguous line segments so gaps read as gaps, not as a flat lie.
  const segments: string[] = [];
  let run: string[] = [];
  data.forEach((d, i) => {
    if (d.level == null) {
      if (run.length) segments.push(run.join(' '));
      run = [];
      return;
    }
    const x = (i / (DAYS - 1)) * VW;
    const y = VH - yFor(d.level) * (VH - 16) - 8;
    run.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  });
  if (run.length) segments.push(run.join(' '));

  const cellColor = (level: Level | null) => {
    if (level === 'wired') return tint;
    if (level === 'steady') return `${tint}88`;
    if (level === 'flat') return `${tint}33`;
    return 'rgba(255,255,255,0.06)';
  };

  const topInset = useTopInset();
  return (
    <View style={styles.fill}>
      <LinearGradient colors={T.bgGradient} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: topInset }]}>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.back}>‹ Close</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Your Signal</Text>
        <View style={{ width: 64 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.kickerRow}>
          <Text style={styles.kicker}>LAST {DAYS} DAYS</Text>
          {user && (
            <Text style={[styles.synced, { color: a.accent }]}>
              ☁ SYNCED{weeks != null ? ` · ${weeks}w TRACKED` : ''}
            </Text>
          )}
        </View>

        {/* Rhythm — forgiving, not a brittle streak */}
        <View style={styles.rhythmRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: a.accent }]}>{rhythm}</Text>
            <Text style={styles.statLabel}>check-ins / {DAYS}d</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: a.accent }]}>{server?.current ?? streak}</Text>
            <Text style={styles.statLabel}>day rhythm</Text>
          </View>
          {server && (
            <View style={styles.statCard}>
              <Text style={[styles.statNum, { color: a.accent }]}>{server.longest}</Text>
              <Text style={styles.statLabel}>best ever</Text>
            </View>
          )}
        </View>
        <Text style={styles.forgive}>
          Rest days count too. Miss one and the line dims — it doesn’t reset.
        </Text>

        {/* The waveform */}
        <View style={styles.waveCard}>
          {hasData ? (
            <Svg width="100%" height={VH} viewBox={`0 0 ${VW} ${VH}`}>
              {segments.map((pts, i) => (
                <Polyline key={i} points={pts} fill="none" stroke={tint} strokeWidth={2.5} strokeOpacity={0.95} />
              ))}
              {data.map((d, i) =>
                d.level ? (
                  <Circle
                    key={i}
                    cx={(i / (DAYS - 1)) * VW}
                    cy={VH - yFor(d.level) * (VH - 16) - 8}
                    r={3}
                    fill={tint}
                  />
                ) : null
              )}
            </Svg>
          ) : (
            <Text style={styles.empty}>Log your first signal to start the waveform.</Text>
          )}
          <View style={styles.waveAxis}>
            <Text style={styles.axisText}>wired</Text>
            <Text style={styles.axisText}>steady</Text>
            <Text style={styles.axisText}>flat</Text>
          </View>
        </View>

        {/* Heat ribbon */}
        <Text style={styles.section}>DAY BY DAY</Text>
        <View style={styles.ribbon}>
          {data.map((d, i) => (
            <View key={i} style={[styles.cell, { backgroundColor: cellColor(d.level) }]} />
          ))}
        </View>

        {/* Insight */}
        <View style={[styles.insightCard, { borderColor: `${a.accent}44` }]}>
          <Text style={[styles.insightKicker, { color: a.accent }]}>THE PATTERN</Text>
          <Text style={styles.insightText}>{trendInsight(log)}</Text>
        </View>

        <Pressable style={[styles.cta, { backgroundColor: a.accent }]} onPress={onCheckIn}>
          <Text style={styles.ctaText}>Check in now  →</Text>
        </Pressable>
        <Pressable style={[styles.shareBtn, { borderColor: `${a.accent}66` }]} onPress={onShare}>
          <Text style={[styles.shareText, { color: a.accent }]}>Share your Signal Card</Text>
        </Pressable>
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
  body: { paddingHorizontal: 22, paddingBottom: 48 },
  kickerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  kicker: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: F.mono, letterSpacing: 1.5 },
  synced: { fontSize: 11, fontFamily: F.mono, letterSpacing: 1 },
  rhythmRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(18,18,20,0.5)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  statNum: { fontSize: 38, fontFamily: F.display },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: F.mono, marginTop: 4 },
  forgive: { color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 19, marginTop: 12 },
  waveCard: {
    backgroundColor: 'rgba(18,18,20,0.5)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginTop: 22,
  },
  empty: { color: 'rgba(255,255,255,0.55)', fontSize: 14, textAlign: 'center', paddingVertical: 36 },
  waveAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  axisText: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: F.mono },
  section: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: F.mono, letterSpacing: 1.5, marginTop: 28, marginBottom: 12 },
  ribbon: { flexDirection: 'row', gap: 4 },
  cell: { flex: 1, height: 28, borderRadius: 4 },
  insightCard: {
    backgroundColor: 'rgba(18,18,20,0.55)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    marginTop: 24,
  },
  insightKicker: { fontSize: 11, fontFamily: F.mono, letterSpacing: 1 },
  insightText: { color: '#fff', fontSize: 16, lineHeight: 23, marginTop: 8, fontWeight: '600' },
  cta: { borderRadius: 26, paddingVertical: 16, alignItems: 'center', marginTop: 26 },
  ctaText: { color: '#08080A', fontSize: 16, fontWeight: '800' },
  shareBtn: { borderWidth: 1, borderRadius: 26, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  shareText: { fontSize: 15, fontWeight: '700' },
});
