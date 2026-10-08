import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Option, QUIZ } from '../data/quiz';
import { playSfx } from '../logic/sfx';
import { haptic } from '../logic/haptics';
import { useBottomInset, useTopInset } from '../hooks';

export default function QuizScreen({
  onComplete,
  onExit,
  onRegisterBack,
}: {
  onComplete: (answers: Option[]) => void;
  onExit?: () => void;
  // Hands the app this screen's back step (for the Android back button);
  // called with null on unmount.
  onRegisterBack?: (back: (() => void) | null) => void;
}) {
  const [index, setIndex] = useState(0);
  // The option just tapped stays lit while the question fades out.
  const [picked, setPicked] = useState<string | null>(null);
  const answers = useRef<Option[]>([]);
  const fade = useRef(new Animated.Value(1)).current;
  // Ignores taps while a question transition is running, so a double tap
  // can't skip a question or complete the quiz twice.
  const busy = useRef(false);
  const done = useRef(false);
  const topInset = useTopInset();
  const bottomInset = useBottomInset(40);

  const question = QUIZ[index];
  const progress = (index + 1) / QUIZ.length;

  const fadeIn = () => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      busy.current = false;
    });
  };

  const select = (opt: Option) => {
    if (busy.current || done.current) return;
    busy.current = true;
    setPicked(opt.label);
    playSfx('select');
    haptic('tap');
    const at = index;
    answers.current[at] = opt;

    // Selecting advances, no "Next" button.
    Animated.timing(fade, {
      toValue: 0,
      duration: 160,
      delay: 140,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        fade.setValue(1);
        setPicked(null);
        busy.current = false;
        return;
      }
      if (at + 1 >= QUIZ.length) {
        done.current = true;
        onComplete(answers.current.slice(0, QUIZ.length));
        return;
      }
      setPicked(null);
      setIndex(at + 1);
      fadeIn();
    });
  };

  const back = () => {
    if (busy.current || done.current) return;
    if (index === 0) {
      if (onExit) {
        haptic('select');
        onExit();
      }
      return;
    }
    busy.current = true;
    haptic('select');
    const prev = index - 1;
    // Drop the answer being revisited; it gets chosen again.
    answers.current.length = prev;
    Animated.timing(fade, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setIndex(prev);
      else fade.setValue(1);
      fadeIn();
    });
  };

  const backRef = useRef(back);
  backRef.current = back;
  useEffect(() => {
    if (!onRegisterBack) return;
    onRegisterBack(() => backRef.current());
    return () => onRegisterBack(null);
  }, [onRegisterBack]);

  return (
    <LinearGradient
      colors={['rgba(6,6,10,0.1)', 'rgba(6,6,10,0.35)', 'rgba(6,6,10,0.8)']}
      style={styles.fill}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topInset + 16, paddingBottom: bottomInset },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.count}>
            {index + 1} / {QUIZ.length}
            {index === Math.floor(QUIZ.length / 2) ? '  ·  Halfway there' : ''}
            {index === QUIZ.length - 1 ? '  ·  Last one' : ''}
          </Text>
          {index > 0 || onExit ? (
            <Pressable
              onPress={back}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={index > 0 ? 'Back to the previous question' : 'Leave the quiz'}
            >
              <Text style={styles.back}>‹ Back</Text>
            </Pressable>
          ) : null}
        </View>

        <Animated.View style={[styles.body, { opacity: fade }]}>
          <Text style={styles.prompt}>{question.prompt}</Text>

          <View style={styles.options}>
            {question.options.map((opt) => (
              <Pressable
                key={opt.label}
                accessibilityRole="button"
                accessibilityState={{ selected: picked === opt.label }}
                style={({ pressed }) => [styles.option, (pressed || picked === opt.label) && styles.optionPressed]}
                onPress={() => select(opt)}
              >
                <Text style={styles.optionText}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  progressFill: { height: 5, borderRadius: 3, backgroundColor: '#FF2E7E' },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  count: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
  },
  back: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  body: { flex: 1, justifyContent: 'center', paddingTop: 24 },
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
