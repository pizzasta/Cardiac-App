import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase is OPTIONAL. It activates only when both public env vars are set:
//   EXPO_PUBLIC_SUPABASE_URL
//   EXPO_PUBLIC_SUPABASE_ANON_KEY
// When absent (e.g. local/dev without a project), `supabase` is null and the
// app falls back to the existing on-device auth — nothing breaks.

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseEnabled = !!(url && anonKey);

export const supabase: SupabaseClient | null = supabaseEnabled
  ? createClient(url as string, anonKey as string, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        // On web, parse the OAuth tokens Supabase appends to the redirect URL.
        detectSessionInUrl: Platform.OS === 'web',
      },
    })
  : null;
