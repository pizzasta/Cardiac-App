import React, { useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTopInset } from '../hooks';
import { LEGAL, LEGAL_DOCS, LegalDocId, legalUrl, sectionBlocks } from '../data/legal';
import { F, T } from '../theme';

// Privacy Policy, Terms, account deletion and support — rendered from
// data/legal.ts, the same source as the public web pages.

export default function LegalScreen({
  onClose,
  initial = 'privacy',
}: {
  onClose: () => void;
  initial?: LegalDocId;
}) {
  const topInset = useTopInset();
  const [tab, setTab] = useState<LegalDocId>(initial);
  const scroll = useRef<ScrollView>(null);
  const doc = LEGAL_DOCS.find((d) => d.id === tab) ?? LEGAL_DOCS[0];

  const pick = (id: LegalDocId) => {
    setTab(id);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };

  return (
    <View style={styles.fill}>
      <LinearGradient colors={['#08080A', '#141016', '#08080A']} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: topInset }]}>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Legal & support</Text>
        <View style={{ width: 64 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs} style={styles.tabsWrap}>
        {LEGAL_DOCS.map((d) => {
          const active = d.id === tab;
          return (
            <Pressable key={d.id} onPress={() => pick(d.id)} style={[styles.tab, active && styles.tabActive]}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{d.shortTitle}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView ref={scroll} contentContainerStyle={styles.body}>
        <Text style={styles.title}>{doc.title}</Text>
        <Text style={styles.updated}>Last updated {LEGAL.updated}</Text>
        <Text style={styles.intro}>{doc.intro}</Text>

        {doc.sections.map((s) => (
          <View key={s.heading} style={styles.section}>
            <Text style={styles.h2}>{s.heading}</Text>
            {sectionBlocks(s).map((b, i) =>
              b.kind === 'p' ? (
                <Text key={i} style={styles.p}>
                  {b.text}
                </Text>
              ) : (
                <View key={i} style={styles.list}>
                  {b.items.map((item) => (
                    <View key={item} style={styles.bulletRow}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={[styles.p, styles.bulletText]}>{item}</Text>
                    </View>
                  ))}
                </View>
              )
            )}
          </View>
        ))}

        <View style={styles.actions}>
          <Pressable
            style={styles.action}
            onPress={() => Linking.openURL(`mailto:${LEGAL.contactEmail}`).catch(() => {})}
          >
            <Text style={styles.actionText}>Email {LEGAL.contactEmail}</Text>
          </Pressable>
          <Pressable style={styles.action} onPress={() => Linking.openURL(legalUrl(doc.id)).catch(() => {})}>
            <Text style={styles.actionText}>Open web version</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, backgroundColor: '#08080A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  back: { color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: '600', width: 64 },
  headerTitle: { color: '#fff', fontSize: 18, fontFamily: F.display },
  tabsWrap: { flexGrow: 0 },
  tabs: { paddingHorizontal: 18, gap: 8, paddingVertical: 8 },
  tab: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 18,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  tabActive: { borderColor: T.accent, backgroundColor: `${T.accent}26` },
  tabText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  body: { paddingHorizontal: 22, paddingBottom: 56 },
  title: { color: '#fff', fontSize: 26, fontFamily: F.display, marginTop: 12 },
  updated: { color: 'rgba(255,255,255,0.45)', fontSize: 12, fontFamily: F.mono, marginTop: 6 },
  intro: { color: 'rgba(255,255,255,0.85)', fontSize: 15, lineHeight: 22, marginTop: 12 },
  section: { marginTop: 22 },
  h2: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  p: { color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 21, marginBottom: 8 },
  list: { marginBottom: 4 },
  bulletRow: { flexDirection: 'row', gap: 8 },
  bulletDot: { color: T.accent, fontSize: 14, lineHeight: 21 },
  bulletText: { flex: 1 },
  actions: { gap: 10, marginTop: 28 },
  action: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 22,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
