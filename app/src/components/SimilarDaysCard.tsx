// "Days like today" card — past check-ins that look like today's, and what
// was recorded after them. Shown after a check-in and on the Trends screen.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PulseEntry } from '../logic/pulselog';
import { findSimilarDays, SIMILAR_DAYS_NOTE } from '../logic/similarDays';
import RhythmConstellation from './RhythmConstellation';
import { F, T } from '../theme';

function prettyDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  return Number.isNaN(date.getTime())
    ? key
    : date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function SimilarDaysCard({
  log,
  accent,
  tint,
  showMap = false,
  onAsk,
}: {
  log: PulseEntry[];
  accent: string;
  tint?: string;
  showMap?: boolean;
  onAsk?: (question: string) => void;
}) {
  const r = findSimilarDays(log);

  return (
    <View style={[styles.card, { borderColor: `${accent}44` }]}>
      <Text style={[styles.kicker, { color: accent }]}>DAYS LIKE TODAY</Text>
      <Text style={styles.title}>{r.headline}</Text>
      {!!r.shared && <Text style={styles.body}>{r.shared}</Text>}

      {showMap && r.matches.length > 0 && (
        <View style={styles.map}>
          <RhythmConstellation log={log} matches={r.matches} tint={tint ?? accent} />
        </View>
      )}

      {r.matches.length > 0 && (
        <View style={styles.days}>
          {r.matches.map((e) => (
            <View key={e.date} style={styles.day}>
              <Text style={styles.dayDate}>{prettyDate(e.date)}</Text>
              <Text style={styles.dayLevel}>
                {e.level}
                {e.reason ? ` · ${e.reason}` : ''}
              </Text>
            </View>
          ))}
        </View>
      )}

      {!!r.whatNext && (
        <View style={styles.nextBox}>
          <Text style={styles.nextLabel}>WHAT CAME NEXT</Text>
          <Text style={styles.nextText}>{r.whatNext}</Text>
        </View>
      )}

      {r.ready && <Text style={styles.note}>{SIMILAR_DAYS_NOTE}</Text>}

      {onAsk && !!r.question && (
        <Pressable style={[styles.ask, { borderColor: accent }]} onPress={() => onAsk(r.question)}>
          <Text style={[styles.askText, { color: accent }]}>Ask about these days  →</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(18,18,20,0.55)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    marginTop: 16,
  },
  kicker: { fontFamily: F.mono, fontSize: 11, letterSpacing: 1 },
  title: { color: T.text, fontFamily: F.display, fontSize: 19, marginTop: 6 },
  body: { color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 20, marginTop: 8 },
  map: { marginTop: 12 },
  days: { marginTop: 12, gap: 6 },
  day: { flexDirection: 'row', justifyContent: 'space-between' },
  dayDate: { color: T.text, fontSize: 13 },
  dayLevel: { color: T.muted, fontSize: 13, textTransform: 'capitalize' },
  nextBox: { marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  nextLabel: { color: T.muted, fontFamily: F.mono, fontSize: 10, letterSpacing: 1 },
  nextText: { color: T.text, fontSize: 14, lineHeight: 20, marginTop: 5 },
  note: { color: T.muted, fontSize: 11, lineHeight: 16, marginTop: 12 },
  ask: { borderWidth: 1, borderRadius: 22, paddingVertical: 12, alignItems: 'center', marginTop: 14 },
  askText: { fontSize: 14, fontWeight: '700' },
});
