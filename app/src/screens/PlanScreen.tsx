import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTopInset } from '../hooks';
import { useAuth } from '../logic/auth';
import { ARCHETYPES } from '../data/archetypes';
import { PLANS } from '../data/plans';
import { personalFlow } from '../logic/personalPlan';
import { REMINDERS } from '../data/reminders';
import { DEEP_DIVE } from '../data/deepdive';
import { DISCLAIMER_FULL } from '../data/disclaimer';
import { RhythmResult } from '../logic/score';
import { canSchedule, disable as disableNotifs, enable as enableNotifs, isEnabled } from '../logic/notifications';
import { emitNotifsChanged, onNotifsChanged } from '../logic/notifyPrefs';
import { hasAI } from '../logic/ai';
import { load as loadLog, suggestCheckInTime } from '../logic/pulselog';
import Protected from '../components/Protected';
import { F } from '../theme';
import Scrim from '../components/Scrim';
import PressableScale from '../components/PressableScale';
import { blendFor, displayName } from '../data/blends';

const START_KEY = 'circadia.startHere';

function fmtTime(hour: number, minute: number): string {
  const ampm = hour < 12 ? 'AM' : 'PM';
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:${String(minute).padStart(2, '0')} ${ampm}`;
}

export default function PlanScreen({
  result,
  onBack,
  onPulse,
  onLegal,
  onSignIn,
  onScience,
  onSettings,
  onCheckIn,
  onTrends,
  onShareCard,
  checkedInToday = false,
}: {
  result: RhythmResult;
  onBack: () => void;
  // Optional `seed` opens Pulse with a question already asked (e.g. "go deeper
  // on this tip"), so the tips are powered by the AI, not just static text.
  onPulse: (seed?: string) => void;
  onLegal: () => void;
  onSignIn: () => void;
  onScience: () => void;
  onSettings: () => void;
  onCheckIn: () => void;
  onTrends: () => void;
  onShareCard: () => void;
  // Whether today's check-in is done (drives the first-run checklist).
  checkedInToday?: boolean;
}) {
  const a = ARCHETYPES[result.animal];
  const plan = PLANS[result.animal];
  const blend = blendFor(result);
  const flow = personalFlow(plan.flow, result);

  const { user } = useAuth();
  const ai = hasAI();
  const [notifsOn, setNotifsOn] = useState(false);
  // First-run checklist: shown until finished or hidden.
  const [startHidden, setStartHidden] = useState(true);
  useEffect(() => {
    AsyncStorage.getItem(START_KEY)
      .then((v) => setStartHidden(v === 'done'))
      .catch(() => setStartHidden(false));
  }, []);
  const hideStart = () => {
    setStartHidden(true);
    AsyncStorage.setItem(START_KEY, 'done').catch(() => {});
  };
  const [notifBusy, setNotifBusy] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);
  const [checkInTime, setCheckInTime] = useState<{ hour: number; minute: number; why: string } | null>(
    null
  );

  // Re-read on mount, when Settings flips reminders, and when the app comes
  // back to the foreground (permission may have changed in system settings).
  useEffect(() => {
    let alive = true;
    const refresh = () => {
      isEnabled()
        .then((on) => alive && setNotifsOn(on))
        .catch(() => {});
    };
    refresh();
    const unsubscribe = onNotifsChanged(refresh);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refresh();
    });
    return () => {
      alive = false;
      unsubscribe();
      sub.remove();
    };
  }, []);

  useEffect(() => {
    const base = REMINDERS[result.animal][0];
    loadLog()
      .then((log) => setCheckInTime(suggestCheckInTime(log, { hour: base.hour, minute: base.minute })))
      .catch(() => {});
  }, [result.animal]);

  const toggleNotifs = async () => {
    if (notifBusy) return;
    setNotifBusy(true);
    setNotifError(null);
    try {
      if (notifsOn) {
        await disableNotifs();
        setNotifsOn(false);
      } else {
        const ok = await enableNotifs(result.animal);
        setNotifsOn(ok);
        // Shown inline: Alert.alert does nothing on web.
        if (!ok) {
          setNotifError(
            'Notifications are blocked. Allow them for Circadia in your device or browser settings, then try again.'
          );
        }
      }
      emitNotifsChanged();
    } catch {
      setNotifError('Couldn’t change reminders just now. Please try again.');
    } finally {
      setNotifBusy(false);
    }
  };

  const topInset = useTopInset();
  return (
    <View style={styles.fill}>
      <Scrim shade="medium" />

      <View style={[styles.header, { paddingTop: topInset }]}>
        <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Your rhythm plan</Text>
        <Pressable onPress={onSettings} hitSlop={12} style={styles.gear} accessibilityRole="button" accessibilityLabel="Settings">
          <Text style={styles.gearIcon}>⚙︎</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.animal}>
          {a.emoji}  {displayName(result)}
        </Text>
        <Text style={styles.intro}>{plan.intro}</Text>

        <View style={styles.chips}>
          <Chip label="Peak" value={result.peak} accent={a.accent} />
          <Chip label="Crash" value={result.crash} accent={a.accent} />
          <Chip label="Recharge" value={result.recharge} accent={a.accent} />
        </View>

        {!startHidden && !(checkedInToday && notifsOn && user) && (
          <View style={[styles.startCard, { borderColor: `${a.accent}66` }]}>
            <View style={styles.startHead}>
              <Text style={[styles.section, { color: a.accent, marginTop: 0, marginBottom: 0 }]}>START HERE</Text>
              <Pressable onPress={hideStart} hitSlop={12} accessibilityRole="button" accessibilityLabel="Hide start here">
                <Text style={styles.startHide}>Hide</Text>
              </Pressable>
            </View>
            <Text style={styles.startIntro}>Three small steps and your plan starts learning you.</Text>
            {[
              { done: checkedInToday, title: 'Check in', sub: '10 seconds. How does your energy feel right now?', onPress: onCheckIn },
              {
                done: notifsOn,
                title: 'Turn on gentle nudges',
                sub: 'A reminder before your dip and at wind-down. Easy to turn off.',
                onPress: notifsOn ? undefined : toggleNotifs,
              },
              {
                done: !!user,
                title: 'Save your plan',
                sub: 'Optional. Keeps your rhythm and check-ins if you change phones.',
                onPress: user ? undefined : onSignIn,
              },
            ].map((step, i) => (
              <Pressable
                key={step.title}
                style={styles.startRow}
                onPress={step.onPress}
                disabled={!step.onPress}
                accessibilityRole="button"
                accessibilityState={{ checked: step.done, disabled: !step.onPress }}
              >
                <View
                  style={[
                    styles.startTick,
                    step.done ? { backgroundColor: a.accent, borderColor: a.accent } : { borderColor: `${a.accent}88` },
                  ]}
                >
                  <Text style={[styles.startTickText, { color: step.done ? '#08080A' : a.accent }]}>
                    {step.done ? '✓' : i + 1}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.startTitle, step.done && styles.startDone]}>{step.title}</Text>
                  {!step.done && <Text style={styles.startSub}>{step.sub}</Text>}
                </View>
                {!step.done && <Text style={[styles.startArrow, { color: a.accent }]}>→</Text>}
              </Pressable>
            ))}
          </View>
        )}

        <Text style={styles.section}>CHECK-IN</Text>
        <PressableScale style={[styles.pulseCard, { borderColor: `${a.accent}55` }]} onPress={onCheckIn}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pulseTitle}>Check in (10 seconds)</Text>
            <Text style={styles.pulseSub}>Log how your energy feels today. No streak to protect, just an honest read.</Text>
          </View>
          <Text style={[styles.pulseArrow, { color: a.accent }]}>→</Text>
        </PressableScale>
        <View style={styles.pulseLinks}>
          <Pressable onPress={onTrends} hitSlop={8} accessibilityRole="button">
            <Text style={[styles.pulseLink, { color: a.accent }]}>See your trends</Text>
          </Pressable>
          <Pressable onPress={onShareCard} hitSlop={8} accessibilityRole="button">
            <Text style={[styles.pulseLink, { color: a.accent }]}>Share your rhythm card ↗</Text>
          </Pressable>
        </View>

        <Text style={styles.section}>SLEEP WINDOW</Text>
        <View style={styles.sleepCard}>
          <View style={styles.sleepTimes}>
            <View style={styles.sleepCol}>
              <Text style={styles.sleepColLabel}>WIND DOWN</Text>
              <Text style={[styles.sleepTime, { color: a.accent }]}>{plan.sleep.bedtime}</Text>
            </View>
            <Text style={styles.sleepArrow}>→</Text>
            <View style={styles.sleepCol}>
              <Text style={styles.sleepColLabel}>WAKE</Text>
              <Text style={[styles.sleepTime, { color: a.accent }]}>{plan.sleep.wake}</Text>
            </View>
          </View>
          <Text style={styles.sleepNote}>{plan.sleep.note}</Text>
        </View>

        <Text style={styles.section}>DAILY NUDGES</Text>
        <View style={styles.notifCard}>
          <View style={styles.notifTop}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.notifTitle}>Rhythm reminders</Text>
              <Text style={styles.notifSub}>
                {notifsOn
                  ? 'On. Gentle nudges at your key moments.'
                  : 'Get nudged at your crash window and wind-down.'}
              </Text>
            </View>
            <Pressable
              style={[styles.toggle, notifsOn ? { backgroundColor: a.accent } : styles.toggleOff]}
              onPress={toggleNotifs}
              disabled={notifBusy}
              accessibilityRole="switch"
              accessibilityLabel="Rhythm reminders"
              accessibilityState={{ checked: notifsOn, disabled: notifBusy }}
            >
              {notifBusy ? (
                <ActivityIndicator color={notifsOn ? '#08080A' : '#fff'} size="small" />
              ) : (
                <View style={[styles.knob, notifsOn ? styles.knobOn : styles.knobOff]} />
              )}
            </Pressable>
          </View>

          <View style={styles.notifTimes}>
            {REMINDERS[result.animal].map((r, i) => (
              <Text key={i} style={styles.notifTime}>
                <Text style={{ color: a.accent, fontWeight: '700' }}>{fmtTime(r.hour, r.minute)}</Text>
                {'  '}{r.title}
              </Text>
            ))}
          </View>

          {checkInTime && (
            <View style={styles.smartRow}>
              <Text style={styles.smartLabel}>SMART CHECK-IN</Text>
              <Text style={styles.smartTime}>
                <Text style={{ color: a.accent, fontWeight: '700' }}>
                  {fmtTime(checkInTime.hour, checkInTime.minute)}
                </Text>
                {'  '}
                {checkInTime.why}
              </Text>
            </View>
          )}

          {notifError && (
            <Text style={styles.notifError} accessibilityLiveRegion="polite">
              {notifError}
            </Text>
          )}

          {!canSchedule && (
            <Text style={styles.notifWeb}>
              On the web we can only ask permission. Install the phone app for daily reminders.
            </Text>
          )}
        </View>

        <Text style={styles.section}>TODAY’S FLOW</Text>
        <View style={styles.timeline}>
          {flow.map((f, i) => (
            <View key={i} style={styles.flowRow}>
              <View style={styles.timeCol}>
                <Text style={[styles.time, { color: a.accent }]}>{f.time}</Text>
                {i < flow.length - 1 && <View style={styles.connector} />}
              </View>
              <View style={styles.flowCard}>
                <Text style={styles.flowTitle}>{f.title}</Text>
                {f.personal && <Text style={[styles.yours, { color: a.accent }]}>FROM YOUR ANSWERS</Text>}
                <Text style={styles.flowNote}>{f.note}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.section}>TIPS FOR A {a.name.toUpperCase()}</Text>
        {ai && <Text style={styles.tipsHint}>Tap a tip to ask a follow-up question.</Text>}
        {plan.tips.map((t, i) => (
          <Pressable
            key={i}
            style={styles.tipCard}
            disabled={!ai}
            accessibilityRole={ai ? 'button' : 'text'}
            accessibilityHint={ai ? 'Ask a follow-up question about this tip' : undefined}
            onPress={() =>
              onPulse(
                `As a ${a.name}, give me a deeper, personal tip on ${t.label.toLowerCase()}, building on this: "${t.text}". One concrete thing I can do today.`
              )
            }
          >
            <View style={styles.tipHead}>
              <Text style={[styles.tipLabel, { color: a.accent }]}>{t.label}</Text>
              {ai && <Text style={[styles.tipGo, { color: a.accent }]}>Ask ›</Text>}
            </View>
            <Text style={styles.tipText}>{t.text}</Text>
          </Pressable>
        ))}
        {blend && (
          <Pressable
            style={[styles.tipCard, { borderColor: `${a.accent}55`, borderWidth: 1 }]}
            disabled={!ai}
            accessibilityRole={ai ? 'button' : 'text'}
            onPress={() =>
              onPulse(
                `I'm a ${blend.name} (a ${a.name} with a ${ARCHETYPES[blend.streak].name} streak). Give me one concrete way to use this tip today: "${blend.tip.text}"`
              )
            }
          >
            <View style={styles.tipHead}>
              <Text style={[styles.tipLabel, { color: a.accent }]}>
                FROM YOUR {ARCHETYPES[blend.streak].name.toUpperCase()} STREAK · {blend.tip.label}
              </Text>
              {ai && <Text style={[styles.tipGo, { color: a.accent }]}>Ask ›</Text>}
            </View>
            <Text style={styles.tipText}>{blend.tip.text}</Text>
          </Pressable>
        )}

        <Text style={styles.section}>DETAILED PLAN</Text>
        <Protected
          onSignIn={onSignIn}
          accent={a.accent}
          title="🔒 Unlock your detailed plan"
          message="Sign in to see your week-by-week plan: deeper scheduling, caffeine and recovery timing, and the patterns worth noticing for your rhythm."
        >
          <View style={styles.deepCard}>
            {DEEP_DIVE[result.animal].map((d, i) => (
              <View key={i} style={styles.deepRow}>
                <Text style={[styles.deepBullet, { color: a.accent }]}>◆</Text>
                <Text style={styles.deepText}>{d}</Text>
              </View>
            ))}
          </View>
        </Protected>

        {ai && (
          <Pressable style={[styles.cta, { backgroundColor: a.accent }]} onPress={() => onPulse()} accessibilityRole="button">
            <Text style={styles.ctaText}>Ask a question  →</Text>
          </Pressable>
        )}

        <Pressable
          style={[styles.scienceBtn, { borderColor: `${a.accent}66` }]}
          onPress={onScience}
          accessibilityRole="button"
        >
          <Text style={[styles.scienceText, { color: a.accent }]}>Why this works: the science</Text>
        </Pressable>

        <Text style={styles.disclaimer}>{DISCLAIMER_FULL}</Text>
        <Pressable onPress={onLegal} hitSlop={10} accessibilityRole="link">
          <Text style={styles.legalLink}>Terms & Privacy</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Chip({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <View style={styles.chip}>
      <Text style={[styles.chipLabel, { color: accent }]}>{label}</Text>
      <Text style={styles.chipValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: 'transparent' },
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
  gear: { width: 64, alignItems: 'flex-end' },
  gearIcon: { color: 'rgba(255,255,255,0.85)', fontSize: 20 },
  body: { paddingHorizontal: 22, paddingBottom: 96 },
  animal: { color: '#fff', fontSize: 30, fontFamily: F.display, marginTop: 8 },
  intro: { color: 'rgba(255,255,255,0.82)', fontSize: 15, lineHeight: 22, marginTop: 8 },
  chips: { flexDirection: 'row', gap: 10, marginTop: 18 },
  chip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  chipLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  chipValue: { color: '#fff', fontSize: 13, fontWeight: '600', marginTop: 4, textAlign: 'center' },
  startCard: {
    backgroundColor: 'rgba(18,18,20,0.6)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginTop: 22,
  },
  startHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  startHide: { color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '600' },
  startIntro: { color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 20, marginTop: 8, marginBottom: 6 },
  startRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  startTick: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startTickText: { fontSize: 13, fontWeight: '800' },
  startTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  startDone: { color: 'rgba(255,255,255,0.5)', textDecorationLine: 'line-through' },
  startSub: { color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 17, marginTop: 2 },
  startArrow: { fontSize: 18, fontWeight: '700' },
  section: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontFamily: F.mono,
    letterSpacing: 1.5,
    marginTop: 30,
    marginBottom: 14,
  },
  pulseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(18,18,20,0.5)',
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  pulseTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  pulseSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 19, marginTop: 3 },
  pulseArrow: { fontSize: 22, fontWeight: '800' },
  pulseLinks: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', columnGap: 16, rowGap: 10, marginTop: 14 },
  pulseLink: { fontSize: 14, fontWeight: '700' },
  sleepCard: {
    backgroundColor: 'rgba(18,18,20,0.5)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
  },
  sleepTimes: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18 },
  sleepCol: { alignItems: 'center', minWidth: 92 },
  sleepColLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  sleepTime: { fontSize: 26, fontWeight: '900', marginTop: 4 },
  sleepArrow: { color: 'rgba(255,255,255,0.4)', fontSize: 22, fontWeight: '700' },
  sleepNote: { color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 20, marginTop: 14, textAlign: 'center' },
  notifCard: {
    backgroundColor: 'rgba(18,18,20,0.5)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
  },
  notifTop: { flexDirection: 'row', alignItems: 'center' },
  notifTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  notifSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 19, marginTop: 3 },
  toggle: {
    width: 56,
    height: 32,
    borderRadius: 16,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleOff: { backgroundColor: 'rgba(255,255,255,0.15)' },
  knob: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff' },
  knobOn: { alignSelf: 'flex-end' },
  knobOff: { alignSelf: 'flex-start' },
  notifTimes: { marginTop: 14, gap: 6 },
  notifTime: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  smartRow: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  smartLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontFamily: F.mono, letterSpacing: 1 },
  smartTime: { color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 19, marginTop: 6 },
  notifError: { color: '#FFB4C8', fontSize: 13, lineHeight: 18, marginTop: 12 },
  notifWeb: { color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 17, marginTop: 12 },
  timeline: {},
  flowRow: { flexDirection: 'row', gap: 14 },
  timeCol: { alignItems: 'center', width: 52 },
  time: { fontSize: 13, fontWeight: '800' },
  connector: { flex: 1, width: 2, backgroundColor: 'rgba(255,255,255,0.15)', marginTop: 4 },
  flowCard: {
    flex: 1,
    backgroundColor: 'rgba(18,18,20,0.45)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  flowTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  yours: { fontSize: 10, fontFamily: F.mono, letterSpacing: 1, marginTop: 3 },
  flowNote: { color: 'rgba(255,255,255,0.78)', fontSize: 14, lineHeight: 20, marginTop: 4 },
  tipCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  tipsHint: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: -6, marginBottom: 14 },
  tipHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  tipLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  tipGo: { fontSize: 12, fontWeight: '700' },
  tipText: { color: '#fff', fontSize: 15, lineHeight: 22 },
  deepCard: {
    backgroundColor: 'rgba(18,18,20,0.5)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  deepRow: { flexDirection: 'row', gap: 10 },
  deepBullet: { fontSize: 12, marginTop: 4 },
  deepText: { flex: 1, color: '#fff', fontSize: 15, lineHeight: 22 },
  lockCard: {
    backgroundColor: 'rgba(18,18,20,0.5)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
  },
  lockTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  lockText: { color: 'rgba(255,255,255,0.78)', fontSize: 14, lineHeight: 21, marginTop: 8 },
  lockBtn: { borderRadius: 24, paddingVertical: 13, alignItems: 'center', marginTop: 16 },
  lockBtnText: { color: '#08080A', fontSize: 15, fontWeight: '700' },
  cta: {
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 26,
  },

  ctaText: { color: '#08080A', fontSize: 18, fontWeight: '700' },
  scienceBtn: {
    borderWidth: 1,
    borderRadius: 28,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 12,
  },
  scienceText: { fontSize: 15, fontWeight: '700' },
  disclaimer: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 20,
  },
  legalLink: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginTop: 12,
  },
});
