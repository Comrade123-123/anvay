# Database

`migrations/001_schema.sql` creates the tables (safe to run more than once).
`seed.sql` loads the demo student and the records the app shows (also safe to re-run).

Run them in order in the Supabase dashboard: SQL Editor, paste the file, Run.

All tables have row level security on and no policies, so only the API (service role) can read or write them.
