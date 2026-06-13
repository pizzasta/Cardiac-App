import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

// Auth for Circadia. Two ways in:
//   • Google — real OAuth via expo-auth-session, active when Google client IDs
//     are configured (EXPO_PUBLIC_GOOGLE_*). Only the project owner can create
//     these in Google Cloud, so without them the button is disabled and the UI
//     says so.
//   • Email — a lightweight local account (name + email, stored on device).
//     Genuinely persists and unlocks the detailed plan; it's not server-verified
//     (that needs a backend), which is fine for the prototype.

WebBrowser.maybeCompleteAuthSession();

const STORAGE_KEY = 'circadia.user';
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
  googleAvailable: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (name: string, email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

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
    // Best-effort UTF-8 via decodeURIComponent
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

const googleAvailable = !!(WEB_ID || IOS_ID || ANDROID_ID);

// The Google OAuth hook is isolated in its own child so it is ONLY mounted when
// client IDs are configured. Calling it unconfigured can throw during render —
// which, at the app root, would blank the whole screen. This keeps it contained.
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
  const promptRef = useRef<null | (() => Promise<unknown>)>(null);

  // Restore a saved session.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setUser(JSON.parse(raw));
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const persist = async (u: User) => {
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
    googleAvailable,
    signInWithGoogle: async () => {
      if (promptRef.current) await promptRef.current();
    },
    signInWithEmail: async (name, email) => {
      await persist({ name: name.trim() || email.split('@')[0], email: email.trim(), provider: 'email' });
    },
    signOut: async () => {
      setUser(null);
      await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {googleAvailable && <GoogleBridge promptRef={promptRef} onUser={persist} />}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
