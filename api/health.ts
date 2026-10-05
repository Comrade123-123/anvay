import { hasSupabaseEnv } from './_lib/env';
import { db } from './_lib/supabase';
import { json } from './_lib/http';

// GET /api/health: tells us whether the API is up and whether it can reach the database.
export async function GET() {
  let database: 'not_configured' | 'reachable' | 'error' = 'not_configured';
  if (hasSupabaseEnv()) {
    try {
      const { error } = await db().from('students').select('id', { head: true, count: 'exact' }).limit(1);
      // A missing table still proves the connection works; only network / auth failures count as "error".
      database = error && !/relation|does not exist|schema cache/i.test(error.message) ? 'error' : 'reachable';
    } catch {
      database = 'error';
    }
  }
  return json({ service: 'anvay-api', time: new Date().toISOString(), database });
}
