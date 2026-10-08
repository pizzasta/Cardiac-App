import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useBottomInset, useTopInset } from '../hooks';
import * as Speech from 'expo-speech';
import { ARCHETYPES } from '../data/archetypes';
import { Option } from '../data/quiz';
import { RhythmResult } from '../logic/score';
import { askPulse, buildReportMailto, ChatTurn, generateReading, hasAI, summarizeCheckIns } from '../logic/ai';
import { load as loadCheckIns } from '../logic/pulselog';
import { LEGAL } from '../data/legal';
import { listen, voiceSupported } from '../logic/voice';
import { DISCLAIMER_SHORT } from '../data/disclaimer';
import PulseLoader from '../components/PulseLoader';
import { F } from '../theme';
import Scrim from '../components/Scrim';

// Starter questions. The check-in ones only make sense once there are
// check-ins to look at; otherwise offer questions the quiz profile can answer.
const CHECKIN_IDEAS = [
  'What changed in my rhythm this week?',
  'What looks different on my better days?',
  'Is this actually a pattern yet?',
  'What is one small experiment I could try tomorrow?',
];
const PROFILE_IDEAS = [
  'When should I do my hardest work?',
  'How do I handle my afternoon dip?',
  'What helps me recharge best?',
  'What is one small experiment I could try tomorrow?',
];

