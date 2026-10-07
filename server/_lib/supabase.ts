import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { readEnv } from './env';

let client: SupabaseClient | null = null;

// Server-side client (service role). It bypasses row level security, so it must only be used inside api/ functions
// and every query has to be scoped to the signed-in student by the function itself.
export function db(): SupabaseClient {
  if (client) return client;
  const { supabaseUrl, serviceRoleKey } = readEnv();
  if (!supabaseUrl || !serviceRoleKey) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set');
  client = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  return client;
}
