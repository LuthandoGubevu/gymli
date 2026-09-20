# Gymli

Gymli is a single-branch gym membership app: check-in/crowd tracking, class & trainer
booking, group chat, and a member dashboard. Built with Next.js 15, TypeScript,
Firebase (Auth + Firestore), ShadCN UI, and Tailwind CSS.

## Getting started

```bash
npm install
npm run dev
```

The app runs on http://localhost:9002 by default (see `dev` script in `package.json`).

## Firestore rules

This repo has no `firebase.json`/deploy pipeline. `firestore.rules` at the repo root
is the canonical ruleset — copy its contents into the Firebase console's Firestore
Rules editor whenever it changes.

## Seeding data

```bash
npm run seed
```

Requires a Firebase service-account key. Set `GOOGLE_APPLICATION_CREDENTIALS` to the
path of a gitignored service-account JSON file before running. Pass `--reset` to
also delete legacy multi-gym collections from earlier versions of the app:

```bash
npm run seed -- --reset
```

## AI Coach

The AI Coach feature (`/app/coach`) calls Google's Gemini API via Genkit. This app
deploys to Netlify, not Firebase App Hosting, so there's no ambient credential for
this — set a `GEMINI_API_KEY` environment variable in the Netlify dashboard (Site
settings → Environment variables) with a key from
[Google AI Studio](https://aistudio.google.com/apikey). Without it, generating a
plan will fail with a 500 from `/api/ai/weekly-plan`.

## Project structure

- `src/app` — Next.js App Router pages (`(auth)` for login/signup, `app` for the
  authenticated member/admin experience).
- `src/components` — shared React components, including the `ui/` ShadCN primitives.
- `src/hooks` — data-fetching hooks (`useGym`, `useClasses`, `useTrainers`, etc.).
- `src/lib` — types, Firebase client setup, and small utilities.
- `src/ai` — Genkit AI flow setup.
- `scripts/seed.ts` — one-time/dev Firestore seed script.
