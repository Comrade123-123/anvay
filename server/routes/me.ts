import { db } from '../_lib/supabase';
import { fail, json } from '../_lib/http';
import { studentIdFrom } from '../_lib/auth';
import { toStudent } from '../_lib/mappers';

// GET /api/me: the signed-in student's profile.
export async function GET(request: Request) {
  const id = studentIdFrom(request);
  if (!id) return fail('Please sign in', 401);
  const { data, error } = await db().from('students').select('*').eq('id', id).maybeSingle();
  if (error) return fail('Could not load your profile', 500);
  if (!data) return fail('Please sign in', 401);
  return json(toStudent(data));
}
