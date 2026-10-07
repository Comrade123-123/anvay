import { db } from '../_lib/supabase';
import { fail, json } from '../_lib/http';
import { studentIdFrom } from '../_lib/auth';
import { daysBetween, todayIst } from '../_lib/today';

type Kind = 'action' | 'deadline' | 'renewal' | 'payment';

// GET /api/calendar: the student's dates, worked out against today's date in India.
// An "action" date (for example re-uploading a document) only shows while a wallet document still needs that.
export async function GET(request: Request) {
  const id = studentIdFrom(request);
  if (!id) return fail('Please sign in', 401);

  try {
    const [rowsQ, docsQ] = await Promise.all([
      db().from('deadlines').select('*').eq('student_id', id).order('due_on', { ascending: true }),
      db().from('documents').select('status').eq('student_id', id),
    ]);
    if (rowsQ.error || docsQ.error) throw rowsQ.error ?? docsQ.error;

    const today = todayIst();
    const needsUpload = (docsQ.data ?? []).some((d: any) => d.status === 'rejected' || d.status === 'missing');

    const items = ((rowsQ.data ?? []) as any[])
      .filter((r) => r.kind !== 'action' || needsUpload)
      .map((r) => {
        const kind = r.kind as Kind;
        const daysLeft = daysBetween(today, r.due_on);
        const group = daysLeft <= 7 ? 'This week' : daysLeft <= 30 ? 'This month' : 'Later';
        const pill = kind === 'renewal' ? 'Renewal' : kind === 'payment' ? 'Payment' : daysLeft < 0 ? 'Overdue' : daysLeft === 0 ? 'Today' : `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`;
        return { id: r.id as string, kind, date: r.due_on as string, title: r.title as string, subtitle: (r.subtitle ?? '') as string, linkTo: (r.link_to ?? null) as string | null, daysLeft, group, pill };
      })
      // a missed deadline is dropped; a missed action stays visible as overdue
      .filter((i) => i.daysLeft >= 0 || i.kind === 'action');

    const priority = items.find((i) => i.kind === 'action') ?? items.find((i) => i.kind === 'deadline') ?? null;
    return json({ today, items, priority });
  } catch {
    return fail('Could not load your calendar', 500);
  }
}
