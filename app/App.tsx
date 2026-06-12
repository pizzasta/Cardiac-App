import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HookScreen from './src/screens/HookScreen';
import QuizScreen from './src/screens/QuizScreen';
import ReadingScreen from './src/screens/ReadingScreen';
import RevealScreen from './src/screens/RevealScreen';
import PulseScreen from './src/screens/PulseScreen';
import { Option } from './src/data/quiz';
import { RhythmResult, scoreQuiz } from './src/logic/score';

type Stage = 'hook' | 'quiz' | 'reading' | 'reveal' | 'pulse';

export default function App() {
  const [stage, setStage] = useState<Stage>('hook');
  const [result, setResult] = useState<RhythmResult | null>(null);
  // Kept around so Pulse can ground its reading in the user's actual answers.
  const [answers, setAnswers] = useState<Option[]>([]);

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
          onContinue={() => setStage('pulse')}
        />
      )}
      {stage === 'pulse' && result && (
        <PulseScreen result={result} answers={answers} onBack={() => setStage('reveal')} />
      )}
    </SafeAreaProvider>
  );
}
