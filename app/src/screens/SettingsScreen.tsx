import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTopInset } from '../hooks';
import { useAuth } from '../logic/auth';
import { F, T } from '../theme';
import { RhythmResult } from '../logic/score';
import { ARCHETYPES } from '../data/archetypes';
import {
  canSchedule,
  disable as disableNotifs,
  enable as enableNotifs,
  isEnabled as notifsEnabled,
} from '../logic/notifications';

const VOLUMES: { label: string; value: number }[] = [
  { label: 'Low', value: 0.3 },
  { label: 'Medium', value: 0.6 },
  { label: 'High', value: 1.0 },
];

export default function SettingsScreen({
  result,
  muted,
  volume,
  onToggleMute,
  onSetVolume,
  onSignIn,
  onClose,
}: {
  result: RhythmResult | null;
  muted: boolean;
  volume: number;
  onToggleMute: () => void;
  onSetVolume: (v: number) => void;
  onSignIn: () => void;
  onClose: () => void;
}) {
  const { user, signOut, supabaseEnabled, deleteData } = useAuth();
  const accent = result ? ARCHETYPES[result.animal].accent : '#FF2E7E';

  const [notifsOn, setNotifsOn] = useState(false);
  const [notifBusy, setNotifBusy] = useState(false);
  const [confirm, setConfirm] = useState<null | 'data' | 'account'>(null);
  const [delBusy, setDelBusy] = useState(false);

  const runDelete = async (account: boolean) => {
    setDelBusy(true);
    try {
      await deleteData(account);
    } finally {
      setDelBusy(false);
      setConfirm(null);
      onClose();
    }
  };

  useEffect(() => {
    notifsEnabled().then(setNotifsOn);
  }, []);

  const toggleNotifs = async () => {
    if (notifBusy || !result) return;
    setNotifBusy(true);
    try {
      if (notifsOn) {
        await disableNotifs();
        setNotifsOn(false);
      } else {
        const ok = await enableNotifs(result.animal);
        setNotifsOn(ok);
        if (!ok) Alert.alert('Notifications blocked', 'Enable notifications for Circadia in your device settings.');
      }
    } finally {
      setNotifBusy(false);
    }
  };

  // The "active" volume chip is the nearest preset (only relevant when unmuted).
  const activeVolume = VOLUMES.reduce((best, v) =>
    Math.abs(v.value - volume) < Math.abs(best.value - volume) ? v : best
  ).value;

  const topInset = useTopInset();
  return (
    <View style={styles.fill}>
      <LinearGradient colors={['#08080A', '#141016', '#08080A']} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: topInset }]}>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* ACCOUNT */}
        <Text style={styles.section}>ACCOUNT</Text>
        <View style={styles.card}>
          {user ? (
            <>
              <Text style={styles.rowTitle}>{user.name}</Text>
              <Text style={styles.rowSub}>{user.email || 'Signed in'}</Text>
              <Text style={[styles.synced, { color: accent }]}>
                {supabaseEnabled
                  ? `☁ Synced to cloud · via ${user.provider === 'google' ? 'Google' : 'email'}`
                  : '✓ Saved on this device'}
              </Text>
              <Pressable style={[styles.btn, styles.btnGhost]} onPress={signOut}>
                <Text style={styles.btnGhostText}>Sign out</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.rowTitle}>Not signed in</Text>
              <Text style={styles.rowSub}>Sign in to save your plan and unlock the detailed plan.</Text>
              <Pressable style={[styles.btn, { backgroundColor: accent }]} onPress={onSignIn}>
                <Text style={styles.btnText}>Sign in</Text>
              </Pressable>
            </>
          )}
        </View>

        {/* SOUND */}
        <Text style={styles.section}>RAINFOREST SOUND</Text>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.rowTitle}>Ambience</Text>
              <Text style={styles.rowSub}>{muted ? 'Muted' : 'Playing across the app'}</Text>
            </View>
            <Pressable
              style={[styles.toggle, muted ? styles.toggleOff : { backgroundColor: accent }]}
              onPress={onToggleMute}
            >
              <View style={[styles.knob, muted ? styles.knobOff : styles.knobOn]} />
            </Pressable>
          </View>

          <Text style={[styles.rowSub, { marginTop: 16, marginBottom: 8 }]}>Volume</Text>
          <View style={styles.segments}>
            {VOLUMES.map((v) => {
              const active = !muted && activeVolume === v.value;
              return (
                <Pressable
                  key={v.label}
                  style={[styles.segment, active && { backgroundColor: accent, borderColor: accent }]}
                  onPress={() => onSetVolume(v.value)}
                >
                  <Text style={[styles.segmentText, active && { color: '#08080A' }]}>{v.label}</Text>
                </Pressable>
              );
            })}
          </View>
          {!canSchedule && (
            <Text style={styles.note}>Sound plays on web and may need a tap to begin (browser rule).</Text>
          )}
        </View>

        {/* NOTIFICATIONS */}
        <Text style={styles.section}>NOTIFICATIONS</Text>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.rowTitle}>Daily rhythm nudges</Text>
              <Text style={styles.rowSub}>
                {!result
                  ? 'Take the quiz to set reminders for your rhythm.'
                  : notifsOn
                  ? 'On — reminders at your key moments.'
                  : 'Crash-window and wind-down reminders.'}
              </Text>
            </View>
            <Pressable
              style={[styles.toggle, notifsOn ? { backgroundColor: accent } : styles.toggleOff, !result && { opacity: 0.4 }]}
              onPress={toggleNotifs}
              disabled={!result || notifBusy}
            >
              {notifBusy ? (
                <ActivityIndicator color={notifsOn ? '#08080A' : '#fff'} size="small" />
              ) : (
                <View style={[styles.knob, notifsOn ? styles.knobOn : styles.knobOff]} />
              )}
            </Pressable>
          </View>
          {!canSchedule && result && (
            <Text style={styles.note}>On the web we can only ask permission — the phone app delivers daily reminders.</Text>
          )}
        </View>

        {/* DATA & PRIVACY */}
        <Text style={styles.section}>DATA & PRIVACY</Text>
        <View style={styles.card}>
          <Text style={styles.rowTitle}>Delete my data</Text>
          <Text style={styles.rowSub}>
            Removes your check-ins, results and answers
            {user && supabaseEnabled ? ' from this device and the cloud' : ' from this device'}. This
            can’t be undone.
          </Text>
          {confirm === 'data' ? (
            <View style={styles.confirmRow}>
              <Pressable
                style={[styles.btn, styles.btnDanger, { flex: 1 }]}
                onPress={() => runDelete(false)}
                disabled={delBusy}
              >
                {delBusy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnDangerText}>Yes, delete</Text>
                )}
              </Pressable>
              <Pressable
                style={[styles.btn, styles.btnGhost, { flex: 1 }]}
                onPress={() => setConfirm(null)}
                disabled={delBusy}
              >
                <Text style={styles.btnGhostText}>Cancel</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => setConfirm('data')}>
              <Text style={styles.btnGhostText}>Delete my data</Text>
            </Pressable>
          )}

          {user && supabaseEnabled &&
            (confirm === 'account' ? (
              <View style={styles.confirmRow}>
                <Pressable
                  style={[styles.btn, styles.btnDanger, { flex: 1 }]}
                  onPress={() => runDelete(true)}
                  disabled={delBusy}
                >
                  {delBusy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnDangerText}>Delete account</Text>
                  )}
                </Pressable>
                <Pressable
                  style={[styles.btn, styles.btnGhost, { flex: 1 }]}
                  onPress={() => setConfirm(null)}
                  disabled={delBusy}
                >
                  <Text style={styles.btnGhostText}>Cancel</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={() => setConfirm('account')} hitSlop={8}>
                <Text style={styles.deleteAccount}>Delete my account permanently</Text>
              </Pressable>
            ))}
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
    paddingTop: 60,
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  back: { color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: '600', width: 48 },
  headerTitle: { color: '#fff', fontSize: 18, fontFamily: F.display },
  body: { paddingHorizontal: 22, paddingBottom: 44 },
  section: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontFamily: F.mono,
    letterSpacing: 1.5,
    marginTop: 26,
    marginBottom: 12,
  },
  card: {
    backgroundColor: 'rgba(18,18,20,0.5)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center' },
  rowTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  rowSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 19, marginTop: 3 },
  synced: { fontSize: 12, fontFamily: F.mono, letterSpacing: 0.5, marginTop: 10 },
  btn: { borderRadius: 24, paddingVertical: 13, alignItems: 'center', marginTop: 16 },
  btnText: { color: '#08080A', fontSize: 15, fontWeight: '700' },
  btnGhost: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  btnGhostText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnDanger: { backgroundColor: T.accent2 },
  btnDangerText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  confirmRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  deleteAccount: {
    color: T.accent2,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
  },
  toggle: { width: 56, height: 32, borderRadius: 16, padding: 3, justifyContent: 'center', alignItems: 'center' },
  toggleOff: { backgroundColor: 'rgba(255,255,255,0.15)' },
  knob: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff' },
  knobOn: { alignSelf: 'flex-end' },
  knobOff: { alignSelf: 'flex-start' },
  segments: { flexDirection: 'row', gap: 8 },
  segment: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  note: { color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 17, marginTop: 12 },
});
