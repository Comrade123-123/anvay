import { db } from '../_lib/supabase';
import { fail, json } from '../_lib/http';
import { studentIdFrom } from '../_lib/auth';
import { toStudent } from '../_lib/mappers';
import { ddmmyyyy } from '../_lib/format';
import { buildSteps, type StageRow } from '../_lib/progress';
import { daysBetween, todayIst } from '../_lib/today';

const STATUS_LABEL: Record<number, string> = {
  0: 'Draft',
  1: 'Verification in Progress',
  2: 'Verification in Progress',
  3: 'Verification in Progress',
  4: 'District Review in Progress',
  5: 'Sanction in Progress',
  6: 'Disbursement in Progress',
};

// GET /api/home: everything the Home screen needs in one request.
export async function GET(request: Request) {
  const id = studentIdFrom(request);
  if (!id) return fail('Please sign in', 401);

  try {
    const studentQ = await db().from('students').select('*').eq('id', id).maybeSingle();
    if (studentQ.error) throw studentQ.error;
    if (!studentQ.data) return fail('Please sign in', 401);

    const appsQ = await db()
      .from('applications')
      .select('id, application_no, scheme_code, status, current_stage, expected_amount, form, schemes(title, title_hi)')
      .eq('student_id', id)
      .in('status', ['submitted', 'in_review', 'sanctioned'])
      .order('updated_at', { ascending: false })
      .limit(5);
    if (appsQ.error) throw appsQ.error;
    // A scholarship the student switched away from is not their active one any more.
    const appQ = { data: (appsQ.data ?? []).find((a: any) => !a.form?.switchedTo) ?? null };

    let application = null;
    if (appQ.data) {
      const a: any = appQ.data;
      const stagesQ = await db().from('application_stages').select('stage_no, state, occurred_at').eq('application_id', a.id);
      if (stagesQ.error) throw stagesQ.error;
      application = {
        id: a.id,
        applicationNo: a.application_no,
        schemeCode: a.scheme_code,
        title: a.schemes?.title ?? a.scheme_code,
        titleHi: a.schemes?.title_hi ?? null,
        amount: a.expected_amount,
        currentStage: a.current_stage,
        statusLabel: STATUS_LABEL[a.current_stage] ?? 'In Progress',
        steps: buildSteps((stagesQ.data ?? []) as StageRow[]),
      };
    }

    const unreadQ = await db().from('notifications').select('id', { count: 'exact', head: true }).eq('student_id', id).eq('unread', true);

    // What needs the student's attention, and the next date that matters, worked out from their own records.
    const [docsQ, datesQ, failedQ] = await Promise.all([
      db().from('documents').select('title, status, problems').eq('student_id', id).in('status', ['rejected', 'missing']).limit(1),
      db().from('deadlines').select('kind, title, subtitle, due_on').eq('student_id', id).order('due_on', { ascending: true }),
      db().from('payments').select('id', { count: 'exact', head: true }).eq('student_id', id).eq('status', 'failed'),
    ]);
    if (docsQ.error || datesQ.error) throw docsQ.error ?? datesQ.error;
    const today = todayIst();
    const dates = (datesQ.data ?? []) as any[];
    const badDoc: any = docsQ.data?.[0];
    const actionDate = dates.find((d) => d.kind === 'action');
    const alert = badDoc
      ? {
          kind: 'document' as const,
          title: `Re-upload ${badDoc.title}`,
          body: `${badDoc.title} was not accepted${badDoc.problems?.length ? ` (${badDoc.problems.join(', ')})` : ''}. Upload a clearer copy.`,
          due: actionDate ? ddmmyyyy(`${actionDate.due_on}T00:00:00+05:30`) : null,
          linkTo: 'wallet' as const,
        }
      : (failedQ.count ?? 0) > 0
        ? { kind: 'seeding' as const, title: 'Aadhaar seeding pending', body: 'A payment failed because your bank account is not mapped with NPCI.', due: null, linkTo: 'seeding' as const }
        : null;
    const next = dates.find((d) => d.kind === 'deadline' && daysBetween(today, d.due_on) >= 0);
    const nextDeadline = next ? { title: next.title as string, subtitle: (next.subtitle ?? '') as string, date: ddmmyyyy(`${next.due_on}T00:00:00+05:30`), daysLeft: daysBetween(today, next.due_on) } : null;

    return json({ student: toStudent(studentQ.data), application, unreadCount: unreadQ.count ?? 0, alert, nextDeadline });
  } catch {
    return fail('Could not load your dashboard', 500);
  }
}
