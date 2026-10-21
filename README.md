# Jota

A protein-first iOS app: set a daily protein range, log what you eat in seconds, and build consistency.

| Path | What it is |
| --- | --- |
| `apps/mobile` | React Native (CLI, no Expo) iOS app with a WidgetKit extension |
| `apps/api` | Vercel Functions: food search proxy, AI photo estimates, RevenueCat webhook |
| `packages/domain` | Pure TypeScript business rules (protein range, totals, streaks, reminders) shared by both |
| `supabase` | Postgres schema, RLS policies, storage bucket, local config |

Secrets (OpenAI, Supabase service role, USDA, RevenueCat webhook auth) live only in the API's environment. The app ships with the Supabase anon key and the RevenueCat public SDK key only.

## Prerequisites

- Node 22+ and npm 10+ (the repo is an npm workspaces monorepo)
- Xcode 16+ with an iOS 17+ simulator, CocoaPods
- A Supabase project, a Vercel account, a RevenueCat project, an OpenAI API key, and a free USDA FoodData Central key (https://fdc.nal.usda.gov/api-key-signup)

## Setup

```sh
npm install            # run at the repo root; installs every workspace
npm run build:domain
npm test               # domain, api, and mobile unit tests
npm run typecheck
npm run lint
```

From the root, `npm run start`, `npm run ios`, `npm run pods`, `npm run web` and `npm run build:web` forward to the mobile app. Use `-w <workspace>` to run any other workspace script, e.g. `npm run dev -w @jota/api`.

### Supabase

1. Create a project, then apply `supabase/migrations/*` (`supabase db push`, or paste into the SQL editor).
2. Auth: enable **Anonymous sign-ins** and **Manual linking**, and enable the **Apple** provider with your Services ID / bundle id `app.jota.ios`.
3. The migration creates the private `meal-photos` storage bucket and all RLS policies.

### API (Vercel)

1. Create a Vercel project with root directory `apps/api` (the `vercel.json` build command builds `packages/domain`).
2. Copy the keys from `apps/api/.env.example` into the project's environment variables.
3. Deploy, then check `GET /api/health`.
4. In RevenueCat, add a webhook to `https://<your-api>/api/webhooks/revenuecat` with the Authorization header set to `REVENUECAT_WEBHOOK_AUTH`.

Food data comes from USDA FoodData Central (search and details) and Open Food Facts (barcodes). Both are free; a FatSecret adapter can be added behind the same `FoodProvider` interface in `apps/api/lib/foods`.

### iOS app

```sh
cd apps/mobile
cp .env.example .env              # fill in the public values
JOTA_TEAM_ID=XXXXXXXXXX npm run xcode:configure   # bundle ids, iOS 17, entitlements, widget target
npm run pods
npm start                         # Metro
npm run ios                       # or open ios/Jota.xcworkspace
```

`ios/scripts/configure_xcode.rb` is idempotent. It sets the app (`app.jota.ios`) and widget (`app.jota.ios.widget`) bundle ids, the App Group `group.app.jota`, Sign in with Apple, and embeds the `JotaWidget` extension. Register the App Group and both bundle ids in your Apple Developer account.

#### Subscriptions

Create an entitlement (default id `pro`) and an offering with monthly and annual products in RevenueCat. Give both App Store products a 7-day free introductory offer. The paywall reads prices and the trial from the offering; nothing is hard-coded. In debug builds you can skip the paywall from the paywall screen or Profile → Developer. The paywall is off unless `PAYWALL_ENABLED=true` (or `1`) in `apps/mobile/.env`; when off, RevenueCat is never configured, onboarding goes straight to the app, and Profile hides the subscription rows. If `REVENUECAT_IOS_API_KEY` is empty, the app also runs without a paywall.

### Web app

The same app runs in the browser through React Native for Web, bundled with webpack.

```sh
cd apps/mobile
npm run web                       # http://localhost:8080 (add ?devSeed for demo data)
npm run build:web                 # static build in apps/mobile/web-build/
```

The web build reads the public values from `apps/mobile/.env`. To let it call the API, set `WEB_ALLOWED_ORIGINS` in the Vercel project (for example `http://localhost:8080,https://app.example.com`).

Native-only features have `.web.ts(x)` stand-ins:
- Data is stored in `localStorage` instead of MMKV.
- Barcodes are typed in instead of scanned.
- Reminders, Sign in with Apple, subscriptions and widgets are hidden, so the paywall never shows on web.
- Photo logging uses the browser's file picker.

Browser URLs use the deep-link paths, e.g. `/progress`, `/log/quick-add` or `/day/2026-10-11`.

#### Deep links

`jota://today`, `jota://progress`, `jota://log`, `jota://log/quick-add`, `jota://log/photo`, `jota://log/search`, `jota://log/set-total`, `jota://log/barcode`, `jota://day/YYYY-MM-DD`. Widget links append `?src=widget` for attribution.

## How it works

- **Offline-first.** All data lives in a persisted local store (MMKV) and syncs through an outbox to Supabase when online. Rows use client-generated UUIDs, so retries are safe.
- **Accounts.** Every install gets an anonymous Supabase user. Sign in with Apple links to that same user, so data and the subscription carry over.
- **Daily total.** The day's total is the sum of its logs, unless the user sets the day's total manually (`daily_overrides`). In that case the override wins and the logs are kept.
- **Goal.** The suggested range is 0.7–1.0 g per lb, rounded to the nearest 5. Reaching the minimum counts as hitting the goal. A custom range is never overwritten without confirmation.
- **Reminders.** A 2 PM nudge if nothing is logged, plus 4 PM and 7 PM reminders of how much protein is left. The schedule is re-planned whenever data changes.
- **AI photos.** The photo is uploaded to private storage, and the API asks OpenAI for structured item estimates. The user reviews and edits everything before anything is logged. Analytics never include photo contents, food names, or typed text.
