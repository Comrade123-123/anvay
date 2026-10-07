import { hasSupabaseEnv } from './_lib/env';
import { db } from './_lib/supabase';
import { json } from './_lib/http';

// GET /api/health: tells us whether the API is up, whether it can reach the database, and whether the schema is loaded.
export async function GET() {
  let database: 'not_configured' | 'reachable' | 'error' = 'not_configured';
  let schema: 'ready' | 'missing' | 'unknown' = 'unknown';
  let students: number | null = null;

  if (hasSupabaseEnv()) {
    try {
      const { count, error } = await db().from('students').select('id', { count: 'exact', head: true });
      if (!error) {
        database = 'reachable';
        schema = 'ready';
        students = count ?? 0;
      } else if (/relation|does not exist|schema cache/i.test(error.message)) {
        // The connection works, the tables just have not been created yet.
        database = 'reachable';
        schema = 'missing';
      } else {
        database = 'error';
      }
    } catch {
      database = 'error';
    }
  }
  return json({ service: 'anvay-api', time: new Date().toISOString(), database, schema, students });
}
