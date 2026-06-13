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
} from './src/logic/sound';
import HookScreen from './src/screens/HookScreen';
import QuizScreen from './src/screens/QuizScreen';
import ReadingScreen from './src/screens/ReadingScreen';
import RevealScreen from './src/screens/RevealScreen';
import PlanScreen from './src/screens/PlanScreen';
import PulseScreen from './src/screens/PulseScreen';
import LegalScreen from './src/screens/LegalScreen';
import SignInScreen from './src/screens/SignInScreen';
import ScienceScreen from './src/screens/ScienceScreen';
import { Option } from './src/data/quiz';
import { ARCHETYPES } from './src/data/archetypes';
import { RhythmResult, scoreQuiz } from './src/logic/score';
import { AuthProvider } from './src/logic/auth';

type Stage = 'hook' | 'quiz' | 'reading' | 'reveal' | 'plan' | 'pulse';

function Flow() {
  const [stage, setStage] = useState<Stage>('hook');
  const [result, setResult] = useState<RhythmResult | null>(null);
  // Kept around so the plan + Pulse can ground content in the user's answers.
  const [answers, setAnswers] = useState<Option[]>([]);
  // A question to open Pulse with (set when a tip is tapped on the plan).
  const [pulseSeed, setPulseSeed] = useState<string | undefined>(undefined);
  // Overlays, openable from any screen.
  const [showLegal, setShowLegal] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showScience, setShowScience] = useState(false);
  // App-wide rainforest ambience + persistent mute (remembered across visits).
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem('circadia.muted')
      .then((v) => {
        if (!active) return;
        if (v === 'true') setMuted(true); // honor a saved mute — stay silent
        else enableAutoStart(); // default: ambience on
      })
      .catch(() => enableAutoStart());
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

  const openPulse = (seed?: string) => {
    setPulseSeed(seed);
    setStage('pulse');
  };

  const handleComplete = (picked: Option[]) => {
    setAnswers(picked);
    setResult(scoreQuiz(picked));
    setStage('reading');
  };

  const reset = () => {
    setResult(null);
    setAnswers([]);
    setStage('hook');
  };

  return (
    <>
      {stage === 'hook' && (
        <HookScreen
          onStart={() => setStage('quiz')}
          onLegal={() => setShowLegal(true)}
          onSignIn={() => setShowSignIn(true)}
        />
      )}
      {stage === 'quiz' && <QuizScreen onComplete={handleComplete} />}
      {stage === 'reading' && <ReadingScreen onDone={() => setStage('reveal')} />}
      {stage === 'reveal' && result && (
        <RevealScreen result={result} onRetake={reset} onContinue={() => setStage('plan')} />
      )}
      {stage === 'plan' && result && (
        <PlanScreen
          result={result}
          onBack={() => setStage('reveal')}
          onPulse={openPulse}
          onLegal={() => setShowLegal(true)}
          onSignIn={() => setShowSignIn(true)}
          onScience={() => setShowScience(true)}
        />
      )}
      {stage === 'pulse' && result && (
        <PulseScreen
          result={result}
          answers={answers}
          seed={pulseSeed}
          onBack={() => {
            setPulseSeed(undefined);
            setStage('plan');
          }}
        />
      )}

      {showLegal && <LegalScreen onClose={() => setShowLegal(false)} />}
      {showSignIn && <SignInScreen onClose={() => setShowSignIn(false)} />}
      {showScience && (
        <ScienceScreen
          accent={result ? ARCHETYPES[result.animal].accent : undefined}
          onClose={() => setShowScience(false)}
        />
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
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <Flow />
        </SafeAreaProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errFill: {
    flex: 1,
    backgroundColor: '#0E1424',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 12 },
  errBody: { color: 'rgba(255,255,255,0.75)', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  errBtn: {
    backgroundColor: '#2BD9C8',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 24,
  },
  errBtnText: { color: '#0E1424', fontSize: 16, fontWeight: '700' },
  soundFab: {
    position: 'absolute',
    bottom: 104,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(8,21,17,0.55)',
    borderColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundFabIcon: { fontSize: 18 },
});
