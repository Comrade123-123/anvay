import { db } from '../_lib/supabase';
import { fail, json } from '../_lib/http';
import { studentIdFrom } from '../_lib/auth';

// GET /api/notifications: newest first.
export async function GET(request: Request) {
  const id = studentIdFrom(request);
  if (!id) return fail('Please sign in', 401);
  const { data, error } = await db().from('notifications').select('*').eq('student_id', id).order('created_at', { ascending: false }).limit(100);
  if (error) return fail('Could not load your notifications', 500);
  return json({
    unread: (data ?? []).filter((n: any) => n.unread).length,
    items: (data ?? []).map((n: any) => ({
      id: n.id as string,
      category: n.category as 'payments' | 'applications' | 'deadlines' | 'general',
      tone: n.tone as 'green' | 'blue' | 'amber' | 'red',
      icon: (n.icon ?? 'bell-outline') as string,
      title: n.title as string,
      body: (n.body ?? '') as string,
      linkLabel: (n.link_label ?? null) as string | null,
      linkTo: (n.link_to ?? null) as string | null,
      unread: Boolean(n.unread),
      createdAt: n.created_at as string,
    })),
  });
}
