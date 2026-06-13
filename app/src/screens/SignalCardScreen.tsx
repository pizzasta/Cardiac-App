import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTopInset } from '../hooks';
import { ARCHETYPES, TINTS } from '../data/archetypes';
import { RhythmResult } from '../logic/score';
import { pickStatement, STATEMENTS } from '../data/statements';
import { shareText } from '../logic/share';
import { canCaptureImage, captureAndShare } from '../logic/capture';
import PulseLine from '../components/PulseLine';
import { F, T } from '../theme';

export default function SignalCardScreen({
  result,
  onClose,
}: {
  result: RhythmResult;
  onClose: () => void;
}) {
  const a = ARCHETYPES[result.animal];
  const tint = TINTS[result.animal];
  const pool = STATEMENTS[result.animal];

  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<'idle' | 'copied' | 'shared'>('idle');
  const statement = pickStatement(result.animal, index);
  const cardRef = useRef<View>(null);

  const id = String((Object.keys(ARCHETYPES).indexOf(result.animal) + 1) * 100 + index)
    .padStart(3, '0');

  const onShare = async () => {
    // Native: snapshot the card to an image and open the share sheet. Web (or on
    // failure): fall back to sharing the statement as text.
    if (canCaptureImage && (await captureAndShare(cardRef))) {
      setStatus('shared');
      return;
    }
    const r = await shareText(`“${statement}” — my ${a.name} rhythm, mapped by Circadia.`);
    if (r === 'copied') setStatus('copied');
    else if (r === 'shared') setStatus('shared');
  };

  const topInset = useTopInset();
  return (
    <View style={styles.fill}>
      <LinearGradient colors={T.bgGradient} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: topInset }]}>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.back}>‹ Close</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Signal Card</Text>
        <View style={{ width: 64 }} />
      </View>

      <View style={styles.stage}>
        {/* The card — story-shaped, screenshot-ready */}
        <View ref={cardRef} collapsable={false} style={styles.card}>
          <LinearGradient
            colors={['#08080A', '#120A10', `${tint}22`]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.glow, { backgroundColor: tint }]} />

          <View style={styles.cardTop}>
            <View style={[styles.emblem, { borderColor: `${tint}66` }]}>
              <Text style={styles.emblemEmoji}>{a.emoji}</Text>
            </View>
            <Text style={[styles.cardKicker, { color: tint }]}>{a.name.toUpperCase()} RHYTHM</Text>
          </View>

          <Text style={styles.statement}>{statement}</Text>

          <View>
            <PulseLine height={56} color={tint} style={{ opacity: 0.9 }} />
            <View style={styles.readout}>
              <Text style={styles.readoutText}>RHYTHM ID · {id}</Text>
              <Text style={styles.readoutText}>circadia</Text>
            </View>
          </View>
        </View>

        <Pressable onPress={() => { setIndex((i) => i + 1); setStatus('idle'); }} hitSlop={8}>
          <Text style={styles.shuffle}>↻  another statement ({(index % pool.length) + 1}/{pool.length})</Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Pressable style={[styles.cta, { backgroundColor: tint }]} onPress={onShare}>
          <Text style={styles.ctaText}>
            {status === 'copied' ? 'Copied to clipboard ✓' : status === 'shared' ? 'Shared ✓' : 'Share my Signal'}
          </Text>
        </Pressable>
        <Text style={styles.hint}>
          {canCaptureImage
            ? 'One tap shares the card as an image.'
            : 'Drop it on your story — screenshot the card above.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  back: { color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: '600', width: 64 },
  headerTitle: { color: '#fff', fontSize: 18, fontFamily: F.display },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  card: {
    width: '100%',
    maxWidth: 360,
    aspectRatio: 0.62,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    padding: 26,
    justifyContent: 'space-between',
  },
  glow: {
    position: 'absolute',
    top: '34%',
    alignSelf: 'center',
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.16,
  },
  cardTop: { alignItems: 'flex-start', gap: 14 },
  emblem: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  emblemEmoji: { fontSize: 30 },
  cardKicker: { fontSize: 12, fontFamily: F.mono, letterSpacing: 2 },
  statement: { color: '#fff', fontSize: 30, lineHeight: 38, fontFamily: F.display },
  readout: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  readoutText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: F.mono, letterSpacing: 1 },
  shuffle: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600', marginTop: 22 },
  footer: { paddingHorizontal: 24, paddingBottom: 40 },
  cta: { borderRadius: 26, paddingVertical: 16, alignItems: 'center' },
  ctaText: { color: '#08080A', fontSize: 16, fontWeight: '800' },
  hint: { color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', marginTop: 12 },
});
