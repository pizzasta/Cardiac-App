import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase, supabaseEnabled } from './supabase';

// Auth for Circadia. Backend is chosen automatically:
//   • Supabase — when EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY
//     are set: real email/password, Google OAuth, and persistent sessions
//     (AsyncStorage-backed, auto-refreshed).
//   • On-device fallback — when Supabase isn't configured: a lightweight local
//     account (legacy Google via expo-auth-session if client IDs exist, plus a
//     passwordless email account stored on device). Keeps the app fully working
//     without a backend.

WebBrowser.maybeCompleteAuthSession();

const STORAGE_KEY = 'circadia.user';
const ONBOARD_KEY = 'circadia.onboarded';
const WEB_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const IOS_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const ANDROID_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

export interface User {
  name: string;
  email: string;
  provider: 'google' | 'email';
}

interface AuthValue {
  user: User | null;
  ready: boolean;
  supabaseEnabled: boolean;
  googleAvailable: boolean;
  onboardingComplete: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  // Legacy passwordless email (on-device fallback only).
  signInWithEmail: (name: string, email: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

const legacyGoogleAvailable = !!(WEB_ID || IOS_ID || ANDROID_ID);

// Map a Supabase auth user to our lightweight User shape.
function mapUser(u: { email?: string; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> }): User {
  const meta = u.user_metadata || {};
  const email = u.email || '';
  const name =
    (meta.full_name as string) ||
    (meta.name as string) ||
    (email ? email.split('@')[0] : 'You');
  const provider = (u.app_metadata?.provider as string) === 'google' ? 'google' : 'email';
  return { name, email, provider };
}

// Parse tokens/code from an OAuth redirect URL (handles both ?query and #fragment).
function parseParams(urlStr: string): Record<string, string> {
  const out: Record<string, string> = {};
  const frag = urlStr.split('#')[1];
  const query = urlStr.split('?')[1];
  const raw = (frag || query || '').split('#')[0];
  for (const pair of raw.split('&')) {
    const [k, v] = pair.split('=');
    if (k) out[decodeURIComponent(k)] = decodeURIComponent(v || '');
  }
  return out;
}

// Legacy Google OAuth (expo-auth-session). Only mounted when client IDs exist
// AND Supabase is off — calling the hook unconfigured can throw during render.
function GoogleBridge({
  promptRef,
  onUser,
}: {
  promptRef: React.MutableRefObject<null | (() => Promise<unknown>)>;
  onUser: (u: User) => void;
}) {
  const [, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: WEB_ID,
    iosClientId: IOS_ID,
    androidClientId: ANDROID_ID,
  });

  useEffect(() => {
    promptRef.current = promptAsync;
  }, [promptAsync, promptRef]);

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params?.id_token;
      if (idToken) {
        const claims = decodeJwt(idToken);
        onUser({
          name: claims.name || (claims.email ? claims.email.split('@')[0] : 'You'),
          email: claims.email || '',
          provider: 'google',
        });
      }
    }
  }, [response, onUser]);

  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const promptRef = useRef<null | (() => Promise<unknown>)>(null);

  // Onboarding flag (device-level; survives sign-out).
  useEffect(() => {
    AsyncStorage.getItem(ONBOARD_KEY)
      .then((v) => {
        if (v === 'true') setOnboardingComplete(true);
      })
      .catch(() => {});
  }, []);

  // Session: Supabase if configured, else restore the local account.
  useEffect(() => {
    if (supabaseEnabled && supabase) {
      supabase.auth
        .getSession()
        .then(({ data }) => {
          setUser(data.session?.user ? mapUser(data.session.user) : null);
        })
        .catch(() => {})
        .finally(() => setReady(true));

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ? mapUser(session.user) : null);
      });
      return () => data.subscription.unsubscribe();
    }

    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setUser(JSON.parse(raw));
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const persistLocal = async (u: User) => {
    setUser(u);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } catch {
      /* storage unavailable — session stays in memory */
    }
  };

  const value: AuthValue = {
    user,
    ready,
    supabaseEnabled,
    googleAvailable: supabaseEnabled || legacyGoogleAvailable,
    onboardingComplete,
    authError,

    signInWithGoogle: async () => {
      setAuthError(null);
      if (supabaseEnabled && supabase) {
        try {
          const redirectTo = Platform.OS === 'web' ? undefined : makeRedirectUri();
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo, skipBrowserRedirect: Platform.OS !== 'web' },
          });
          if (error) throw error;
          // Web: the browser redirects and detectSessionInUrl finishes on return.
          if (Platform.OS !== 'web' && data?.url) {
            const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo as string);
            if (res.type === 'success' && res.url) {
              const p = parseParams(res.url);
              if (p.code) {
                const { error: e2 } = await supabase.auth.exchangeCodeForSession(p.code);
                if (e2) throw e2;
              } else if (p.access_token) {
                const { error: e3 } = await supabase.auth.setSession({
                  access_token: p.access_token,
                  refresh_token: p.refresh_token,
                });
                if (e3) throw e3;
              }
            }
          }
        } catch (e) {
          setAuthError(e instanceof Error ? e.message : 'Google sign-in failed.');
        }
        return;
      }
      // Legacy path.
      if (promptRef.current) await promptRef.current();
    },

    signInWithEmail: async (name, email) => {
      await persistLocal({
        name: name.trim() || email.split('@')[0],
        email: email.trim(),
        provider: 'email',
      });
    },

    signInWithPassword: async (email, password) => {
      setAuthError(null);
      if (!(supabaseEnabled && supabase)) throw new Error('Supabase is not configured.');
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setAuthError(error.message);
        throw error;
      }
    },

    signUpWithPassword: async (email, password, name) => {
      setAuthError(null);
      if (!(supabaseEnabled && supabase)) throw new Error('Supabase is not configured.');
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: name?.trim() || '' } },
      });
      if (error) {
        setAuthError(error.message);
        throw error;
      }
      // If email confirmation is on, there's no session yet — tell the user.
      if (!data.session) {
        setAuthError('Check your email to confirm your account, then sign in.');
      }
    },

    signOut: async () => {
      if (supabaseEnabled && supabase) {
        await supabase.auth.signOut().catch(() => {});
        return;
      }
      setUser(null);
      await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    },

    completeOnboarding: async () => {
      setOnboardingComplete(true);
      await AsyncStorage.setItem(ONBOARD_KEY, 'true').catch(() => {});
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {!supabaseEnabled && legacyGoogleAvailable && (
        <GoogleBridge promptRef={promptRef} onUser={persistLocal} />
      )}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Decode a JWT payload (base64url) without relying on atob being present.
function decodeJwt(token: string): { name?: string; email?: string } {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let out = '';
    let buffer = 0;
    let bits = 0;
    for (const ch of part) {
      const v = chars.indexOf(ch);
      if (v < 0 || ch === '=') continue;
      buffer = (buffer << 6) | v;
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        out += String.fromCharCode((buffer >> bits) & 0xff);
      }
    }
    const json = decodeURIComponent(
      out
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return {};
  }
}
