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
- [ ] Publish a public privacy-policy URL.
- [ ] Publish a public web account-deletion request/initiation page for Google Play.
- [ ] Replace/verify the support contact shown in the legal screen.
- [ ] Complete Apple privacy disclosures and Google Play Data safety / Health apps declarations from the behavior of the final build.
- [ ] Review final wellness copy so rhythm profiles are presented as app-generated reflections, not diagnoses, validated chronotypes, biological measurements, or guaranteed predictions.
- [ ] Confirm Pulse refuses diagnosis, medication advice, and medical certainty in adversarial/manual tests.
- [ ] Confirm notification copy does not present predicted crashes, burnout, or health states as facts.

## Recommended beta gate

A beta candidate is ready when CI is green, Pulse uses only the secured server route, deletion works end-to-end, privacy disclosures match actual data flows, and the core flow has been tested on at least one physical iOS and one physical Android device.
