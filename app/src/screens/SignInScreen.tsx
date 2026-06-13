import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../logic/auth';

export default function SignInScreen({ onClose }: { onClose: () => void }) {
  const { user, googleAvailable, signInWithGoogle, signInWithEmail } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Close once a session exists (covers the async Google round-trip).
  useEffect(() => {
    if (user) onClose();
  }, [user, onClose]);

  const emailValid = /\S+@\S+\.\S+/.test(email);

  return (
    <View style={styles.fill}>
      <LinearGradient colors={['#08080A', '#141016', '#08080A']} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
          <View style={{ width: 48 }} />
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>Save your rhythm</Text>
          <Text style={styles.sub}>
            Sign in to unlock your detailed plan and keep it across devices.
          </Text>

          <Pressable
            style={[styles.google, !googleAvailable && styles.disabled]}
            onPress={signInWithGoogle}
            disabled={!googleAvailable}
          >
            <Text style={styles.googleG}>G</Text>
            <Text style={styles.googleText}>Continue with Google</Text>
          </Pressable>
          {!googleAvailable && (
            <Text style={styles.note}>
              Google sign-in activates once Google OAuth client IDs are configured.
            </Text>
          )}

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.or}>or</Text>
            <View style={styles.line} />
          </View>

          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Name (optional)"
            placeholderTextColor="rgba(255,255,255,0.45)"
            autoCapitalize="words"
          />
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
          <Pressable
            style={[styles.cta, !emailValid && styles.disabled]}
            disabled={!emailValid}
            onPress={() => signInWithEmail(name, email)}
          >
            <Text style={styles.ctaText}>Continue</Text>
          </Pressable>

          <Text style={styles.fine}>
            We use this to save your plan. No password — this is an early prototype.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, backgroundColor: '#08080A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 18 },
  back: { color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: '600', width: 48 },
  body: { flex: 1, paddingHorizontal: 28, justifyContent: 'center' },
  title: { color: '#fff', fontSize: 34, fontWeight: '900' },
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
  cta: {
    backgroundColor: '#FF2E7E',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  ctaText: { color: '#08080A', fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.45 },
  fine: { color: 'rgba(255,255,255,0.45)', fontSize: 12, textAlign: 'center', marginTop: 18, lineHeight: 17 },
});
