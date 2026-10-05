# ANVAY

A scholarship app for Scheduled Tribe students (Ministry of Tribal Affairs, India). Students find the schemes they
qualify for, apply with documents pulled from their DigiLocker wallet, follow the application through every desk,
see why a payment failed and fix it, and raise grievances with a clear timeline. Everything is bilingual (Hindi and
English) and works on phones, tablets and the web from one codebase.

> Status: working prototype. The 22 screens and their flow are complete. The backend is being added in parts; until a
> screen is wired to it, it shows demo data. Government systems (DigiLocker, NPCI / PFMS, UIDAI) are simulated.

## Stack

- App: React Native 0.86 with Expo SDK 57, React 19, TypeScript
- Web: react-native-web (same code), shown inside a phone frame on desktop browsers
- API: serverless functions in `api/` (Vercel), TypeScript
- Data: Supabase (Postgres and file storage)

## Project layout

```
App.tsx              route state + back history
src/screens/         the 22 screens
src/components/      shared UI (tab bar, OTP input, toast, device frame, illustrations)
src/theme/           colors, typography, spacing, responsive helpers
src/api/             client the screens use to call the API
api/                 serverless endpoints (api/health.ts is the first one)
api/_lib/            env, database client, response helpers
api/_lib/adapters/   stand-ins for government services (swap for real integrations later)
supabase/migrations/ database schema, in order
scripts/postexport.js  fixes the web build for Vercel
```

## Run it

```bash
npm install
npm run web          # app in the browser
npm run typecheck
```

Copy `.env.example` to `.env.local` and fill in the Supabase values to run the API.

## Deploy

Vercel builds with `npm run build:web` and serves `dist/`; `api/` becomes the serverless functions.
Set the variables from `.env.example` in the Vercel project settings.
