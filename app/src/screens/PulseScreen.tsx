import React, { useEffect, useRef, useState } from 'react';
import {
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
import * as Speech from 'expo-speech';
import { ARCHETYPES } from '../data/archetypes';
import { Option } from '../data/quiz';
import { RhythmResult } from '../logic/score';
import { askPulse, ChatTurn, generateReading, hasAI } from '../logic/ai';
import { listen, voiceSupported } from '../logic/voice';
import { DISCLAIMER_SHORT } from '../data/disclaimer';
import Atmosphere from '../components/Atmosphere';
import PulseLoader from '../components/PulseLoader';
import { F } from '../theme';

export default function PulseScreen({
  result,
  answers,
  onBack,
  seed,
}: {
  result: RhythmResult;
  answers: Option[];
  onBack: () => void;
  // If set (e.g. from tapping a tip on the Plan screen), Pulse opens with this
  // question already asked.
  seed?: string;
}) {
  const a = ARCHETYPES[result.animal];
  const [reading, setReading] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const [speak, setSpeak] = useState(false);
  const speakRef = useRef(false);
  const stopListenRef = useRef<null | (() => void)>(null);
  const seededRef = useRef(false);
  const scroller = useRef<ScrollView>(null);

  useEffect(() => {
    generateReading(result, answers).then(setReading);
    return () => {
      Speech.stop();
    };
  }, [result, answers]);

  // Auto-ask the seeded question (e.g. "go deeper on this tip") once on open.
  useEffect(() => {
    if (seed && !seededRef.current) {
      seededRef.current = true;
      send(seed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  const say = (text: string) => {
    if (speakRef.current) Speech.speak(text, { rate: 0.98, pitch: 1.0 });
  };

  const toggleSpeak = () => {
    const next = !speak;
    setSpeak(next);
    speakRef.current = next;
    if (!next) Speech.stop();
  };

  const send = async (override?: string) => {
    const q = (override ?? input).trim();
    if (!q || thinking) return;
    setInput('');
    const next = [...turns, { role: 'user' as const, text: q }];
    setTurns(next);
    setThinking(true);
    const reply = await askPulse(result, answers, turns, q);
    setTurns([...next, { role: 'assistant', text: reply }]);
    setThinking(false);
    say(reply);
  };

  const toggleMic = () => {
    if (listening) {
      stopListenRef.current?.();
      setListening(false);
      return;
    }
    Speech.stop();
    setListening(true);
    stopListenRef.current = listen(
      (text) => {
        setListening(false);
        send(text);
      },
      () => setListening(false),
      () => setListening(false)
    );
  };

  return (
    <View style={styles.fill}>
      <Atmosphere style={StyleSheet.absoluteFill} accent={a.accent} />
      <LinearGradient
        colors={[`${a.gradient[0]}cc`, 'rgba(8,8,10,0.8)', 'rgba(8,8,10,0.94)']}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={onBack} hitSlop={12}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{a.emoji}  Pulse</Text>
          <Pressable onPress={toggleSpeak} hitSlop={12} style={styles.speaker}>
            <Text style={[styles.speakerIcon, speak && { color: a.accent }]}>
              {speak ? '🔊' : '🔇'}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          ref={scroller}
          style={styles.fill}
          contentContainerStyle={styles.body}
          onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}
        >
          <Pressable style={styles.readingCard} onPress={() => reading && say(reading)}>
            <Text style={[styles.readingKicker, { color: a.accent }]}>YOUR FIRST READ</Text>
            {reading ? (
              <Text style={styles.readingText}>{reading}</Text>
            ) : (
              <PulseLoader color={a.accent} label="READING YOUR PATTERNS" />
            )}
          </Pressable>

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
              <PulseLoader color={a.accent} width={90} height={24} />
            </View>
          )}

          {turns.length === 0 && reading && (
            <Text style={styles.hint}>
              {voiceSupported
                ? 'Tap the mic and talk, or type. Tap the reading to hear it.'
                : 'Ask me anything — “when should I work out?”, “why am I tired at 2pm?”'}
            </Text>
          )}
        </ScrollView>

        <View style={styles.inputRow}>
          {voiceSupported && (
            <Pressable
              style={[
                styles.micBtn,
                { borderColor: a.accent },
                listening && { backgroundColor: a.accent },
              ]}
              onPress={toggleMic}
            >
              <Text style={[styles.micIcon, listening && { color: '#08080A' }]}>🎙</Text>
            </Pressable>
          )}
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={
              listening ? 'Listening…' : hasAI() ? 'Ask Pulse…' : 'Add an API key to chat'
            }
            placeholderTextColor="rgba(255,255,255,0.45)"
            editable={hasAI() && !listening}
            onSubmitEditing={() => send()}
            returnKeyType="send"
          />
          <Pressable
            style={[
              styles.sendBtn,
              { backgroundColor: a.accent },
              (!input.trim() || thinking) && styles.sendDisabled,
            ]}
            onPress={() => send()}
          >
            <Text style={styles.sendText}>↑</Text>
          </Pressable>
        </View>
        <Text style={styles.disclaimer}>{DISCLAIMER_SHORT}</Text>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#08080A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  back: { color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: '600', width: 48 },
  headerTitle: { color: '#fff', fontSize: 18, fontFamily: F.display },
  speaker: { width: 48, alignItems: 'flex-end' },
  speakerIcon: { fontSize: 18, color: 'rgba(255,255,255,0.6)' },
  body: { paddingHorizontal: 18, paddingBottom: 18 },
  readingCard: {
    backgroundColor: 'rgba(18,18,20,0.55)',
    borderColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderRadius: 22,
    padding: 20,
    marginTop: 8,
    marginBottom: 18,
  },
  readingKicker: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  readingText: { color: '#fff', fontSize: 17, lineHeight: 25, fontWeight: '500' },
  readingPending: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  bubble: { maxWidth: '85%', borderRadius: 18, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 10 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: 'rgba(255,255,255,0.92)' },
  pulseBubble: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.14)', borderWidth: 1 },
  userText: { color: '#08080A', fontSize: 15, fontWeight: '600', lineHeight: 21 },
  pulseText: { color: '#fff', fontSize: 15, lineHeight: 22 },
  hint: { color: 'rgba(255,255,255,0.55)', fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 19 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 8, paddingTop: 6 },
  disclaimer: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    textAlign: 'center',
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  micBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micIcon: { fontSize: 18, color: '#fff' },
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
  sendText: { color: '#08080A', fontSize: 22, fontWeight: '800' },
});
