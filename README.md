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
| Sign-in session (signed token), profile, schemes and the eligibility rules; SMS OTP when an SMS provider is configured (see below) | In demo mode the OTP is the fixed `DEMO_OTP`; a number with no student record signs in as the demo student |
| Applications, stages, documents (files in private storage), payments, notifications | Document verification (a file name containing "blur" or "mismatch" is rejected) |
| Grievances with tickets and ratings, calendar, JAGO chat (answers from the student's own records: a language model when `GEMINI_API_KEY` (free) or `ANTHROPIC_API_KEY` is set, keyword rules otherwise) | DigiLocker refresh, NPCI Aadhaar seeding, PFMS payment retry |
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

## Real SMS OTP (optional)

Without the settings below the app stays in demo mode (fixed OTP, no SMS). To text a real OTP:

1. Run `supabase/migrations/002_otp.sql` in the Supabase SQL editor.
2. Create an MSG91 account, register the sender ID and an OTP template on DLT, and get the template id.
3. Set `SMS_PROVIDER=msg91`, `MSG91_AUTH_KEY` and `MSG91_TEMPLATE_ID` in Vercel (Production) and redeploy.

Rules: the OTP is 6 digits, valid 5 minutes, 5 wrong tries per code, 30 seconds between codes, 5 codes per hour per
number. Only a keyed hash is stored. Aadhaar-number sign-in is refused in this mode (it needs UIDAI's own service).
Logic tests: `npx tsx --experimental-test-module-mocks --test scripts/otp.test.mts`.

## AI answers for JAGO (optional, free option available)

JAGO answers free-form questions (Hindi, English or Hinglish) with a language model that is shown only the signed-in
student's own records: profile, application and stages, payments, documents, dates, grievances and scheme eligibility.
The status and documents cards are still built by the app.

- **Free:** create a key at https://aistudio.google.com/apikey (Google AI Studio, no card) and set `GEMINI_API_KEY` in
  Vercel (Production), then redeploy. Model `gemini-3.6-flash`, falling back to other free Gemini models (3.8 flash, 3.5 and 3.1 flash-lite) when the free
  quota of the first is used up. `GEMINI_MODEL` overrides the first model.
- **Paid alternative:** `ANTHROPIC_API_KEY` (used only when no Gemini key is set).
- **No key:** the keyword rules answer. They also answer whenever the model errors, is out of quota or declines, so chat
  never breaks.

Each student can send 40 AI questions per hour; each question is 500 characters at most. Free-tier limits are set by
Google and can change; on the free tier, Google may use the prompts to improve its products, so do not use real student
data with it in production.
Logic tests: `npx tsx --experimental-test-module-mocks --test scripts/jago-ai.test.mts`.

## Keeping the free database awake

A free Supabase project is paused after about a week without activity, and every screen then fails. `vercel.json`
has a daily cron (02:30 UTC) that calls `/api/health`, which queries every table, so the project always counts as
active. It shows under the Vercel project's Settings > Cron Jobs. If the project is ever paused anyway, use "Restore
project" in the Supabase dashboard; the data is kept.

## Demo notes

- Profile > "Reset demo data" puts the demo student back to the seed state (application at stage 4, one failed
  payment, admission letter rejected, two grievances, empty chat). Use it after trying the flows.
- Dates on the calendar are measured from today's date in India; the "re-upload" date is reset to a week ahead.
