# Circadia — Supabase setup

Backend for auth + cloud sync. The app runs fully **without** this (on-device
auth + local check-ins); configuring Supabase unlocks real accounts, persistent
sessions, and cross-device sync.

```
supabase/
├── config.toml              # CLI config (ports, auth, realtime)
└── migrations/
    ├── 0001_init.sql        # tables, indexes, RLS, triggers, views, seed
    └── 0002_realtime.sql    # realtime publication for check_ins + streaks
```

## 1. Create a project
Create one at https://supabase.com → **Project Settings → API**, and copy:
- **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
- **anon public key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Put both in `app/.env` (see `app/.env.example`). These are the only vars the
client needs.

## 2. Apply the schema
Install the CLI (`brew install supabase/tap/supabase` or `npx supabase`), then:

```bash
# from the repo root
npx supabase link --project-ref <your-project-ref>   # ref is in the dashboard URL
npx supabase db push                                  # runs 0001 then 0002 in order
```

Prefer to do it by hand? Paste `migrations/0001_init.sql` then
`migrations/0002_realtime.sql` into the dashboard SQL editor.

## 3. Configure auth providers
- **Email/password** — on by default.
- **Google** — Authentication → Providers → Google: paste your Google OAuth
  client ID + secret. (Locally, the CLI reads them from
  `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` / `_SECRET`.)
- **Redirect URLs** — Authentication → URL Configuration → add:
  - your web URL, e.g. `https://pizzasta.github.io/Cardiac-App/`
  - the native scheme: `circadia://`

## 4. Regenerate types (after schema changes)
```bash
cd app && npm run gen:types     # writes src/types/db.ts from the live schema
```

## 5. AI proxy (Pulse) — keep the Anthropic key off the client
The `functions/pulse` Edge Function holds the Anthropic key and owns Pulse's
system prompt + safety guardrails. The app sends only the user's data.

```bash
npx supabase functions deploy pulse
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```
Then set `EXPO_PUBLIC_PULSE_FN` in `app/.env` to the function URL
(`https://<ref>.functions.supabase.co/pulse`). Without it, Pulse falls back to
the legacy proxy / dev key / static copy.

## 6. Local development (optional)
```bash
npx supabase start              # local Postgres + Auth + Studio (port 54323)
npx supabase db reset           # re-apply all migrations to the local DB
```
Point `app/.env` at the local URL/anon key that `supabase start` prints.

## Notes
- RLS is on for every table — users only ever read/write their own rows; the
  `archetypes`/`rhythm_types` reference tables are world-readable.
- `streaks` and `emotional_trends` are maintained server-side (trigger + view),
  so the dashboard reads them directly; no client computation needed.
- All client sync is best-effort: if Supabase is unreachable, the app keeps
  working from local storage.
