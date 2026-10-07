import { db } from '../_lib/supabase';
import { fail, json } from '../_lib/http';
import { studentIdFrom } from '../_lib/auth';
import { toStudent } from '../_lib/mappers';
import { ddmmyyyy } from '../_lib/format';
import { buildSteps, type StageRow } from '../_lib/progress';

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

    return json({ student: toStudent(studentQ.data), application, unreadCount: unreadQ.count ?? 0 });
  } catch {
    return fail('Could not load your dashboard', 500);
  }
}
