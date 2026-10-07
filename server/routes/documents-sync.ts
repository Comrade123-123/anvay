import { db } from '../_lib/supabase';
import { fail, json } from '../_lib/http';
import { studentIdFrom } from '../_lib/auth';

// POST /api/documents/sync: refreshes the documents that came from DigiLocker (simulated). Documents the student
// uploaded themselves are not DigiLocker records, so they are left as they are.
export async function POST(request: Request) {
  const id = studentIdFrom(request);
  if (!id) return fail('Please sign in', 401);
  try {
    const { data, error } = await db()
      .from('documents')
      .update({ verified_at: new Date().toISOString() })
      .eq('student_id', id)
      .eq('status', 'verified')
      .neq('issuer', 'Uploaded by student')
      .select('id');
    if (error) throw error;
    const needs = await db().from('documents').select('id', { count: 'exact', head: true }).eq('student_id', id).in('status', ['rejected', 'missing', 'pending']);
    return json({ refreshed: data?.length ?? 0, needAttention: needs.count ?? 0 });
  } catch {
    return fail('Could not reach DigiLocker. Please try again.', 500);
  }
}
