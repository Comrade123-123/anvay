import { db } from '../_lib/supabase';
import { fail, json } from '../_lib/http';
import { studentIdFrom } from '../_lib/auth';
import { idFromPath } from '../_lib/applications';

// POST /api/grievances/:id/rate  { rating: 1-5 }: the student rates how a resolved grievance was handled.
export async function POST(request: Request) {
  const studentId = studentIdFrom(request);
  if (!studentId) return fail('Please sign in', 401);
  const body = await request.json().catch(() => null);
  const rating = Number(body?.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fail('Rating must be 1 to 5', 422);

  try {
    const { data, error } = await db()
      .from('grievances')
      .update({ rating })
      .eq('id', idFromPath(request, 2))
      .eq('student_id', studentId)
      .eq('status', 'resolved')
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return fail('Only your resolved grievances can be rated', 404);
    return json({ rating });
  } catch {
    return fail('Could not save your rating', 500);
  }
}
