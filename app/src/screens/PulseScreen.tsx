import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ARCHETYPES } from '../data/archetypes';
import { Option } from '../data/quiz';
import { RhythmResult } from '../logic/score';
import { askPulse, ChatTurn, generateReading, hasAI } from '../logic/ai';

export default function PulseScreen({
  result,
  answers,
  onBack,
}: {
  result: RhythmResult;
  answers: Option[];
  onBack: () => void;
}) {
  const a = ARCHETYPES[result.animal];
  const [reading, setReading] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scroller = useRef<ScrollView>(null);

  // Breathing pulse on the orb while Pulse "reads".
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);
  const orbScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] });

  useEffect(() => {
    generateReading(result, answers).then(setReading);
  }, [result, answers]);

  const send = async () => {
    const q = input.trim();
    if (!q || thinking) return;
    setInput('');
    const next = [...turns, { role: 'user' as const, text: q }];
    setTurns(next);
    setThinking(true);
    const reply = await askPulse(result, answers, turns, q);
    setTurns([...next, { role: 'assistant', text: reply }]);
    setThinking(false);
  };

  return (
    <LinearGradient colors={a.gradient} style={styles.fill}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={onBack} hitSlop={12}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>
            {a.emoji}  Pulse
          </Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView
          ref={scroller}
          style={styles.fill}
          contentContainerStyle={styles.body}
          onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}
        >
          {/* The opening reading */}
          <View style={styles.readingCard}>
            <Text style={[styles.readingKicker, { color: a.accent }]}>YOUR FIRST READ</Text>
            {reading ? (
              <Text style={styles.readingText}>{reading}</Text>
            ) : (
              <View style={styles.readingLoading}>
                <Animated.View style={[styles.orb, { backgroundColor: a.accent, transform: [{ scale: orbScale }] }]} />
                <Text style={styles.readingPending}>Reading your patterns…</Text>
              </View>
            )}
          </View>

          {turns.map((t, i) => (
            <View
              key={i}
              style={[styles.bubble, t.role === 'user' ? styles.userBubble : styles.pulseBubble]}
            >
              <Text style={t.role === 'user' ? styles.userText : styles.pulseText}>{t.text}</Text>
            </View>
          ))}

          {thinking && (
            <View style={[styles.bubble, styles.pulseBubble]}>
              <ActivityIndicator color={a.accent} />
            </View>
          )}

          {turns.length === 0 && reading && (
            <Text style={styles.hint}>
              Ask me anything — “when should I work out?”, “why am I so tired at 2pm?”
            </Text>
          )}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={hasAI() ? 'Ask Pulse…' : 'Add an API key to chat'}
            placeholderTextColor="rgba(255,255,255,0.45)"
            editable={hasAI()}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <Pressable
            style={[styles.sendBtn, { backgroundColor: a.accent }, (!input.trim() || thinking) && styles.sendDisabled]}
            onPress={send}
          >
            <Text style={styles.sendText}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  back: { color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: '600', width: 48 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  body: { paddingHorizontal: 18, paddingBottom: 18 },
  readingCard: {
    backgroundColor: 'rgba(14,20,36,0.5)',
    borderColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderRadius: 22,
    padding: 20,
    marginTop: 8,
    marginBottom: 18,
  },
  readingKicker: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  readingText: { color: '#fff', fontSize: 17, lineHeight: 25, fontWeight: '500' },
  readingLoading: { alignItems: 'center', paddingVertical: 16, gap: 14 },
  orb: { width: 54, height: 54, borderRadius: 27, opacity: 0.6 },
  readingPending: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  bubble: { maxWidth: '85%', borderRadius: 18, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 10 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: 'rgba(255,255,255,0.92)' },
  pulseBubble: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.14)', borderWidth: 1 },
  userText: { color: '#0E1424', fontSize: 15, fontWeight: '600', lineHeight: 21 },
  pulseText: { color: '#fff', fontSize: 15, lineHeight: 22 },
  hint: { color: 'rgba(255,255,255,0.55)', fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 19 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 28, paddingTop: 6 },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 18,
    color: '#fff',
    fontSize: 15,
  },
  sendBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { opacity: 0.4 },
  sendText: { color: '#0E1424', fontSize: 22, fontWeight: '800' },
});
