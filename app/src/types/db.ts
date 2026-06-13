// TypeScript types for the Circadia Supabase schema (supabase/migrations/0001_init.sql).
// Shaped to match supabase-js's generic so `createClient<Database>` gives typed
// queries. Hand-written here; can be regenerated with `supabase gen types`.

export type Level = 'wired' | 'steady' | 'flat';

export interface Database {
  public: {
    Tables: {
      rhythm_types: {
        Row: { id: string; label: string; description: string | null };
        Insert: { id: string; label: string; description?: string | null };
        Update: { id?: string; label?: string; description?: string | null };
        Relationships: [];
      };
      archetypes: {
        Row: {
          id: string;
          name: string;
          emoji: string;
          one_liner: string | null;
          accent: string | null;
          tint: string | null;
          rhythm_type_id: string | null;
          sort_order: number;
        };
        Insert: {
          id: string;
          name: string;
          emoji: string;
          one_liner?: string | null;
          accent?: string | null;
          tint?: string | null;
          rhythm_type_id?: string | null;
          sort_order?: number;
        };
        Update: Partial<Database['public']['Tables']['archetypes']['Insert']>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          onboarding_complete: boolean;
          current_archetype_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          onboarding_complete?: boolean;
          current_archetype_id?: string | null;
        };
        Update: {
          display_name?: string | null;
          onboarding_complete?: boolean;
          current_archetype_id?: string | null;
        };
        Relationships: [];
      };
      results: {
        Row: {
          id: string;
          user_id: string;
          archetype_id: string;
          peak: string | null;
          crash: string | null;
          recharge: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          archetype_id: string;
          peak?: string | null;
          crash?: string | null;
          recharge?: string | null;
        };
        Update: Partial<Database['public']['Tables']['results']['Insert']>;
        Relationships: [];
      };
      onboarding_answers: {
        Row: {
          id: string;
          user_id: string;
          result_id: string | null;
          question_id: string;
          answer: string;
          answered_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          result_id?: string | null;
          question_id: string;
          answer: string;
        };
        Update: Partial<Database['public']['Tables']['onboarding_answers']['Insert']>;
        Relationships: [];
      };
      check_ins: {
        Row: {
          id: string;
          user_id: string;
          local_date: string;
          level: Level;
          reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          local_date: string;
          level: Level;
          reason?: string | null;
        };
        Update: {
          level?: Level;
          reason?: string | null;
        };
        Relationships: [];
      };
      streaks: {
        Row: {
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_check_in: string | null;
          updated_at: string;
        };
        Insert: { user_id: string };
        Update: {
          current_streak?: number;
          longest_streak?: number;
          last_check_in?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      emotional_trends: {
        Row: {
          user_id: string | null;
          week: string | null;
          check_ins: number | null;
          wired: number | null;
          steady: number | null;
          flat: number | null;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Convenience row aliases.
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Archetype = Database['public']['Tables']['archetypes']['Row'];
export type RhythmType = Database['public']['Tables']['rhythm_types']['Row'];
export type Result = Database['public']['Tables']['results']['Row'];
export type OnboardingAnswer = Database['public']['Tables']['onboarding_answers']['Row'];
export type CheckIn = Database['public']['Tables']['check_ins']['Row'];
export type Streak = Database['public']['Tables']['streaks']['Row'];
export type EmotionalTrend = Database['public']['Views']['emotional_trends']['Row'];
