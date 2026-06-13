import React, { useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Option, QUIZ } from '../data/quiz';

export default function QuizScreen({
  onComplete,
}: {
  onComplete: (answers: Option[]) => void;
}) {
  const [index, setIndex] = useState(0);
  const answers = useRef<Option[]>([]);
  const fade = useRef(new Animated.Value(1)).current;

  const question = QUIZ[index];
  const progress = (index + 1) / QUIZ.length;

  const select = (opt: Option) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    answers.current[index] = opt;

    // Selecting advances — no "Next" button.
    Animated.timing(fade, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start(() => {
      if (index + 1 >= QUIZ.length) {
        onComplete(answers.current);
        return;
      }
      setIndex((i) => i + 1);
      Animated.timing(fade, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <LinearGradient colors={['#08080A', '#121016', '#08080A']} style={styles.fill}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.count}>
        {index + 1} / {QUIZ.length}
      </Text>

      <Animated.View style={[styles.body, { opacity: fade }]}>
        <Text style={styles.prompt}>{question.prompt}</Text>

        <View style={styles.options}>
          {question.options.map((opt) => (
            <Pressable
              key={opt.label}
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              onPress={() => select(opt)}
            >
              <Text style={styles.optionText}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, paddingHorizontal: 24, paddingTop: 72, paddingBottom: 40 },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  progressFill: { height: 5, borderRadius: 3, backgroundColor: '#FF2E7E' },
  count: {
    color: 'rgba(255,255,255,0.55)',
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
  },
  body: { flex: 1, justifyContent: 'center' },
  prompt: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 38,
    marginBottom: 36,
  },
  options: { gap: 14 },
  option: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 22,
  },
  optionPressed: {
    backgroundColor: 'rgba(255,46,126,0.18)',
    borderColor: '#FF2E7E',
  },
  optionText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
