import { db } from '../_lib/supabase';
import { fail, json } from '../_lib/http';
import { studentIdFrom } from '../_lib/auth';

// POST /api/notifications/read-all   and   POST /api/notifications/:id/read
export async function POST(request: Request) {
  const studentId = studentIdFrom(request);
  if (!studentId) return fail('Please sign in', 401);
  const parts = new URL(request.url).pathname.split('/').filter(Boolean);

  try {
    let q = db().from('notifications').update({ unread: false }).eq('student_id', studentId).eq('unread', true);
    if (parts[parts.length - 1] === 'read') q = q.eq('id', decodeURIComponent(parts[parts.length - 2] ?? ''));
    const { error } = await q;
    if (error) throw error;
    return json({ ok: true });
  } catch {
    return fail('Could not update your notifications', 500);
  }
}
