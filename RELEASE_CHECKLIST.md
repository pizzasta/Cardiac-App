# Wildhour release checklist

## Required before public store submission

- [ ] Renamed to Wildhour: run a trademark search (USPTO classes 9 and 44) and check the App Store / Google Play for the exact name before committing to it; register a domain and set up the support inbox (`support@wildhour.app` is a placeholder in `app/src/data/legal.ts`).
- [ ] The app scheme is now `wildhour://`: add `wildhour://` to the allowed redirect URLs in the Supabase dashboard (Auth > URL configuration); `supabase/config.toml` keeps the old `circadia://` too.

- [ ] Confirm the iOS bundle identifier and Android package in `app/app.json` match the final developer accounts.
- [ ] Set production Supabase URL and anon key in the release environment.
- [ ] Deploy the Supabase `pulse` Edge Function and set `ANTHROPIC_API_KEY` as a server secret.
- [ ] Set `EXPO_PUBLIC_PULSE_FN` for production. Do **not** set `EXPO_PUBLIC_ANTHROPIC_API_KEY` in a release build.
- [ ] Run CI successfully on the exact release commit: type-check, lint, Jest tests, web export, iOS export.
- [x] App icon, adaptive icon, splash, favicon and notification icon in `app/assets` (regenerate with `npm run gen:brand`), plus build numbers, privacy manifest and `eas.json` build profiles.
- [ ] Google sign-in is hidden on iOS until Sign in with Apple is added (App Store guideline 4.8). Add `expo-apple-authentication` with Supabase Apple OAuth to offer both.
- [ ] Make sure the support inbox in `app/src/data/legal.ts` is real: Settings > Contact support and "Report response" in Ask Wildhour both email it.
- [ ] Bump `version` in `app/app.json` and set `ios.buildNumber` / `android.versionCode` for each store upload.
- [ ] Test sign-up, sign-in, sign-out, cloud sync, local-only use, returning-user restore, CSV export, delete data, and delete account on physical iOS and Android devices.
- [ ] Verify account deletion removes the auth user and associated rows.
- [ ] Set the real legal entity (`operator`) and a monitored inbox (`contactEmail`) in `app/src/data/legal.ts`, run `npm run gen:legal`, and have counsel review the Privacy Policy and Terms.
- [ ] Confirm the public pages are live after the Pages deploy and use them in both store listings:
  - Privacy Policy: https://pizzasta.github.io/Cardiac-App/privacy/
  - Terms (Apple custom EULA, optional): https://pizzasta.github.io/Cardiac-App/terms/
  - Account deletion (Google Play): https://pizzasta.github.io/Cardiac-App/delete-account/
  - Support URL: https://pizzasta.github.io/Cardiac-App/support/
- [ ] Apply migration `0005_privacy_retention.sql`, redeploy the `pulse` Edge Function, and set the `RATE_LIMIT_SALT` secret (see supabase/README.md).
- [ ] Complete Apple privacy disclosures and Google Play Data safety / Health apps declarations from the behavior of the final build. Starting point, matching the Privacy Policy:
  - Collected and linked to the user (account holders only): Health & fitness (check-ins, quiz answers), contact info (email, name), user ID, other user content (Ask Wildhour questions, sent to the AI provider).
  - Not used for tracking or advertising; no data sold; no third-party analytics or ad SDKs.
  - Data encrypted in transit; users can request deletion in-app and via the web deletion page.
  - No location, contacts, photos, microphone or camera access (expo-av's microphone permission is disabled in `app.json`).
- [ ] Review final wellness copy so rhythm profiles are presented as app-generated reflections, not diagnoses, validated chronotypes, biological measurements, or guaranteed predictions.
- [ ] Confirm Ask Wildhour refuses diagnosis, medication advice, and medical certainty in adversarial/manual tests.
- [ ] Confirm the AI consent screen appears before the first Ask Wildhour request on a fresh install, and that turning it off in Settings stops requests.
- [ ] Rating prompt: TestFlight and debug builds never show the real store sheet, so confirm on a production build that it appears at most once, after a steady check-in, the first-week recap or a finished experiment (and only after 3+ check-ins).
- [ ] Turn on Low Power Mode (iOS) / Battery Saver (Android) and confirm the app switches to the simple background; check Settings > Display > Simple background too.
- [ ] Look around: on a physical iPhone and Android phone, tilt the phone and swipe sideways on the landing and plan screens; the view should turn gently and drift back. Check it stays comfortable (no motion sickness) and that Reduce Motion turns it off.
- [ ] Walk through each animal world (dolphin cove, wolf snow and aurora, bear autumn, hummingbird meadow, fox wheat, octopus shore) at day, sunset and night on a mid-range phone and check it stays smooth.
- [ ] Listen to the nature soundscapes on a phone speaker and headphones: the valley (birds and grasshoppers by day, crickets at night), and each animal world after the quiz. Check levels feel balanced and that sound softens behind Today, check-in and Trends.
- [ ] Listen to interface sounds and ambience on a physical iPhone (silent switch on and off) and an Android phone.
- [ ] Check the 3D world runs smoothly on an older iPhone and a mid-range Android phone (scrolling Today and Trends, the reading dive), and that "Reduce motion" makes it still.
- [ ] Confirm notification copy does not present predicted crashes, burnout, or health states as facts.

## Recommended beta gate

A beta candidate is ready when CI is green, Pulse uses only the secured server route, deletion works end-to-end, privacy disclosures match actual data flows, and the core flow has been tested on at least one physical iOS and one physical Android device.
