import { hasSupabaseEnv } from '../_lib/env';
import { db } from '../_lib/supabase';
import { json } from '../_lib/http';
import { studentIdFrom } from '../_lib/auth';
import { probeAi, providerInUse } from '../_lib/jago-ai';

const TABLES = [
  'students', 'schemes', 'applications', 'application_stages', 'documents',
  'payments', 'notifications', 'grievances', 'deadlines', 'chat_messages',
] as const;

// GET /api/health: whether the API is up, whether it can reach the database, and which tables exist (with row counts).
export async function GET(request: Request) {
  let database: 'not_configured' | 'reachable' | 'error' = 'not_configured';
  const tables: Record<string, number | 'missing'> = {};

  if (hasSupabaseEnv()) {
    database = 'reachable';
    for (const t of TABLES) {
      try {
        const { count, error } = await db().from(t).select('*', { count: 'exact', head: true });
        if (!error) tables[t] = count ?? 0;
        else if (/relation|does not exist|schema cache/i.test(error.message)) tables[t] = 'missing';
        else database = 'error';
      } catch {
        database = 'error';
      }
    }
  }
  const missing = Object.entries(tables).filter(([, v]) => v === 'missing').map(([k]) => k);
  const schema = database === 'not_configured' ? 'unknown' : missing.length === 0 ? 'ready' : 'incomplete';
  // Which AI provider JAGO uses (never the key). A signed-in student can add ?ai=1 to run one test call and see the answer.
  const ai: Record<string, unknown> = { provider: providerInUse() ?? 'rules' };
  if (new URL(request.url).searchParams.get('ai') === '1' && studentIdFrom(request)) ai.probe = await probeAi();
  return json({ service: 'anvay-api', time: new Date().toISOString(), database, schema, missing, tables, ai });
}
