import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { useTopInset } from '../hooks';
import { useAuth } from '../logic/auth';
import { DISCLAIMER_SHORT } from '../data/disclaimer';
import { F, T } from '../theme';

export default function SignInScreen({
  onClose,
  onLegal,
}: {
  onClose: () => void;
  onLegal: () => void;
}) {
  const {
    user,
    supabaseEnabled,
    googleAvailable,
    authError,
    signInWithGoogle,
    signInWithEmail,
    signInWithPassword,
    signUpWithPassword,
  } = useAuth();
  const topInset = useTopInset();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  // Explicit consent: accounts store check-ins, which are health-related data.
  const [agreed, setAgreed] = useState(false);

  // Close once a session exists (covers the async OAuth round-trip).
  useEffect(() => {
    if (user) onClose();
  }, [user, onClose]);

  const emailValid = /\S+@\S+\.\S+/.test(email);
  const passwordValid = password.length >= 6;
  const canSubmit = agreed && (supabaseEnabled ? emailValid && passwordValid : emailValid);

  // Apple guideline 4.8: offering a third-party login on iOS requires Sign in
  // with Apple too, which we don't support yet, so Google stays off on iOS.
  const showGoogle = googleAvailable && Platform.OS !== 'ios';

  // After sign-up the auth context reports "Check your email..." on the error
  // channel. It's good news, so show it in a neutral style.
  const authIsInfo = !!authError && authError.startsWith('Check your email');

  const submit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    try {
      if (!supabaseEnabled) {
        await signInWithEmail(name, email);
      } else if (mode === 'signup') {
        await signUpWithPassword(email, password, name);
      } else {
        await signInWithPassword(email, password);
      }
    } catch {
      /* authError is surfaced from the context */
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setBusy(true);
    try {
      await signInWithGoogle();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.fill}>
      <LinearGradient colors={['#08080A', '#141016', '#08080A']} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.header, { paddingTop: topInset }]}>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
          <View style={{ width: 64 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Text style={styles.title}>
            {supabaseEnabled && mode === 'signup' ? 'Create your account' : 'Save your rhythm'}
          </Text>
          <Text style={styles.sub}>
            Sign in to unlock your detailed plan and keep it across devices.
          </Text>

          <Pressable
            style={styles.agreeRow}
            onPress={() => setAgreed(!agreed)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreed }}
            hitSlop={6}
          >
            <View style={[styles.box, agreed && styles.boxOn]}>
              {agreed && <Text style={styles.tick}>✓</Text>}
            </View>
            <Text style={styles.agreeText}>
              I’m 18 or over and agree to the{' '}
              <Text style={styles.agreeLink} onPress={onLegal}>
                Terms and Privacy Policy
              </Text>
              , including Circadia storing my check-ins and quiz answers (health-related data) in my
              account.
            </Text>
          </Pressable>

          {showGoogle && (
            <>
              <Pressable
                style={[styles.google, (busy || !agreed) && styles.disabled]}
                onPress={onGoogle}
                disabled={busy || !agreed}
                accessibilityRole="button"
                accessibilityLabel="Continue with Google"
              >
                <Text style={styles.googleG}>G</Text>
                <Text style={styles.googleText}>Continue with Google</Text>
              </Pressable>

              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.or}>or</Text>
                <View style={styles.line} />
              </View>
            </>
          )}

          {/* Name: signup (Supabase) or the passwordless fallback. */}
          {(!supabaseEnabled || mode === 'signup') && (
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Name (optional)"
              placeholderTextColor="rgba(255,255,255,0.45)"
              autoCapitalize="words"
              textContentType="name"
              autoComplete="name"
            />
          )}
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="rgba(255,255,255,0.45)"
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Email"
          />
          {supabaseEnabled && (
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password (6+ characters)"
              placeholderTextColor="rgba(255,255,255,0.45)"
              secureTextEntry
              keyboardType="default"
              textContentType={mode === 'signup' ? 'newPassword' : 'password'}
              autoComplete={mode === 'signup' ? 'new-password' : 'password'}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Password"
            />
          )}

          {authError && (
            <Text style={authIsInfo ? styles.info : styles.error} accessibilityLiveRegion="polite">
              {authError}
            </Text>
          )}

          <Pressable
            style={[styles.cta, (!canSubmit || busy) && styles.disabled]}
            disabled={!canSubmit || busy}
            onPress={submit}
          >
            {busy ? (
              <ActivityIndicator color="#08080A" />
            ) : (
              <Text style={styles.ctaText}>
                {supabaseEnabled ? (mode === 'signup' ? 'Create account' : 'Sign in') : 'Continue'}
              </Text>
            )}
          </Pressable>

          {supabaseEnabled ? (
            <Pressable
              onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              hitSlop={10}
            >
              <Text style={styles.toggle}>
                {mode === 'signin'
                  ? 'New here? Create an account'
                  : 'Already have an account? Sign in'}
              </Text>
            </Pressable>
          ) : (
            <Text style={styles.fine}>We use this to save your plan.</Text>
          )}

          <Text style={styles.consent}>{DISCLAIMER_SHORT}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, backgroundColor: '#08080A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18 },
  back: { color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: '600', width: 64 },
  scroll: { flex: 1 },
  body: { flexGrow: 1, paddingHorizontal: 28, paddingVertical: 24, justifyContent: 'center' },
  title: { color: '#fff', fontSize: 34, fontFamily: F.display },
  sub: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 16,
    lineHeight: 23,
    marginTop: 10,
    marginBottom: 28,
  },
  google: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingVertical: 16,
  },
  googleG: { color: '#4285F4', fontSize: 20, fontWeight: '900' },
  googleText: { color: '#08080A', fontSize: 16, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 22 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  or: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 18,
    color: '#fff',
    fontSize: 15,
    marginBottom: 12,
  },
  info: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
    marginTop: -2,
  },
  error: { color: T.accent, fontSize: 13, lineHeight: 19, marginBottom: 12, marginTop: -2 },
  cta: {
    backgroundColor: T.accent,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  ctaText: { color: '#08080A', fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.45 },
  toggle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 18,
    fontWeight: '600',
  },
  fine: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 18,
    lineHeight: 17,
  },
  agreeRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 14 },
  box: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  boxOn: { backgroundColor: T.accent, borderColor: T.accent },
  tick: { color: '#08080A', fontSize: 13, fontWeight: '800', lineHeight: 15 },
  agreeText: { flex: 1, color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 19 },
  agreeLink: { color: '#fff', fontWeight: '700', textDecorationLine: 'underline' },
  consent: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
  },
});
