import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  soundSupported,
  start as startSound,
  stop as stopSound,
  enableAutoStart,
  cancelAutoStart,
  setVolume as setSoundVolume,
  setSoundScene,
} from './src/logic/sound';
import LandingScreen from './src/screens/LandingScreen';
import QuizScreen from './src/screens/QuizScreen';
import ReadingScreen from './src/screens/ReadingScreen';
import RevealScreen from './src/screens/RevealScreen';
import PlanScreen from './src/screens/PlanScreen';
import TodayScreen from './src/screens/TodayScreen';
import PulseScreen from './src/screens/PulseScreen';
import LegalScreen from './src/screens/LegalScreen';
import SignInScreen from './src/screens/SignInScreen';
import ScienceScreen from './src/screens/ScienceScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CheckInScreen from './src/screens/CheckInScreen';
import TrendsScreen from './src/screens/TrendsScreen';
import SignalCardScreen from './src/screens/SignalCardScreen';
import ResetScreen from './src/screens/ResetScreen';
import AiConsentScreen from './src/screens/AiConsentScreen';
import FadeIn from './src/components/FadeIn';
import { Option } from './src/data/quiz';
import { QUIZ } from './src/data/quiz';
import { ARCHETYPES, TINTS } from './src/data/archetypes';
import World from './src/world/World';
import SimpleBackdrop from './src/world/SimpleBackdrop';
import { DisplayPrefsContext } from './src/world/displayPrefs';
import { enable as enableReminders, isEnabled as remindersEnabled } from './src/logic/notifications';
import { dragEnd, dragMove, dragStart, startWebTilt } from './src/world/look';
import { loadSimpleBackground, saveSimpleBackground, useLowPowerMode } from './src/logic/background';
import type { Mood, WorldMode } from './src/world/rig';
import { getToday, load as loadLog } from './src/logic/pulselog';
import { useBottomInset, useReducedMotion } from './src/hooks';
import { RhythmResult, scoreQuiz } from './src/logic/score';
import { AuthProvider, useAuth } from './src/logic/auth';
import { pushResult } from './src/logic/sync';
import { loadProfile, saveProfile } from './src/logic/profile';
import { hasAiConsent, setAiConsent } from './src/logic/consent';
import { loadSfxPref } from './src/logic/sfx';
import { loadHapticsPref } from './src/logic/haptics';
import type { Level } from './src/logic/pulselog';
import { useFonts, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { T } from './src/theme';

type Stage = 'boot' | 'landing' | 'quiz' | 'reading' | 'reveal' | 'plan' | 'pulse';

function Flow() {
  // 'boot' holds a blank frame while the saved profile is read, so returning
  // users never see the landing page flash before their dashboard.
  const [stage, setStage] = useState<Stage>('boot');
  const [result, setResult] = useState<RhythmResult | null>(null);
  // Kept around so the plan + Pulse can ground content in the user's answers.
  const [answers, setAnswers] = useState<Option[]>([]);
  // A question to open Pulse with (set when a tip is tapped on the plan).
  const [pulseSeed, setPulseSeed] = useState<string | undefined>(undefined);
  // Overlays, openable from any screen.
  const [showLegal, setShowLegal] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showScience, setShowScience] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showToday, setShowToday] = useState(false);
  const [showTrends, setShowTrends] = useState(false);
  const [showCard, setShowCard] = useState(false);
  // Today loads its numbers on mount, so it's remounted when it comes back to
  // the top after a check-in, reset or trends visit.
  const [todayKey, setTodayKey] = useState(0);
  // Today's check-in mood drives how the animal moves; `hop` makes it jump.
  const [mood, setMood] = useState<Mood | null>(null);
  const [hop, setHop] = useState(0);
  useEffect(() => {
    loadLog()
      .then((log) => setMood(getToday(log)?.level ?? null))
      .catch(() => {});
  }, []);
  // undefined = closed; null = open, default to today's check-in level.
  const [resetLevel, setResetLevel] = useState<Level | null | undefined>(undefined);
  // App-wide nature soundscape + persistent mute/volume (remembered across visits).
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.6);
  // Battery saver: a still backdrop instead of the 3D world, chosen in
  // Settings or automatic in Low Power Mode.
  const [simpleBg, setSimpleBg] = useState(false);
  const lowPower = useLowPowerMode();
  useEffect(() => {
    loadSimpleBackground().then(setSimpleBg);
  }, []);
  const toggleSimpleBg = () => {
    const next = !simpleBg;
    setSimpleBg(next);
    saveSimpleBackground(next);
  };
  const { completeOnboarding } = useAuth();

  // Returning users: restore their rhythm and open straight onto Today.
  useEffect(() => {
    let active = true;
    loadProfile().then((saved) => {
      if (!active) return;
      if (saved) {
        setResult(saved.result);
        setAnswers(saved.answers);
        setStage('plan');
        setShowToday(true);
      } else {
        setStage('landing');
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const [m, vol] = await Promise.all([
        AsyncStorage.getItem('circadia.muted').catch(() => null),
        AsyncStorage.getItem('circadia.volume').catch(() => null),
      ]);
      if (!active) return;
      if (vol != null) {
        const n = parseFloat(vol);
        if (!Number.isNaN(n)) {
          setVolume(n);
          setSoundVolume(n);
        }
      }
      loadSfxPref().catch(() => {});
      loadHapticsPref().catch(() => {});
      // Honor a saved choice. With none saved, ambience starts on web but stays
      // off on phones, where unexpected audio at launch is unwelcome.
      if (m === 'true' || (m == null && Platform.OS !== 'web')) setMuted(true);
      else enableAutoStart();
    })();
    return () => {
      active = false;
      cancelAutoStart();
      stopSound();
    };
  }, []);

  const toggleMute = () => {
    if (muted) {
      startSound();
      setMuted(false);
      AsyncStorage.setItem('circadia.muted', 'false').catch(() => {});
    } else {
      cancelAutoStart();
      stopSound();
      setMuted(true);
      AsyncStorage.setItem('circadia.muted', 'true').catch(() => {});
    }
  };

  const applyVolume = (v: number) => {
    setVolume(v);
    setSoundVolume(v);
    AsyncStorage.setItem('circadia.volume', String(v)).catch(() => {});
    if (muted) {
      startSound();
      setMuted(false);
      AsyncStorage.setItem('circadia.muted', 'false').catch(() => {});
    }
  };

  // Ask Wildhour sends data to a third-party AI service, so the first visit
  // asks permission; `consentFor` holds the pending question meanwhile.
  const [consentFor, setConsentFor] = useState<{ seed?: string } | null>(null);
  const goPulse = (seed?: string) => {
    // Ask is a full stage screen, so close any world overlay that would sit
    // on top of it.
    closeWorldOverlays();
    setPulseSeed(seed);
    setStage('pulse');
  };
  const openPulse = (seed?: string) => {
    hasAiConsent().then((ok) => (ok ? goPulse(seed) : setConsentFor({ seed })));
  };

  const handleComplete = (picked: Option[]) => {
    const r = scoreQuiz(picked);
    setAnswers(picked);
    setResult(r);
    setStage('reading');
    saveProfile(r, picked).catch(() => {});
    // The quiz is the onboarding — mark it done so returning users can be routed
    // straight to their plan/dashboard.
    completeOnboarding().catch(() => {});
    // Save the result + onboarding answers to the cloud when signed in (no-op
    // otherwise).
    const onboarding = picked.map((opt, i) => ({
      questionId: QUIZ[i]?.id ?? `q${i}`,
      answer: opt.label,
    }));
    pushResult(
      { animal: r.animal, peak: r.peak, crash: r.crash, recharge: r.recharge },
      onboarding
    ).catch(() => {});
    // Reminders are written for one animal; move them to the new one.
    remindersEnabled()
      .then((on) => (on ? enableReminders(r.animal) : undefined))
      .catch(() => {});
  };

  const reset = () => {
    setResult(null);
    setAnswers([]);
    setStage('landing');
  };

  function closeWorldOverlays() {
    setShowToday(false);
    setShowCheckIn(false);
    setShowTrends(false);
    setShowCard(false);
    setResetLevel(undefined);
  }

  // After "delete my data": drop in-memory state and close every overlay.
  const wipe = () => {
    reset();
    closeWorldOverlays();
    setConsentFor(null);
    setMood(null);
  };

  // Retake from Settings: back to the quiz; the new result replaces the old
  // one when it's finished.
  const retake = () => {
    setShowSettings(false);
    closeWorldOverlays();
    setStage('quiz');
  };

  // Reveal is reached after the quiz or from the plan; back only returns to
  // the plan in the second case.
  const revealFromPlan = useRef(false);
  const toReveal = useCallback(() => {
    revealFromPlan.current = false;
    setStage('reveal');
  }, []);
  const quizBack = useRef<(() => void) | null>(null);
  const registerQuizBack = useCallback((fn: (() => void) | null) => {
    quizBack.current = fn;
  }, []);

  // Android back closes the top-most layer, then steps back through the
  // flow; it only leaves the app from the first screen.
  const back = useRef<() => boolean>(() => false);
  back.current = () => {
    if (showLegal) return setShowLegal(false), true;
    if (showSignIn) return setShowSignIn(false), true;
    if (showScience) return setShowScience(false), true;
    if (showSettings) return setShowSettings(false), true;
    if (consentFor) return setConsentFor(null), true;
    if (resetLevel !== undefined) return setResetLevel(undefined), true;
    if (showCard) return setShowCard(false), true;
    if (showTrends) return setShowTrends(false), true;
    if (showCheckIn) return setShowCheckIn(false), true;
    if (showToday) return setShowToday(false), true;
    if (stage === 'pulse') return setPulseSeed(undefined), setStage('plan'), true;
    if (stage === 'quiz') {
      // The quiz steps back a question; it exits from the first one.
      if (quizBack.current) quizBack.current();
      else setStage(result ? 'plan' : 'landing');
      return true;
    }
    if (stage === 'reading') return true;
    if (stage === 'reveal') {
      if (revealFromPlan.current && result) setStage('plan');
      return true;
    }
    return false;
  };
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => back.current());
    return () => sub.remove();
  }, []);

  // The 3D world behind everything: which camera station, and whose colour.
  const reducedMotion = useReducedMotion();
  const resetOpen = resetLevel !== undefined && !!result;
  const worldOverlay = !!result && (showToday || showCheckIn || showTrends || showCard || resetOpen);
  // Overlays are see-through, so only the top-most one is shown; the ones
  // beneath stay mounted (keeping their state) but hidden.
  const topOverlay = resetOpen
    ? 'reset'
    : showCard
      ? 'card'
      : showTrends
        ? 'trends'
        : showCheckIn
          ? 'checkin'
          : showToday
            ? 'today'
            : null;
  const layer = (id: string) => (topOverlay === id ? styles.overlay : styles.hidden);
  const prevTop = useRef(topOverlay);
  useEffect(() => {
    const was = prevTop.current;
    prevTop.current = topOverlay;
    if (topOverlay === 'today' && (was === 'checkin' || was === 'reset' || was === 'trends')) {
      setTodayKey((k) => k + 1);
    }
  }, [topOverlay]);
  // Full-screen opaque pages: the world behind them is paused and can't be
  // turned by a swipe.
  const opaquePage = showLegal || showSignIn || showScience || showSettings || !!consentFor;
  const displayPrefs = useMemo(() => ({ simple: simpleBg || lowPower }), [simpleBg, lowPower]);
  const worldMode: WorldMode = resetOpen
    ? 'reset'
    : worldOverlay || stage === 'pulse'
      ? 'focus'
      : stage === 'plan'
        ? 'home'
        : stage === 'boot'
          ? 'landing'
          : stage;
  // The floating sound button would cover inputs and buttons on these
  // screens; Settings has the same control.
  const hideSoundButton =
    showLegal ||
    showSignIn ||
    showSettings ||
    !!consentFor ||
    topOverlay === 'card' ||
    stage === 'pulse' ||
    stage === 'quiz' ||
    stage === 'reading';
  const fabBottom = useBottomInset(16);
  const showAnimal = !!result && stage !== 'quiz' && stage !== 'reading' && stage !== 'landing';

  // The soundscape follows the world you're in and the screen you're on.
  const soundWorld = showAnimal ? result!.animal : 'valley';
  useEffect(() => {
    setSoundScene({ world: soundWorld, mode: worldMode });
  }, [soundWorld, worldMode]);

  // Drag to look: a sideways swipe on the open, scenic screens turns the 3D
  // view. Touches are only observed, never claimed, so scrolling and buttons
  // work as usual; a mostly vertical move is treated as a scroll.
  const canLook =
    !reducedMotion &&
    !simpleBg &&
    !lowPower &&
    !worldOverlay &&
    !opaquePage &&
    (stage === 'landing' || stage === 'reveal' || stage === 'plan');
  const touch = useRef<{ x: number; y: number; decided: boolean; look: boolean } | null>(null);
  // Native touch events carry pageX/timestamp; on web they're DOM events,
  // with the position on the first touch point.
  const touchPoint = (e: any) => {
    const n = e.nativeEvent;
    const first = n.touches?.[0] ?? n.changedTouches?.[0];
    return {
      pageX: n.pageX ?? first?.pageX ?? 0,
      pageY: n.pageY ?? first?.pageY ?? 0,
      timestamp: n.timestamp ?? n.timeStamp ?? Date.now(),
    };
  };
  const onTouchStart = (e: any) => {
    if (!canLook) return;
    const { pageX, pageY } = touchPoint(e);
    touch.current = { x: pageX, y: pageY, decided: false, look: false };
  };
  const onTouchMove = (e: any) => {
    const t = touch.current;
    if (!t) return;
    const { pageX, pageY, timestamp } = touchPoint(e);
    if (!t.decided) {
      const dx = Math.abs(pageX - t.x);
      const dy = Math.abs(pageY - t.y);
      if (dx < 8 && dy < 8) return;
      t.decided = true;
      t.look = dx > dy * 1.4;
      if (t.look) dragStart(pageX, timestamp ?? Date.now());
    }
    if (t.look) dragMove(pageX, timestamp ?? Date.now());
  };
  const onTouchEnd = () => {
    if (touch.current?.look) dragEnd();
    touch.current = null;
  };
  // iOS Safari only grants motion access from the end of a tap.
  const onTouchRelease = () => {
    onTouchEnd();
    if (canLook) startWebTilt();
  };

  return (
    <DisplayPrefsContext.Provider value={displayPrefs}>
      <View style={styles.root} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchRelease} onTouchCancel={onTouchEnd}>
        {simpleBg || lowPower ? (
          <SimpleBackdrop />
        ) : (
          <World
            mode={worldMode}
            animal={showAnimal ? result!.animal : null}
            tint={showAnimal ? TINTS[result!.animal] : T.accent}
            mood={mood}
            hop={hop}
            still={reducedMotion}
            paused={opaquePage}
          />
        )}
        {/* While a world-backed overlay is open, hide the stage screen underneath
            (kept mounted) so the overlay floats over the world, not the plan. */}
        <View style={worldOverlay ? styles.hidden : styles.stage}>
        {stage === 'landing' && (
          <FadeIn key="landing">
            <LandingScreen
              onStart={() => setStage('quiz')}
              onLegal={() => setShowLegal(true)}
              onSignIn={() => setShowSignIn(true)}
              onSettings={() => setShowSettings(true)}
              onScience={() => setShowScience(true)}
            />
          </FadeIn>
        )}
        {stage === 'quiz' && (
          <FadeIn key="quiz">
            <QuizScreen
              onComplete={handleComplete}
              onExit={() => setStage(result ? 'plan' : 'landing')}
              onRegisterBack={registerQuizBack}
            />
          </FadeIn>
        )}
        {stage === 'reading' && result && (
          <FadeIn key="reading">
            <ReadingScreen result={result} onDone={toReveal} />
          </FadeIn>
        )}
        {stage === 'reveal' && result && (
          <FadeIn key="reveal">
            <RevealScreen
              result={result}
              onRetake={() => setStage('quiz')}
              onContinue={() => setStage('plan')}
              onShare={() => setShowCard(true)}
            />
          </FadeIn>
        )}
        {stage === 'plan' && result && (
          <FadeIn key="plan">
            <PlanScreen
              result={result}
              onBack={() => {
                revealFromPlan.current = true;
                setStage('reveal');
              }}
              onPulse={openPulse}
              onLegal={() => setShowLegal(true)}
              onSignIn={() => setShowSignIn(true)}
              onScience={() => setShowScience(true)}
              onSettings={() => setShowSettings(true)}
              onCheckIn={() => setShowCheckIn(true)}
              onTrends={() => setShowTrends(true)}
              onShareCard={() => setShowCard(true)}
              checkedInToday={mood != null}
            />
          </FadeIn>
        )}
        {stage === 'pulse' && result && (
          <FadeIn key="pulse">
            <PulseScreen
              result={result}
              answers={answers}
              seed={pulseSeed}
              onBack={() => {
                setPulseSeed(undefined);
                setStage('plan');
              }}
            />
          </FadeIn>
        )}

        </View>

        {showSignIn && (
          <SignInScreen onClose={() => setShowSignIn(false)} onLegal={() => setShowLegal(true)} />
        )}
        {showScience && (
          <ScienceScreen
            accent={result ? ARCHETYPES[result.animal].accent : undefined}
            onClose={() => setShowScience(false)}
          />
        )}
        {showSettings && (
          <SettingsScreen
            result={result}
            muted={muted}
            volume={volume}
            onToggleMute={toggleMute}
            simpleBackground={simpleBg}
            lowPower={lowPower}
            onToggleSimpleBackground={toggleSimpleBg}
            onSetVolume={applyVolume}
            onSignIn={() => {
              setShowSettings(false);
              setShowSignIn(true);
            }}
            onDeleted={wipe}
            onRetake={result ? retake : undefined}
            onLegal={() => setShowLegal(true)}
            onClose={() => setShowSettings(false)}
          />
        )}

        {showToday && result && (
          <View style={layer('today')}>
            <TodayScreen
              key={todayKey}
              result={result}
              onClose={() => setShowToday(false)}
              onCheckIn={() => setShowCheckIn(true)}
              onTrends={() => setShowTrends(true)}
              onReset={() => setResetLevel(null)}
            />
          </View>
        )}
        {showCheckIn && result && (
          <View style={layer('checkin')}>
            <CheckInScreen
              result={result}
              onClose={() => setShowCheckIn(false)}
              onTrends={() => {
                setShowCheckIn(false);
                setShowTrends(true);
              }}
              onExplain={openPulse}
              onReset={(level) => {
                setShowCheckIn(false);
                setResetLevel(level);
              }}
              onSaved={(level) => {
                setMood(level);
                setHop((h) => h + 1);
              }}
            />
          </View>
        )}
        {showTrends && result && (
          <View style={layer('trends')}>
            <TrendsScreen
              result={result}
              onClose={() => setShowTrends(false)}
              onCheckIn={() => {
                setShowTrends(false);
                setShowCheckIn(true);
              }}
              onShare={() => {
                setShowTrends(false);
                setShowCard(true);
              }}
              onAskPulse={openPulse}
            />
          </View>
        )}
        {showCard && result && (
          <View style={layer('card')}>
            <SignalCardScreen result={result} onClose={() => setShowCard(false)} />
          </View>
        )}
        {resetLevel !== undefined && result && (
          <View style={layer('reset')}>
            <ResetScreen
              result={result}
              level={resetLevel ?? undefined}
              onClose={() => setResetLevel(undefined)}
              onCheckIn={() => {
                setResetLevel(undefined);
                setShowCheckIn(true);
              }}
            />
          </View>
        )}

        {/* Consent sits above the overlays it can be opened from. */}
        {consentFor && result && (
          <AiConsentScreen
            accent={ARCHETYPES[result.animal].accent}
            onAllow={() => {
              const { seed } = consentFor;
              setConsentFor(null);
              setAiConsent(true).catch(() => {});
              goPulse(seed);
            }}
            onDecline={() => setConsentFor(null)}
            onPrivacy={() => setShowLegal(true)}
          />
        )}
        {/* Legal renders above every other overlay so any screen can link to it. */}
        {showLegal && <LegalScreen onClose={() => setShowLegal(false)} />}

        {/* Persistent sound mute, always reachable. */}
        {soundSupported && !hideSoundButton && (
          <Pressable
            style={[styles.soundFab, { bottom: fabBottom }]}
            onPress={toggleMute}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={muted ? 'Turn nature sounds on' : 'Turn nature sounds off'}
          >
            <Text style={styles.soundFabIcon}>{muted ? '🔇' : '🔊'}</Text>
          </Pressable>
        )}
      </View>
    </DisplayPrefsContext.Provider>
  );
}