export default function PulseScreen({
  result,
  answers,
  onBack,
  seed,
}: {
  result: RhythmResult;
  answers: Option[];
  onBack: () => void;
  // If set (e.g. from tapping a tip on the Plan screen), the chat opens with this
  // question already asked.
  seed?: string;
}) {
  const a = ARCHETYPES[result.animal];
  const [reading, setReading] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const [whyOpen, setWhyOpen] = useState<number | null>(null);
  const [reported, setReported] = useState<number[]>([]);
  const [reportNote, setReportNote] = useState<string | null>(null);
  // The last question failed to get an answer: shown as an error bubble.
  const [failed, setFailed] = useState<{ question: string; message: string; retryable: boolean } | null>(null);
  const [speak, setSpeak] = useState(false);
  const speakRef = useRef(false);
  const stopListenRef = useRef<null | (() => void)>(null);
  const seededRef = useRef(false);
  const lastSentRef = useRef(0);
  const scroller = useRef<ScrollView>(null);
  // False once the screen unmounts: late replies must not set state or speak.
  const mountedRef = useRef(true);
  // Compact summary of recent check-ins sent with chat questions ('' = none).
  // null until loaded; the ref lets a seeded question wait for it.
  const [checkins, setCheckins] = useState<string | null>(null);
  const checkinsRef = useRef<Promise<string> | null>(null);

  const getCheckins = () => {
    if (!checkinsRef.current) {
      checkinsRef.current = loadCheckIns()
        .then((log) => summarizeCheckIns(log))
        .catch(() => '');
    }
    return checkinsRef.current;
  };

  useEffect(() => {
    mountedRef.current = true;
    getCheckins().then((s) => {
      if (mountedRef.current) setCheckins(s);
    });
    return () => {
      mountedRef.current = false;
      // Close the mic (web keeps it open otherwise) and stop any speech.
      stopListenRef.current?.();
      stopListenRef.current = null;
      Speech.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The reading is cached per profile in ai.ts for the session, so reopening
  // the screen doesn't spend another request.
  useEffect(() => {
    let live = true;
    setReading(null);
    generateReading(result, answers).then((text) => {
      if (live && mountedRef.current) setReading(text);
    });
    return () => {
      live = false;
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
    if (mountedRef.current && speakRef.current) Speech.speak(text, { rate: 0.98, pitch: 1.0 });
  };

  const toggleSpeak = () => {
    const next = !speak;
    setSpeak(next);
    speakRef.current = next;
    if (!next) Speech.stop();
  };

  // `base` is the conversation so far (without this question).
  const ask = async (q: string, base: ChatTurn[]) => {
    const next = [...base, { role: 'user' as const, text: q }];
    setTurns(next);
    setFailed(null);
    setThinking(true);
    try {
      const summary = await getCheckins();
      const reply = await askPulse(result, answers, base, q, summary);
      if (!mountedRef.current) return;
      if (reply.ok) {
        setTurns([...next, { role: 'assistant', text: reply.text }]);
        say(reply.text);
      } else {
        setFailed({ question: q, message: reply.message, retryable: reply.retryable });
      }
    } finally {
      if (mountedRef.current) setThinking(false);
    }
  };

  const send = (override?: string) => {
    const q = (override ?? input).trim();
    if (!q || thinking) return;
    // Rate limit: ignore sends fired faster than ~1.2s apart (cost + abuse).
    const now = Date.now();
    if (now - lastSentRef.current < 1200) return;
    lastSentRef.current = now;
    setInput('');
    // An unanswered question is dropped from the history before moving on.
    ask(q, failed ? turns.slice(0, -1) : turns);
  };

  const retry = () => {
    if (!failed || thinking) return;
    ask(failed.question, turns.slice(0, -1));
  };

  const report = (i: number) => {
    const question = turns[i - 1]?.role === 'user' ? turns[i - 1].text : '';
    Linking.openURL(buildReportMailto(LEGAL.contactEmail, question, turns[i].text))
      .then(() => {
        if (mountedRef.current) setReported((r) => (r.includes(i) ? r : [...r, i]));
      })
      .catch(() => {
        if (mountedRef.current) setReportNote(`To report an answer, email ${LEGAL.contactEmail}.`);
      });
  };

  const toggleMic = () => {
    if (listening) {
      stopListenRef.current?.();
      setListening(false);
      return;
    }
    Speech.stop();
    setListening(true);
    const done = () => {
      if (mountedRef.current) setListening(false);
    };
    stopListenRef.current = listen(
      (text) => {
        if (!mountedRef.current) return;
        setListening(false);
        send(text);
      },
      done,
      done
    );
  };

  const topInset = useTopInset();
  const bottomInset = useBottomInset();
  const sendDisabled = !input.trim() || thinking || !hasAI();
  return (
    <View style={styles.fill}>
      <Scrim shade="strong" />

      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.header, { paddingTop: topInset }]}>
          <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{a.emoji}  Ask Wildhour</Text>
          <Pressable
            onPress={toggleSpeak}
            hitSlop={12}
            style={styles.speaker}
            accessibilityRole="switch"
            accessibilityLabel="Read answers aloud"
            accessibilityState={{ checked: speak }}
          >
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
            <View key={i} style={[styles.bubble, t.role === 'user' ? styles.userBubble : styles.pulseBubble]}>
              <Text style={t.role === 'user' ? styles.userText : styles.pulseText}>{t.text}</Text>
              {t.role === 'assistant' && (
                <View style={styles.evidenceActions}>
                  <Pressable onPress={() => setWhyOpen(whyOpen === i ? null : i)} hitSlop={12} accessibilityRole="button">
                    <Text style={[styles.evidenceLink, { color: a.accent }]}>Why this answer</Text>
                  </Pressable>
                  <Pressable onPress={() => report(i)} hitSlop={12} accessibilityRole="button">
                    <Text style={styles.reportLink}>{reported.includes(i) ? 'Reported ✓' : 'Report response'}</Text>
                  </Pressable>
                </View>
              )}
              {t.role === 'assistant' && whyOpen === i && (
                <View style={styles.evidenceCard}>
                  <Text style={styles.evidenceTitle}>WHAT THIS ANSWER USED</Text>
                  <Text style={styles.evidenceText}>
                    {checkins
                      ? 'Your Wildhour quiz profile, a summary of your check-ins from the last two weeks, the question you asked, and the conversation shown here.'
                      : 'Your Wildhour quiz profile, the question you asked, and the conversation shown here.'}
                  </Text>
                  <Text style={styles.evidenceFine}>
                    Answers are reflections, not diagnoses. Patterns in your check-ins are associations, not proof of cause.
                  </Text>
                </View>
              )}
            </View>
          ))}

          {failed && !thinking && (
            <View style={[styles.bubble, styles.pulseBubble, styles.errorBubble]}>
              <Text style={styles.pulseText}>{failed.message}</Text>
              {failed.retryable && (
                <Pressable onPress={retry} hitSlop={12} accessibilityRole="button" style={styles.retryBtn}>
                  <Text style={[styles.retryText, { color: a.accent }]}>Try again</Text>
                </Pressable>
              )}
            </View>
          )}
          {reportNote && <Text style={styles.hint}>{reportNote}</Text>}

          {thinking && (
            <View style={[styles.bubble, styles.pulseBubble]}>
              <PulseLoader color={a.accent} width={90} height={24} />
            </View>
          )}

          {turns.length === 0 && reading && checkins !== null && (
            <View style={styles.quickWrap}>
              <Text style={[styles.quickLabel, { color: a.accent }]}>IDEAS TO ASK</Text>
              <View style={styles.quickRow}>
                {(checkins ? CHECKIN_IDEAS : PROFILE_IDEAS).map((q) => (
                  <Pressable key={q} style={styles.quickChip} onPress={() => send(q)}>
                    <Text style={styles.quickText}>{q}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {turns.length === 0 && reading && (
            <Text style={styles.hint}>
              {voiceSupported
                ? 'Tap the mic and talk, or type. Tap the reading to hear it.'
                : 'Ask anything, like “when should I work out?” or “why am I tired at 2pm?”'}
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
              accessibilityRole="button"
              accessibilityLabel={listening ? 'Stop voice input' : 'Voice input'}
            >
              <Text style={[styles.micIcon, listening && { color: '#08080A' }]}>🎙</Text>
            </Pressable>
          )}
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={
              listening ? 'Listening…' : hasAI() ? 'Ask a question…' : 'Not available right now'
            }
            placeholderTextColor="rgba(255,255,255,0.45)"
            editable={hasAI() && !listening}
            onSubmitEditing={() => send()}
            returnKeyType="send"
          />
          <Pressable
            style={[styles.sendBtn, { backgroundColor: a.accent }, sendDisabled && styles.sendDisabled]}
            onPress={() => send()}
            disabled={sendDisabled}
            accessibilityRole="button"
            accessibilityLabel="Send"
            accessibilityState={{ disabled: sendDisabled }}
          >
            <Text style={styles.sendText}>↑</Text>
          </Pressable>
        </View>
        <Text style={[styles.disclaimer, { paddingBottom: bottomInset }]}>{DISCLAIMER_SHORT}</Text>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  back: { color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: '600', width: 64 },
  headerTitle: { color: '#fff', fontSize: 18, fontFamily: F.display },
  speaker: { width: 64, alignItems: 'flex-end' },
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
  errorBubble: { borderColor: 'rgba(255,59,92,0.45)' },
  retryBtn: { marginTop: 8, alignSelf: 'flex-start' },
  retryText: { fontSize: 14, fontWeight: '700' },
  hint: { color: 'rgba(255,255,255,0.55)', fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 19 },
  quickWrap: { marginBottom: 16 },
  quickLabel: { fontFamily: F.mono, fontSize: 11, letterSpacing: 1, marginBottom: 10 },
  quickRow: { gap: 8 },
  quickChip: { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 13 },
  quickText: { color: '#fff', fontSize: 13, lineHeight: 18 },
  evidenceActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginTop: 10 },
  evidenceLink: { fontFamily: F.mono, fontSize: 10 },
  reportLink: { color: 'rgba(255,255,255,0.48)', fontFamily: F.mono, fontSize: 10 },
  evidenceCard: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)' },
  evidenceTitle: { color: 'rgba(255,255,255,0.55)', fontFamily: F.mono, fontSize: 9, letterSpacing: 1 },
  evidenceText: { color: '#fff', fontSize: 12, lineHeight: 18, marginTop: 5 },
  evidenceFine: { color: 'rgba(255,255,255,0.5)', fontSize: 10, lineHeight: 15, marginTop: 6 },
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
