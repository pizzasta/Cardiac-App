import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
} from './src/logic/sound';
import LandingScreen from './src/screens/LandingScreen';
import QuizScreen from './src/screens/QuizScreen';
import ReadingScreen from './src/screens/ReadingScreen';
import RevealScreen from './src/screens/RevealScreen';
import PlanScreen from './src/screens/PlanScreen';
import PulseScreen from './src/screens/PulseScreen';
import LegalScreen from './src/screens/LegalScreen';
import SignInScreen from './src/screens/SignInScreen';
import ScienceScreen from './src/screens/ScienceScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CheckInScreen from './src/screens/CheckInScreen';
import TrendsScreen from './src/screens/TrendsScreen';
import SignalCardScreen from './src/screens/SignalCardScreen';
import FadeIn from './src/components/FadeIn';
import { Option } from './src/data/quiz';
import { ARCHETYPES } from './src/data/archetypes';
import { RhythmResult, scoreQuiz } from './src/logic/score';
import { AuthProvider, useAuth } from './src/logic/auth';
import { useFonts, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { T } from './src/theme';

type Stage = 'landing' | 'quiz' | 'reading' | 'reveal' | 'plan' | 'pulse';

function Flow() {
  const [stage, setStage] = useState<Stage>('landing');
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
  const [showTrends, setShowTrends] = useState(false);
  const [showCard, setShowCard] = useState(false);
  // App-wide rainforest ambience + persistent mute/volume (remembered across visits).
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.6);
  const { completeOnboarding } = useAuth();

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
      if (m === 'true') setMuted(true); // honor a saved mute — stay silent
      else enableAutoStart(); // default: ambience on
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

  const openPulse = (seed?: string) => {
    setPulseSeed(seed);
    setStage('pulse');
  };

  const handleComplete = (picked: Option[]) => {
    setAnswers(picked);
    setResult(scoreQuiz(picked));
    setStage('reading');
    // The quiz is the onboarding — mark it done so returning users can be routed
    // straight to their plan/dashboard.
    completeOnboarding().catch(() => {});
  };

  const reset = () => {
    setResult(null);
    setAnswers([]);
    setStage('landing');
  };

  return (
    <>
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
          <QuizScreen onComplete={handleComplete} />
        </FadeIn>
      )}
      {stage === 'reading' && (
        <FadeIn key="reading">
          <ReadingScreen onDone={() => setStage('reveal')} />
        </FadeIn>
      )}
      {stage === 'reveal' && result && (
        <FadeIn key="reveal">
          <RevealScreen
            result={result}
            onRetake={reset}
            onContinue={() => setStage('plan')}
            onShare={() => setShowCard(true)}
          />
        </FadeIn>
      )}
      {stage === 'plan' && result && (
        <FadeIn key="plan">
          <PlanScreen
            result={result}
            onBack={() => setStage('reveal')}
            onPulse={openPulse}
            onLegal={() => setShowLegal(true)}
            onSignIn={() => setShowSignIn(true)}
            onScience={() => setShowScience(true)}
            onSettings={() => setShowSettings(true)}
            onCheckIn={() => setShowCheckIn(true)}
            onTrends={() => setShowTrends(true)}
            onShareCard={() => setShowCard(true)}
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

      {showLegal && <LegalScreen onClose={() => setShowLegal(false)} />}
      {showSignIn && <SignInScreen onClose={() => setShowSignIn(false)} />}
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
          onSetVolume={applyVolume}
          onSignIn={() => {
            setShowSettings(false);
            setShowSignIn(true);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showCheckIn && result && (
        <CheckInScreen
          result={result}
          onClose={() => setShowCheckIn(false)}
          onTrends={() => {
            setShowCheckIn(false);
            setShowTrends(true);
          }}
        />
      )}
      {showTrends && result && (
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
        />
      )}
      {showCard && result && (
        <SignalCardScreen result={result} onClose={() => setShowCard(false)} />
      )}

      {/* Persistent ambience mute — always reachable, all screens. */}
      {soundSupported && (
        <Pressable style={styles.soundFab} onPress={toggleMute} hitSlop={8}>
          <Text style={styles.soundFabIcon}>{muted ? '🔇' : '🔊'}</Text>
        </Pressable>
      )}
    </>
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
            Circadia hit an unexpected error. Try again — your rhythm data is safe.
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
  soundFab: {
    position: 'absolute',
    bottom: 104,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(18,18,20,0.6)',
    borderColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundFabIcon: { fontSize: 18 },
});
