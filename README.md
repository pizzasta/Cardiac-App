# Cardiac-App

See [CIRCADIA.md](CIRCADIA.md) for the full concept doc and [supabase/README.md](supabase/README.md) for backend setup.

---

## Pre-launch checklist

Store-submission steps live in [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md). Competitive positioning and the features that set Circadia apart are in [COMPETITIVE.md](COMPETITIVE.md).

### ✅ Confirmed good
- **CI** — `tsc --noEmit`, ESLint, Jest (unit tests for scoring, sync merge, weekly report, experiments, resonance, forecast, reset pacer, export and profile persistence), plus web and iOS export on every push to `main` and every PR.
- **Reproducible installs** — `app/package-lock.json` is in sync with `package.json`, so `npm ci` (used by the Pages deploy) succeeds.
- **Returning users** — the rhythm profile is saved on-device; reopening the app lands on Today instead of the quiz.
- **Secrets / env hygiene** — `.env` is git-ignored; `.env.example` is documented; the Pages deploy injects secrets at build time from GitHub Secrets.
- **Auth (Supabase + on-device fallback)** — Supabase is optional; every auth/sync call is best-effort with silent fallbacks so the app works fully without a backend.
- **AI proxy security** — the Anthropic key stays server-side via the Supabase Edge Function (`supabase/functions/pulse/`) or the Cloudflare Worker (`server/pulse-worker.js`, origin allow-list); the `EXPO_PUBLIC_ANTHROPIC_API_KEY` direct path is `__DEV__`-only.
- **Rate limiting** — per-user (or per-IP for anon) limits in the Edge Function; separate `reading` and `chat` buckets; fails open.
- **Account deletion** — `delete_account()` RPC ships in `supabase/migrations/0003_account_deletion.sql`; "Delete my data" also clears the saved profile and experiments on-device.
- **Data portability** — Settings → Export my data downloads (web) or shares (native) every check-in as CSV.
- **Error handling** — `App.tsx` wraps the tree in an `ErrorBoundary`; all AI/sync calls have user-friendly fallbacks.
- **Platform splitting** — `.native.ts` / `.ts` pairs for `capture`, `sound`, `notifications`, `voice`.

### ⚠️ Still required before store submission
See [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) — chiefly: on-device testing (iOS + Android), production env values, privacy-policy and web account-deletion URLs, store privacy/data-safety declarations, and app icon/splash assets (`app.json` currently defines background colours only).

### Keeping types in sync
After any schema change run `npm run gen:types` in `app/` and commit `src/types/db.ts`. CI's `types-drift` job enforces this when `SUPABASE_PROJECT_ID` is configured.