// Catches render errors so a crash shows a readable fallback instead of a blank
// white screen, and lets the user recover without a hard reload.
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.errFill}>
          <Text style={styles.errTitle}>Something hiccuped</Text>
          <Text style={styles.errBody}>
            Wildhour hit an unexpected error. Try again. Your rhythm data is safe.
          </Text>
          <Pressable style={styles.errBtn} onPress={() => this.setState({ error: null })}>
            <Text style={styles.errBtnText}>Reload</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({ SpaceGrotesk_700Bold, JetBrainsMono_500Medium });
  // Never let font loading block the app: show it once fonts load, error, or
  // after a short timeout (fonts then fall back to system until they arrive).
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 2500);
    return () => clearTimeout(t);
  }, []);
  const ready = fontsLoaded || !!fontError || timedOut;

  return (
    <ErrorBoundary>
      <AuthProvider>
        <SafeAreaProvider>
          <StatusBar style="light" />
          {/* Centered max-width column: phones fill it; tablet/desktop get a
              premium centered app instead of edge-to-edge stretch. */}
          <View style={styles.appBg}>
            <View style={styles.appColumn}>
              {ready ? <Flow /> : <View style={{ flex: 1, backgroundColor: T.bg }} />}
            </View>
          </View>
        </SafeAreaProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  appBg: { flex: 1, backgroundColor: '#000', alignItems: 'center' },
  stage: { flex: 1 },
  hidden: { display: 'none' },
  overlay: { ...StyleSheet.absoluteFillObject },
  appColumn: { flex: 1, width: '100%', maxWidth: 520, overflow: 'hidden' },
  errFill: {
    flex: 1,
    backgroundColor: T.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 12 },
  errBody: { color: 'rgba(255,255,255,0.75)', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  errBtn: {
    backgroundColor: T.accent,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 24,
  },
  errBtnText: { color: '#08080A', fontSize: 16, fontWeight: '700' },
  root: { flex: 1 },
  soundFab: {
    position: 'absolute',
    right: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(18,18,20,0.6)',
    borderColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundFabIcon: { fontSize: 16 },
});
