# JOTA website — pre-launch checklist

Source of truth for the open items: `src/config/site.ts` (`siteConfig` and `confirmed`). The privacy, terms, and account deletion pages render the same list. Do not fill a gap with a guess.

The site is safe to deploy as a draft. Download buttons email `support@jota.app` until an App Store or TestFlight URL exists. Legal pages are labeled drafts.

## Contact and legal identity

- [ ] Confirm `support@jota.app` receives mail. That is `SUPPORT_EMAIL` in `apps/mobile/.env.example`. The personal feedback address in the mobile env is not published on this site.
- [ ] Set `legalEntity` to the operating company. The footer currently says “JOTA” because the field is empty.
- [ ] Set `businessAddress`.
- [ ] Have counsel review the privacy policy and terms. Then set `privacyEffectiveDate` and `confirmed.legalReviewComplete`.
- [ ] Choose governing law and a dispute process. The terms leave this blank.
- [ ] Set a minimum age. The app has no age gate.

## Launch links

- [ ] Give this site its own Vercel project (root `apps/web`) and its own URL. https://jhota.vercel.app must stay the API. The app currently links privacy and terms to `https://jhota.vercel.app/privacy` and `https://jhota.vercel.app/terms`, which 404 on the API host. Point `PRIVACY_URL` and `TERMS_URL` at the marketing host after it exists.
- [ ] Add `appStoreUrl` when a real listing exists. The button then reads “Get Jota”.
- [ ] Add `testFlightUrl` if the beta should be a link. The button then reads “Join the beta”.
- [ ] Add `instagramUrl` and `tiktokUrl`. The footer hides them until they are set.

## Privacy — do not claim these until they are verified

- [ ] OpenAI retention and training. The API sends a five-minute signed photo URL to `https://api.openai.com/v1/responses`. The code does not set a zero-retention header.
- [ ] How long meal photos and `ai_photo_analyses` rows are kept. Nothing expires them. Removing a meal soft-deletes the log and does not delete the storage object.
- [ ] Whether photo files are deleted with the account. Database rows that reference `auth.users` cascade. `beta_feedback` keeps the message and nulls `user_id`. No storage cleanup trigger was found.
- [ ] A reviewed position on selling or sharing personal information. The app has no ad SDK. That is not a “we never sell” promise.
- [ ] Data regions for Supabase, Vercel, OpenAI, and PostHog.
- [ ] Any encryption-at-rest wording. The site only says the API URL is HTTPS and the photo bucket is private.
- [ ] How people will hear about policy or terms changes.
- [ ] PostHog project, region, and retention. Events send only when `POSTHOG_API_KEY` is set, use the Supabase user id, and are written to exclude photo contents, food names, and typed meal notes.
- [ ] What RevenueCat stores when the paywall is on. The example env has `PAYWALL_ENABLED=false`.

## Subscription

- [ ] Confirm whether the shipped app is charging. The example configuration does not show a paywall.
- [ ] Confirm the 7-day introductory offer is attached to the live monthly and annual products.
- [ ] Add a price to the website only if you want it repeated here. The app reads price from the App Store.

## Account deletion

- [ ] Ship an in-app deletion flow, or staff a manual process. The app creates an account on install and has no delete control. Apple expects account deletion for apps that create accounts. This site does not include a fake delete button.
- [ ] Decide what, if anything, must be retained after a deletion request.

## Brand

- [ ] Food photography is stock from Unsplash, captioned for what is in the frame. Replace it with commissioned photos if the launch should not use stock.
- [ ] Interface pictures are renderings of the real Jota screens, with example grams. They are not captured screenshots. Swap in real screenshots when you have them.

## What the pages already state from the code

Anonymous Supabase account on install, optional Sign in with Apple, profile and food-log fields, private `meal-photos` bucket, OpenAI estimate that the user reviews before logging, USDA search, Open Food Facts barcodes, local reminders, Home Screen widget, Lock Screen Live Activity, quick add, an editable protein range where the minimum is the success line, and soft-deleted logs.
