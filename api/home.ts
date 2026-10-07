import { db } from './_lib/supabase';
import { fail, json } from './_lib/http';
import { studentIdFrom } from './_lib/auth';
import { toStudent } from './_lib/mappers';
import { ddmmyyyy } from './_lib/format';

type StageRow = { stage_no: number; state: 'done' | 'current' | 'upcoming'; occurred_at: string | null };

// The app shows six internal milestones as four steps: Submitted | Verified (stages 2-4) | Sanctioned | Disbursed.
function buildSteps(stages: StageRow[]) {
  const by = (n: number) => stages.find((s) => s.stage_no === n);
  const group = (nos: number[]) => {
    const rows = nos.map(by).filter(Boolean) as StageRow[];
    const done = rows.length > 0 && rows.every((r) => r.state === 'done');
    const started = rows.some((r) => r.state !== 'upcoming');
    const last = [...rows].reverse().find((r) => r.state === 'done' && r.occurred_at);
    return { state: done ? 'done' : started ? 'current' : 'todo', date: ddmmyyyy(last?.occurred_at) };
  };
  const submitted = group([1]);
  const verified = group([2, 3, 4]);
  const sanctioned = group([5]);
  const disbursed = group([6]);
  return [
    { key: 'submitted', label: 'Submitted', sub: submitted.date || 'Pending', state: submitted.state },
    { key: 'verified', label: 'Verified', sub: verified.date || 'In progress', state: verified.state },
    { key: 'sanctioned', label: 'Sanctioned', sub: sanctioned.state === 'done' ? sanctioned.date : 'Pending', state: sanctioned.state },
    { key: 'disbursed', label: 'Disbursed', sub: disbursed.state === 'done' ? disbursed.date : 'PFMS', state: disbursed.state },
  ];
}

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
