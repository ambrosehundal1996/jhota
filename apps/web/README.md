# JOTA marketing site

Next.js site for the public JOTA pages: home, privacy, support, terms, and account deletion.

```sh
npm install
npm run dev
```

From the repo root, `npm run site` does the same thing.

## Deploy

Create a Vercel project with the root directory set to `apps/web`. The app router serves each URL directly, including on refresh. Point `jota.app` at that project when the domain is ready. The iOS app already links privacy and terms to `https://jota.app`.

No secrets belong in this app. Public values live in `src/config/site.ts`.

## Before the App Store submission

Read `PRELAUNCH.md`. The same open items render at the bottom of the privacy, terms, and account deletion pages.
