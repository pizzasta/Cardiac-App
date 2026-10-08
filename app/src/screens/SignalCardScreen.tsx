import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useBottomInset, useTopInset } from '../hooks';
import { ARCHETYPES, TINTS } from '../data/archetypes';
import { RhythmResult } from '../logic/score';
import { pickStatement, STATEMENTS } from '../data/statements';
import { shareText } from '../logic/share';
import { canCaptureImage, captureAndShare } from '../logic/capture';
import PulseLine from '../components/PulseLine';
import { F } from '../theme';
import Scrim from '../components/Scrim';
import { displayName } from '../data/blends';

const CARD_RATIO = 0.62; // story-shaped: width / height
const CARD_MAX_W = 360;
// Room the header, shuffle link and footer need around the card (excluding
// safe-area insets, which are added at runtime).
const CHROME_H = 195;

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
  // Ignore taps while a share sheet or capture is already in progress.
  const sharing = useRef(false);
  const [busy, setBusy] = useState(false);

  const onShare = async () => {
    if (sharing.current) return;
    sharing.current = true;
    setBusy(true);
    try {
      // Native: snapshot the card to an image and open the share sheet. Web (or on
      // failure): fall back to sharing the statement as text.
      if (canCaptureImage && (await captureAndShare(cardRef))) {
        // The image share sheet can't report whether it was sent or dismissed,
        // so don't claim "Shared".
        return;
      }
      const r = await shareText(
        `“${statement}” (my ${displayName(result)} rhythm, mapped by Wildhour)`
      );
      if (r === 'copied') setStatus('copied');
      else if (r === 'shared') setStatus('shared');
    } catch {
      // Share sheet unavailable or dismissed with an error: nothing to do.
    } finally {
      sharing.current = false;
      setBusy(false);
    }
  };

  const topInset = useTopInset();
  const bottomInset = useBottomInset();
  const { width: winW, height: winH } = useWindowDimensions();

  // Size the card so header, card, shuffle and Share all fit on short phones
  // (e.g. 320x568). Taller screens get the full-size card.
  const fitH = Math.max(260, winH - topInset - bottomInset - CHROME_H);
  const cardW = Math.min(CARD_MAX_W, winW - 48, fitH * CARD_RATIO);
  const compact = cardW < 280;
  const statementSize = compact ? Math.max(20, Math.round(cardW / 10)) : 30;

  return (
    <View style={styles.fill}>
      <Scrim shade="medium" />

      <View style={[styles.header, { paddingTop: topInset }]}>
        <Pressable
          onPress={onClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Text style={styles.back}>‹ Close</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Rhythm card</Text>
        <View style={{ width: 64 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset }]}
      >
        <View style={styles.stage}>
          {/* The card — story-shaped, screenshot-ready */}
          <View
            ref={cardRef}
            collapsable={false}
            style={[styles.card, { width: cardW, padding: compact ? 18 : 26 }]}
          >
            <LinearGradient
              colors={['#08080A', '#120A10', `${tint}22`]}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.glow, { backgroundColor: tint }]} />

            <View style={styles.cardTop}>
              <View
                style={[
                  styles.emblem,
                  { borderColor: `${tint}66` },
                  compact && { width: 48, height: 48, borderRadius: 24 },
                ]}
              >
                <Text style={[styles.emblemEmoji, compact && { fontSize: 24 }]}>{a.emoji}</Text>
              </View>
              <Text style={[styles.cardKicker, { color: tint }]}>
                {displayName(result).toUpperCase()} RHYTHM
              </Text>
            </View>

            <Text
              style={[
                styles.statement,
                { fontSize: statementSize, lineHeight: Math.round(statementSize * 1.27) },
              ]}
            >
              {statement}
            </Text>

            <View>
              <PulseLine height={compact ? 40 : 56} color={tint} style={{ opacity: 0.9 }} />
              <View style={styles.readout}>
                <Text style={styles.readoutText}>wildhour</Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={() => {
              setIndex((i) => i + 1);
              setStatus('idle');
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Show another statement"
          >
            <Text style={styles.shuffle}>
              ↻ another statement ({(index % pool.length) + 1}/{pool.length})
            </Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={[styles.cta, { backgroundColor: tint }]}
            onPress={onShare}
            disabled={busy}
            accessibilityRole="button"
            accessibilityState={{ busy, disabled: busy }}
          >
            <Text style={styles.ctaText}>
              {status === 'copied'
                ? 'Copied to clipboard ✓'
                : status === 'shared'
                  ? 'Shared ✓'
                  : 'Share my card'}
            </Text>
          </Pressable>
          <Text style={styles.hint}>
            {canCaptureImage
              ? 'One tap shares the card as an image.'
              : 'Drop it on your story: screenshot the card above.'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  back: { color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: '600', width: 64 },
  headerTitle: { color: '#fff', fontSize: 18, fontFamily: F.display },
  scroll: { flex: 1 },
  content: { flexGrow: 1 },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  card: {
    aspectRatio: CARD_RATIO,
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
  statement: { color: '#fff', fontFamily: F.display },
  readout: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  readoutText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontFamily: F.mono,
    letterSpacing: 1,
  },
  shuffle: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600', marginTop: 16 },
  footer: { paddingHorizontal: 24, paddingTop: 8 },
  cta: { borderRadius: 26, paddingVertical: 16, alignItems: 'center' },
  ctaText: { color: '#08080A', fontSize: 16, fontWeight: '800' },
  hint: { color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', marginTop: 12 },
});
