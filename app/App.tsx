import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HookScreen from './src/screens/HookScreen';
import QuizScreen from './src/screens/QuizScreen';
import ReadingScreen from './src/screens/ReadingScreen';
import RevealScreen from './src/screens/RevealScreen';
import PlanScreen from './src/screens/PlanScreen';
import PulseScreen from './src/screens/PulseScreen';
import { Option } from './src/data/quiz';
import { RhythmResult, scoreQuiz } from './src/logic/score';

type Stage = 'hook' | 'quiz' | 'reading' | 'reveal' | 'plan' | 'pulse';

export default function App() {
  const [stage, setStage] = useState<Stage>('hook');
  const [result, setResult] = useState<RhythmResult | null>(null);
  // Kept around so the plan + Pulse can ground content in the user's answers.
  const [answers, setAnswers] = useState<Option[]>([]);
  // A question to open Pulse with (set when a tip is tapped on the plan).
  const [pulseSeed, setPulseSeed] = useState<string | undefined>(undefined);

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
    <SafeAreaProvider>
      <StatusBar style="light" />
      {stage === 'hook' && <HookScreen onStart={() => setStage('quiz')} />}
      {stage === 'quiz' && <QuizScreen onComplete={handleComplete} />}
      {stage === 'reading' && <ReadingScreen onDone={() => setStage('reveal')} />}
      {stage === 'reveal' && result && (
        <RevealScreen
          result={result}
          onRetake={reset}
          onContinue={() => setStage('plan')}
        />
      )}
      {stage === 'plan' && result && (
        <PlanScreen
          result={result}
          onBack={() => setStage('reveal')}
          onPulse={openPulse}
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
    </SafeAreaProvider>
  );
}
