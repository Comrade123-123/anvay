# ANVAY

A scholarship app for Scheduled Tribe students (Ministry of Tribal Affairs, India). Students find the schemes they
qualify for, apply with documents pulled from their DigiLocker wallet, follow the application through every desk,
see why a payment failed and fix it, and raise grievances with a clear timeline. Everything is bilingual (Hindi and
English) and works on phones, tablets and the web from one codebase.

> Status: working prototype. All 22 screens run on a real backend (Supabase + serverless API). Government systems
> (DigiLocker, NPCI / PFMS, UIDAI) and SMS are simulated behind adapters, and sign-in accepts the demo OTP.

## Stack

- App: React Native 0.86 with Expo SDK 57, React 19, TypeScript
- Web: react-native-web (same code), shown inside a phone frame on desktop browsers
- API: one serverless function (`api/router.ts`) that dispatches to handlers in `server/routes/`, TypeScript
- Data: Supabase (Postgres and private file storage)

## What is real and what is simulated

| Real | Simulated |
| --- | --- |
| Sign-in session (signed token), profile, schemes and the eligibility rules | OTP (the demo code is set in `DEMO_OTP`), any number signs in as the demo student |
| Applications, stages, documents (files in private storage), payments, notifications | Document verification (a file name containing "blur" or "mismatch" is rejected) |
| Grievances with tickets and ratings, calendar, JAGO chat (keyword rules over the student's own records) | DigiLocker refresh, NPCI Aadhaar seeding, PFMS payment retry |
| Offline: saved screens, grievance outbox that uploads when back online | The "move to next stage" control on Journey (stands in for the officers); the SMS number |

## Project layout

```
App.tsx                route state + back history
src/screens/           the 22 screens
src/components/        shared UI (tab bar, toast, offline banner, load/error state, device frame)
src/api/               client, saved-screen cache, offline outbox, connectivity, typed responses
src/state/             sign-in session
server/router.ts       maps /api/... paths to handlers
server/routes/         one file per endpoint
server/_lib/           env, database client, eligibility rules, JAGO, adapters for government services
api/router.ts          the only serverless function (Vercel's free plan allows 12)
supabase/              schema migration and demo seed data
scripts/postexport.js  fixes the web build for Vercel
```

## Run it

```bash
npm install
npm run web          # app in the browser
npm run typecheck
```

Copy `.env.example` to `.env.local` and fill in the values below to run the API.

## Set up the database

1. Create a Supabase project.
2. In the SQL editor run `supabase/migrations/001_schema.sql`, then `supabase/seed.sql`.
3. `GET /api/health` reports whether every table is present.

## Deploy

Vercel builds with `npm run build:web` and serves `dist/`; `/api/*` is rewritten to the single function. Set these in
the project settings (Production): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `DEMO_OTP`. The service
role key must stay on the server; the app never receives it.

## Demo notes

- Profile > "Reset demo data" puts the demo student back to the seed state (application at stage 4, one failed
  payment, admission letter rejected, two grievances, empty chat). Use it after trying the flows.
- Dates on the calendar are measured from today's date in India; the "re-upload" date is reset to a week ahead.
