// TodayScreen — the adaptive "Today" dashboard from CIRCADIA.md §5.
//
// A single scrollable, top-to-bottom narrative of the user's day (not a grid
// of widgets): pulse header → rhythm ribbon → Now card → today's flow →
// check-in nudge → weekly reveal → tonight. Grounded in the archetype's
// rhythm plan (data/plans.ts) and the local pulselog.
//
// Design law (from the spec): no empty states, no red, no streak-shaming,
// and never more than one primary action visible at once.
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTopInset } from '../hooks';
import { ARCHETYPES } from '../data/archetypes';
import { PLANS, FlowItem } from '../data/plans';
import { RhythmResult } from '../logic/score';
import { PulseEntry, load, getToday, currentStreak } from '../logic/pulselog';
import { weeklyReport, WeeklyReport } from '../logic/weekly';
import { F, T } from '../theme';

// Minutes since midnight for a 'HH:MM' label; -1 if unparseable.
function toMinutes(hhmm: string): number {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm.trim());
  if (!m) return -1;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

// The flow item whose time has most recently passed = where you are 'now'.
// Before the first item, fall back to the first; with no flow, -1.
function currentFlowIndex(flow: FlowItem[], now = new Date()): number {
  if (flow.length === 0) return -1;
  const mins = now.getHours() * 60 + now.getMinutes();
  let idx = 0;
  for (let i = 0; i < flow.length; i++) {
    if (toMinutes(flow[i].time) <= mins) idx = i;
  }
  return idx;
}

