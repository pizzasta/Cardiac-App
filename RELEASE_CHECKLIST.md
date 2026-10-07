# Circadia release checklist

## Required before public store submission

- [ ] Confirm the iOS bundle identifier and Android package in `app/app.json` match the final developer accounts.
- [ ] Set production Supabase URL and anon key in the release environment.
- [ ] Deploy the Supabase `pulse` Edge Function and set `ANTHROPIC_API_KEY` as a server secret.
- [ ] Set `EXPO_PUBLIC_PULSE_FN` for production. Do **not** set `EXPO_PUBLIC_ANTHROPIC_API_KEY` in a release build.
- [ ] Run CI successfully on the exact release commit: type-check, lint, Jest tests, web export, iOS export.
- [ ] Add app icon, adaptive icon foreground and splash image to `app/app.json` (only background colours are set today).
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
  - Collected and linked to the user (account holders only): Health & fitness (check-ins, quiz answers), contact info (email, name), user ID, other user content (Ask Circadia questions, sent to the AI provider).
  - Not used for tracking or advertising; no data sold; no third-party analytics or ad SDKs.
  - Data encrypted in transit; users can request deletion in-app and via the web deletion page.
  - No location, contacts, photos, microphone or camera access (expo-av's microphone permission is disabled in `app.json`).
- [ ] Review final wellness copy so rhythm profiles are presented as app-generated reflections, not diagnoses, validated chronotypes, biological measurements, or guaranteed predictions.
- [ ] Confirm Ask Circadia refuses diagnosis, medication advice, and medical certainty in adversarial/manual tests.
- [ ] Confirm the AI consent screen appears before the first Ask Circadia request on a fresh install, and that turning it off in Settings stops requests.
- [ ] Listen to interface sounds and ambience on a physical iPhone (silent switch on and off) and an Android phone.
- [ ] Check the 3D world runs smoothly on an older iPhone and a mid-range Android phone (scrolling Today and Trends, the reading dive), and that "Reduce motion" makes it still.
- [ ] Confirm notification copy does not present predicted crashes, burnout, or health states as facts.

## Recommended beta gate

A beta candidate is ready when CI is green, Pulse uses only the secured server route, deletion works end-to-end, privacy disclosures match actual data flows, and the core flow has been tested on at least one physical iOS and one physical Android device.
