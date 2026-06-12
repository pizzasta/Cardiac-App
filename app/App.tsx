import React, { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HookScreen from './src/screens/HookScreen';
import QuizScreen from './src/screens/QuizScreen';
import ReadingScreen from './src/screens/ReadingScreen';
import RevealScreen from './src/screens/RevealScreen';
import { Option } from './src/data/quiz';
import { RhythmResult, scoreQuiz } from './src/logic/score';

type Stage = 'hook' | 'quiz' | 'reading' | 'reveal';

export default function App() {
  const [stage, setStage] = useState<Stage>('hook');
  const [result, setResult] = useState<RhythmResult | null>(null);

  const handleComplete = (answers: Option[]) => {
    setResult(scoreQuiz(answers));
    setStage('reading');
  };

  const reset = () => {
    setResult(null);
    setStage('hook');
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {stage === 'hook' && <HookScreen onStart={() => setStage('quiz')} />}
      {stage === 'quiz' && <QuizScreen onComplete={handleComplete} />}
      {stage === 'reading' && (
        <ReadingScreen onDone={() => setStage('reveal')} />
      )}
      {stage === 'reveal' && result && (
        <RevealScreen
          result={result}
          onRetake={reset}
          onContinue={() =>
            // The account wall / Today dashboard lives beyond the prototype.
            Alert.alert(
              'Next: your Today screen',
              'In the full app this is where the adaptive dashboard and Pulse AI begin.'
            )
          }
        />
      )}
    </SafeAreaProvider>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const styles = StyleSheet.create({});
