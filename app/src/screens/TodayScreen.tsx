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
import { PLANS } from '../data/plans';
import { RhythmResult } from '../logic/score';
import { PulseEntry, load, getToday, currentStreak } from '../logic/pulselog';
import { weeklyReport, WeeklyReport } from '../logic/weekly';
import { F, T } from '../theme';
import {
  ActiveExperiment,
  ExperimentOutcome,
  EXPERIMENTS,
  dismissLastExperiment,
  experimentDay,
  experimentOutcome,
  getActiveExperiment,
  getLastExperiment,
  isExperimentComplete,
  startExperiment,
  stopExperiment,
} from '../logic/experiments';
import { currentFlowIndex, formatCountdown, nextShift } from '../logic/forecast';

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
  onReset,
  onClose,
}: {
  result: RhythmResult;
  onCheckIn: () => void;
  onTrends: () => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const topInset = useTopInset();
  const arch = ARCHETYPES[result.animal];
  const plan = PLANS[result.animal];
  const flow = plan?.flow ?? [];
  // Re-render each minute so "now" and the countdown stay current.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  const nowIdx = currentFlowIndex(flow, now);
  const nowItem = nowIdx >= 0 ? flow[nowIdx] : undefined;
  const next = nextShift(flow, now);
  // Before the day's first item, the card previews it rather than claiming it's "now".
  const upcoming = !!next && next.index === nowIdx && !next.tomorrow;

  const [today, setToday] = useState<PulseEntry | undefined>(undefined);
  const [streak, setStreak] = useState(0);
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [experiment, setExperiment] = useState<ActiveExperiment | null>(null);
  const [lastExperiment, setLastExperiment] = useState<ActiveExperiment | null>(null);
  const [outcome, setOutcome] = useState<ExperimentOutcome | null>(null);

  // Refresh local stats whenever the screen mounts.
  useEffect(() => {
    let alive = true;
    (async () => {
      const log = await load();
      if (!alive) return;
      setToday(getToday(log));
      setStreak(currentStreak(log));
      setReport(weeklyReport(log));
      let active = await getActiveExperiment();
      // A finished experiment wraps itself up and moves to the results card.
      if (active && isExperimentComplete(active)) {
        await stopExperiment();
        active = null;
      }
      const last = await getLastExperiment();
      if (!alive) return;
      setExperiment(active);
      setLastExperiment(last);
      setOutcome(last ? experimentOutcome(last, log) : null);
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
        {/* Header */}
        <LinearGradient
          colors={arch.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.kicker}>
            {arch.emoji} {arch.name.toUpperCase()}
          </Text>
          <Text style={styles.greeting}>{greeting(now)}.</Text>
          <Text style={styles.headerCopy}>
            Your quiz suggests a stronger focus window around {result.peak} and a
            possible lower-energy window near {result.crash}. Your check-ins help refine the picture.
          </Text>
          {/* Rendered last so it sits above the header text and stays tappable. */}
          <Pressable onPress={onClose} hitSlop={12} style={styles.close}>
            <Text style={styles.closeText}>Done</Text>
          </Pressable>
        </LinearGradient>

        {/* Rhythm ribbon: today's suggested rhythm, with the now-marker. */}
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
              {upcoming && next
                ? `UP NEXT · ${nowItem.time} · ${formatCountdown(next.minutesUntil).toUpperCase()}`
                : `RIGHT NOW · ${nowItem.time}`}
            </Text>
            <Text style={styles.nowTitle}>{nowItem.title}</Text>
            <Text style={styles.nowNote}>{nowItem.note}</Text>
            {next && next.index !== nowIdx && (
              <Text style={styles.nextLine}>
                <Text style={{ color: arch.accent }}>NEXT · </Text>
                {next.item.title} {next.tomorrow ? 'tomorrow, ' : ''}
                {formatCountdown(next.minutesUntil)}
              </Text>
            )}
          </View>
        )}

        {/* Reset: secondary, state-matched — never competes with the check-in. */}
        <Pressable onPress={onReset} style={styles.resetCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.resetTitle}>1-minute reset</Text>
            <Text style={styles.resetSub}>
              A breathing pace matched to {today ? `your ${today.level} check-in` : 'how you feel right now'}.
            </Text>
          </View>
          <Text style={[styles.resetArrow, { color: arch.accent }]}>→</Text>
        </Pressable>

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

        <Text style={styles.section}>RHYTHM EXPERIMENT</Text>
        {!experiment && lastExperiment && outcome && (
          <View style={[styles.experimentCard, { borderColor: `${arch.accent}55`, borderWidth: 1 }]}>
            <Text style={[styles.experimentKicker, { color: arch.accent }]}>RESULTS · {lastExperiment.title.toUpperCase()}</Text>
            <View style={styles.weekStats}>
              <Stat value={outcome.before ?? '—'} label={`before (${outcome.beforeCount})`} />
              <Stat value={outcome.during ?? '—'} label={`during (${outcome.duringCount})`} />
            </View>
            <Text style={styles.experimentText}>{outcome.summary}</Text>
            {outcome.commonReason && (
              <Text style={styles.experimentText}>Most-tagged reason during it: {outcome.commonReason}.</Text>
            )}
            <Pressable
              onPress={async () => {
                await dismissLastExperiment();
                setLastExperiment(null);
                setOutcome(null);
              }}
            >
              <Text style={styles.experimentStop}>Clear results</Text>
            </Pressable>
          </View>
        )}
        {experiment ? (
          <View style={styles.experimentCard}>
            <Text style={[styles.experimentKicker, { color: arch.accent }]}>DAY {experimentDay(experiment)} OF {experiment.days}</Text>
            <Text style={styles.experimentTitle}>{experiment.title}</Text>
            <Text style={styles.experimentText}>{experiment.prompt}</Text>
            <Text style={styles.experimentFine}>Notice what changes in your check-ins. Circadia treats this as a personal observation, not proof of cause.</Text>
            <Pressable
              onPress={async () => {
                const ended = experiment;
                await stopExperiment();
                setExperiment(null);
                setLastExperiment(ended);
                setOutcome(experimentOutcome(ended, await load()));
              }}
            >
              <Text style={styles.experimentStop}>End experiment & see results</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.experimentChoices}>
            {EXPERIMENTS.slice(0, 3).map((item) => (
              <Pressable key={item.id} style={styles.experimentChoice} onPress={async () => setExperiment(await startExperiment(item))}>
                <Text style={styles.experimentTitle}>{item.title}</Text>
                <Text style={styles.experimentText}>{item.days}-day observation →</Text>
              </Pressable>
            ))}
          </View>
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
  root: { ...StyleSheet.absoluteFillObject, backgroundColor: T.bg },
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
  nextLine: { color: T.text, fontFamily: F.mono, fontSize: 12, marginTop: 12, opacity: 0.85 },
  resetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.hairline,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  resetTitle: { color: T.text, fontFamily: F.display, fontSize: 15 },
  resetSub: { color: T.muted, fontSize: 13, lineHeight: 18, marginTop: 3 },
  resetArrow: { fontSize: 20, marginLeft: 12 },
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
  experimentCard: { backgroundColor: T.surface, borderRadius: 16, padding: 16, marginBottom: 24 },
  experimentKicker: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1 },
  experimentTitle: { color: T.text, fontFamily: F.display, fontSize: 16, marginTop: 5 },
  experimentText: { color: T.muted, fontSize: 13, lineHeight: 19, marginTop: 5 },
  experimentFine: { color: T.muted, fontSize: 11, lineHeight: 16, marginTop: 12, opacity: 0.8 },
  experimentStop: { color: T.muted, fontFamily: F.mono, fontSize: 11, marginTop: 14 },
  experimentChoices: { gap: 8, marginBottom: 24 },
  experimentChoice: { backgroundColor: T.surface, borderRadius: 14, padding: 14 },
  tonight: { marginTop: 8 },
  tonightLine: { color: T.text, fontSize: 15, lineHeight: 21 },
  tonightNote: { color: T.muted, fontSize: 13, lineHeight: 19, marginTop: 6 },
});
