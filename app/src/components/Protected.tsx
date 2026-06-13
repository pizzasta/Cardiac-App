import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../logic/auth';

// Reusable auth gate for protected content ("dashboard routes"). Renders its
// children only when signed in; otherwise shows a sign-in prompt. Optionally
// also requires onboarding to be complete.
export default function Protected({
  children,
  onSignIn,
  accent = '#FF2E7E',
  title = '🔒 Sign in to continue',
  message = 'Sign in to unlock this and keep it across devices.',
  requireOnboarding = false,
}: {
  children: React.ReactNode;
  onSignIn: () => void;
  accent?: string;
  title?: string;
  message?: string;
  requireOnboarding?: boolean;
}) {
  const { user, onboardingComplete } = useAuth();
  const allowed = !!user && (!requireOnboarding || onboardingComplete);

  if (allowed) return <>{children}</>;

  return (
    <Pressable style={[styles.lockCard, { borderColor: `${accent}55` }]} onPress={onSignIn}>
      <Text style={styles.lockTitle}>{title}</Text>
      <Text style={styles.lockText}>{message}</Text>
      <View style={[styles.lockBtn, { backgroundColor: accent }]}>
        <Text style={styles.lockBtnText}>Sign in</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  lockCard: {
    backgroundColor: 'rgba(18,18,20,0.55)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
  },
  lockTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  lockText: { color: 'rgba(255,255,255,0.78)', fontSize: 14, lineHeight: 20, marginTop: 8 },
  lockBtn: { borderRadius: 24, paddingVertical: 13, alignItems: 'center', marginTop: 16 },
  lockBtnText: { color: '#08080A', fontSize: 15, fontWeight: '800' },
});
