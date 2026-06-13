import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTopInset } from '../hooks';
import { useAuth } from '../logic/auth';
import { CONSENT_SHORT } from '../data/disclaimer';
import { F, T } from '../theme';

export default function SignInScreen({ onClose }: { onClose: () => void }) {
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

  // Close once a session exists (covers the async OAuth round-trip).
  useEffect(() => {
    if (user) onClose();
  }, [user, onClose]);

  const emailValid = /\S+@\S+\.\S+/.test(email);
  const passwordValid = password.length >= 6;
  const canSubmit = supabaseEnabled ? emailValid && passwordValid : emailValid;

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
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
          <View style={{ width: 48 }} />
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>
            {supabaseEnabled && mode === 'signup' ? 'Create your account' : 'Save your rhythm'}
          </Text>
          <Text style={styles.sub}>
            Sign in to unlock your detailed plan and keep it across devices.
          </Text>

          <Pressable
            style={[styles.google, (!googleAvailable || busy) && styles.disabled]}
            onPress={onGoogle}
            disabled={!googleAvailable || busy}
          >
            <Text style={styles.googleG}>G</Text>
            <Text style={styles.googleText}>Continue with Google</Text>
          </Pressable>
          {!googleAvailable && (
            <Text style={styles.note}>Google sign-in activates once OAuth is configured.</Text>
          )}

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.or}>or</Text>
            <View style={styles.line} />
          </View>

          {/* Name: signup (Supabase) or the passwordless fallback. */}
          {(!supabaseEnabled || mode === 'signup') && (
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Name (optional)"
              placeholderTextColor="rgba(255,255,255,0.45)"
              autoCapitalize="words"
            />
          )}
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="rgba(255,255,255,0.45)"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {supabaseEnabled && (
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password (6+ characters)"
              placeholderTextColor="rgba(255,255,255,0.45)"
              secureTextEntry
              autoCapitalize="none"
            />
          )}

          {authError && <Text style={styles.error}>{authError}</Text>}

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
            <Pressable onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')} hitSlop={10}>
              <Text style={styles.toggle}>
                {mode === 'signin'
                  ? 'New here? Create an account'
                  : 'Already have an account? Sign in'}
              </Text>
            </Pressable>
          ) : (
            <Text style={styles.fine}>
              We use this to save your plan. No password — this is an early prototype.
            </Text>
          )}

          <Text style={styles.consent}>{CONSENT_SHORT}</Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, backgroundColor: '#08080A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18 },
  back: { color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: '600', width: 48 },
  body: { flex: 1, paddingHorizontal: 28, justifyContent: 'center' },
  title: { color: '#fff', fontSize: 34, fontFamily: F.display },
  sub: { color: 'rgba(255,255,255,0.78)', fontSize: 16, lineHeight: 23, marginTop: 10, marginBottom: 28 },
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
  note: { color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', marginTop: 8, lineHeight: 17 },
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
  toggle: { color: 'rgba(255,255,255,0.75)', fontSize: 14, textAlign: 'center', marginTop: 18, fontWeight: '600' },
  fine: { color: 'rgba(255,255,255,0.45)', fontSize: 12, textAlign: 'center', marginTop: 18, lineHeight: 17 },
  consent: { color: 'rgba(255,255,255,0.4)', fontSize: 11, textAlign: 'center', marginTop: 16, lineHeight: 16 },
});

