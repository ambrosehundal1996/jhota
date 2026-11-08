# JOTA marketing site

Next.js site for the public JOTA pages: home, privacy, support, terms, and account deletion.

```sh
npm install
npm run dev
```

From the repo root, `npm run site` does the same thing.

## Deploy

Deploy this as its own Vercel project with root directory `apps/web`. Leave https://jhota.vercel.app on the API project (`apps/api`). Putting this app on that host would replace the API. `jota.app` is not connected to either project.

No secrets belong in this app. Public values live in `src/config/site.ts`.

## Before the App Store submission

Read `PRELAUNCH.md`. The same open items render at the bottom of the privacy, terms, and account deletion pages.
