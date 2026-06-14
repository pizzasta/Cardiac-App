# Cardiac-App

See [CIRCADIA.md](CIRCADIA.md) for the full concept doc and [supabase/README.md](supabase/README.md) for backend setup.

---

## Pre-launch checklist

### ✅ Confirmed good
- **CI (type-check + build)** — all 36 workflow runs green; `tsc --noEmit` + web/iOS export pass on every push to `main`.
- - **Secrets / env hygiene** — `.env` is git-ignored; `.env.example` is well-documented; the Pages deploy workflow injects secrets at build time from GitHub Secrets, never from committed values.
  - - **Auth (Supabase + on-device fallback)** — Supabase is optional; every auth/sync call is best-effort with silent fallbacks so the app works fully without a backend.
    - - **AI proxy security** — the Anthropic key is kept server-side via the Supabase Edge Function (`supabase/functions/pulse/`) or the Cloudflare Worker (`server/pulse-worker.js`); the `EXPO_PUBLIC_ANTHROPIC_API_KEY` direct-client path is clearly labelled dev-only.
      - - **Rate limiting** — server-side per-user (or per-IP for anon) limiting in the Edge Function; separate buckets for `reading` (8/min) and `chat` (30/min); fails open so a misconfigured store never takes Pulse down.
        - - **Error handling** — `App.tsx` wraps the tree in a class `ErrorBoundary`; all AI/sync calls have `catch` blocks with user-friendly fallbacks.
          - - **Platform splitting** — `.native.ts` / `.ts` pairs for `capture`, `sound`, `notifications`, `voice`; Metro config shims `node:` built-ins the Anthropic SDK references but never executes on device.
            - - **`package-lock.json` tracked** — confirmed present in `app/package-lock.json`; `npm ci` and the npm cache step in CI work correctly. ✔
              - - **Open issues / PRs** — none.
               
                - ### ⚠️ Pre-launch actions required
               
                - 1. **Lock CORS on the Cloudflare Worker** — `server/pulse-worker.js` has `ALLOW_ORIGIN = '*'`; change to your real origin (e.g. `https://pizzasta.github.io`) before enabling that path in production.
                 
                  2. 2. **Verify `delete_account` RPC exists in migrations** — `sync.ts` calls `supabase.rpc('delete_account')`; confirm the stored procedure is present in `supabase/migrations/` or the Supabase dashboard, otherwise account deletion silently fails.
                    
                     3. 3. **Add a test suite** — CI runs type-check and export builds only; no unit or integration tests exist. Minimum recommended: tests for `scoreQuiz` in `src/logic/score.ts` and the pulselog merge logic in `sync.ts`.
                       
                        4. 4. **Keep `src/types/db.ts` in sync** — after any schema change run `npm run gen:types` in `app/` and commit the result, or add a CI step to regenerate it automatically.
                           5. 