function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function TodayScreen({
  result,
  onCheckIn,
  onTrends,
  onClose,
}: {
  result: RhythmResult;
  onCheckIn: () => void;
  onTrends: () => void;
  onClose: () => void;
}) {
  const topInset = useTopInset();
  const arch = ARCHETYPES[result.animal];
  const plan = PLANS[result.animal];
  const flow = plan?.flow ?? [];
  const nowIdx = currentFlowIndex(flow);
  const nowItem = nowIdx >= 0 ? flow[nowIdx] : undefined;

  const [today, setToday] = useState<PulseEntry | undefined>(undefined);
  const [streak, setStreak] = useState(0);
  const [report, setReport] = useState<WeeklyReport | null>(null);

  // Refresh local stats whenever the screen mounts.
  useEffect(() => {
    let alive = true;
    (async () => {
      const log = await load();
      if (!alive) return;
      setToday(getToday(log));
      setStreak(currentStreak(log));
      setReport(weeklyReport(log));
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topInset + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Pulse header */}
        <LinearGradient
          colors={arch.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.header}
        >
          <Pressable onPress={onClose} hitSlop={12} style={styles.close}>
            <Text style={styles.closeText}>Done</Text>
          </Pressable>
          <Text style={styles.kicker}>
            {arch.emoji} {arch.name.toUpperCase()}
          </Text>
          <Text style={styles.greeting}>{greeting()}.</Text>
          <Text style={styles.headerCopy}>
            Your focus should be sharpest around {result.peak}. Watch the dip
            near {result.crash}.
          </Text>
        </LinearGradient>

        {/* Rhythm ribbon: today's predicted energy, with the now-marker. */}
        <Text style={styles.section}>TODAY’S RHYTHM</Text>
        <View style={styles.ribbon}>
          {flow.map((item, i) => (
            <View key={item.time + i} style={styles.ribbonCol}>
              <View
                style={[
                  styles.ribbonBar,
                  {
                    height:
                      14 +
                      ((flow.length - Math.abs(i - nowIdx)) / flow.length) * 46,
                    backgroundColor: i === nowIdx ? arch.accent : T.hairline,
                  },
                ]}
              />
              <Text
                style={[styles.ribbonTime, i === nowIdx && { color: arch.accent }]}
              >
                {item.time}
              </Text>
            </View>
          ))}
        </View>

        {/* Now card: the single most relevant action for this moment. */}
        {nowItem && (
          <View style={[styles.nowCard, { borderColor: arch.accent }]}>
            <Text style={[styles.nowLabel, { color: arch.accent }]}>
              RIGHT NOW · {nowItem.time}
            </Text>
            <Text style={styles.nowTitle}>{nowItem.title}</Text>
            <Text style={styles.nowNote}>{nowItem.note}</Text>
          </View>
        )}

        {/* Today's flow */}
        <Text style={styles.section}>TODAY’S FLOW</Text>
        {flow.map((item, i) => (
          <View
            key={'flow' + item.time + i}
            style={[styles.flowRow, i === nowIdx && styles.flowRowActive]}
          >
            <Text style={styles.flowTime}>{item.time}</Text>
            <View style={styles.flowBody}>
              <Text style={styles.flowTitle}>{item.title}</Text>
              <Text style={styles.flowNote}>{item.note}</Text>
            </View>
          </View>
        ))}

        {/* Check-in nudge: soft, optional, never guilt-trips. */}
        <Pressable
          onPress={onCheckIn}
          style={[styles.checkIn, { backgroundColor: arch.accent }]}
        >
          <Text style={styles.checkInText}>
            {today ? 'Update today’s check-in' : 'How’s your energy right now?'}
          </Text>
        </Pressable>

        {/* Weekly reveal */}
        {report && (
          <Pressable onPress={onTrends} style={styles.weekCard}>
            <Text style={styles.weekLabel}>THIS WEEK</Text>
            <Text style={styles.weekHeadline}>{report.headline}</Text>
            <View style={styles.weekStats}>
              <Stat value={report.consistencyPct + '%'} label="consistency" />
              <Stat value={String(report.daysLogged) + '/7'} label="days logged" />
              <Stat value={String(streak)} label="day streak" />
            </View>
            <Text style={styles.weekMore}>See your patterns →</Text>
          </Pressable>
        )}

        {/* Tonight: forward-looking recovery card. */}
        {plan?.sleep && (
          <View style={styles.tonight}>
            <Text style={styles.section}>TONIGHT</Text>
            <Text style={styles.tonightLine}>
              Wind down by {plan.sleep.bedtime}, aim to wake near {plan.sleep.wake}.
            </Text>
            <Text style={styles.tonightNote}>{plan.sleep.note}</Text>
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  header: { borderRadius: 20, padding: 20, marginBottom: 24 },
  close: { position: 'absolute', top: 16, right: 16 },
  closeText: { color: T.text, fontFamily: F.mono, fontSize: 13, opacity: 0.8 },
  kicker: {
    color: T.text,
    fontFamily: F.mono,
    fontSize: 12,
    letterSpacing: 1,
    opacity: 0.85,
  },
  greeting: { color: T.text, fontFamily: F.display, fontSize: 30, marginTop: 8 },
  headerCopy: {
    color: T.text,
    fontSize: 15,
    lineHeight: 21,
    marginTop: 8,
    opacity: 0.92,
  },
  section: {
    color: T.muted,
    fontFamily: F.mono,
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 12,
  },
  ribbon: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  ribbonCol: { alignItems: 'center', flex: 1 },
  ribbonBar: { width: 8, borderRadius: 4 },
  ribbonTime: { color: T.muted, fontFamily: F.mono, fontSize: 9, marginTop: 6 },
  nowCard: {
    backgroundColor: T.surface,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  nowLabel: { fontFamily: F.mono, fontSize: 11, letterSpacing: 1 },
  nowTitle: { color: T.text, fontFamily: F.display, fontSize: 18, marginTop: 6 },
  nowNote: { color: T.muted, fontSize: 14, lineHeight: 20, marginTop: 4 },
  flowRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: T.hairline,
  },
  flowRowActive: { opacity: 1 },
  flowTime: { color: T.muted, fontFamily: F.mono, fontSize: 12, width: 52 },
  flowBody: { flex: 1 },
  flowTitle: { color: T.text, fontSize: 15 },
  flowNote: { color: T.muted, fontSize: 13, lineHeight: 18, marginTop: 2 },
  checkIn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  checkInText: { color: T.bg, fontFamily: F.display, fontSize: 15 },
  weekCard: {
    backgroundColor: T.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  weekLabel: {
    color: T.muted,
    fontFamily: F.mono,
    fontSize: 11,
    letterSpacing: 1,
  },
  weekHeadline: {
    color: T.text,
    fontFamily: F.display,
    fontSize: 17,
    marginTop: 8,
    lineHeight: 23,
  },
  weekStats: { flexDirection: 'row', marginTop: 16 },
  weekMore: { color: T.muted, fontFamily: F.mono, fontSize: 12, marginTop: 16 },
  stat: { flex: 1 },
  statValue: { color: T.text, fontFamily: F.display, fontSize: 22 },
  statLabel: { color: T.muted, fontFamily: F.mono, fontSize: 10, marginTop: 2 },
  tonight: { marginTop: 8 },
  tonightLine: { color: T.text, fontSize: 15, lineHeight: 21 },
  tonightNote: { color: T.muted, fontSize: 13, lineHeight: 19, marginTop: 6 },
});
