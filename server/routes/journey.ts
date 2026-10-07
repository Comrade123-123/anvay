import { db } from '../_lib/supabase';
import { fail, json } from '../_lib/http';
import { studentIdFrom } from '../_lib/auth';
import { ddmmyyyy } from '../_lib/format';
import { isActive } from '../_lib/applications';
import { STAGE_DESC, STAGE_ICON } from '../_lib/stages';

// GET /api/journey: the student's active application as six milestones, plus the expected payment and bank details.
export async function GET(request: Request) {
  const id = studentIdFrom(request);
  if (!id) return fail('Please sign in', 401);

  try {
    const [studentQ, appsQ] = await Promise.all([
      db().from('students').select('name, bank_name, account_last4, aadhaar_seeded, npci_mapped').eq('id', id).maybeSingle(),
      db()
        .from('applications')
        .select('id, application_no, status, current_stage, expected_amount, form, submitted_at, schemes(title, title_hi)')
        .eq('student_id', id)
        .neq('status', 'draft')
        .order('updated_at', { ascending: false })
        .limit(6),
    ]);
    if (studentQ.error || appsQ.error) throw studentQ.error ?? appsQ.error;
    if (!studentQ.data) return fail('Please sign in', 401);

    const app: any = (appsQ.data ?? []).find((a: any) => isActive(a));
    const student: any = studentQ.data;
    const bank = {
      name: student.bank_name as string | null,
      last4: student.account_last4 as string | null,
      seeded: Boolean(student.aadhaar_seeded && student.npci_mapped),
    };
    if (!app) return json({ application: null, bank, beneficiary: student.name });

    const stagesQ = await db().from('application_stages').select('*').eq('application_id', app.id).order('stage_no', { ascending: true });
    if (stagesQ.error) throw stagesQ.error;
    const rows = (stagesQ.data ?? []) as any[];

    const finished = rows.length === 6 && rows.every((s) => s.state === 'done');
    const steps = rows.map((s) => {
      const done = s.state === 'done';
      const dated = /\d{2}\/\d{2}\/\d{4}/.test(s.detail ?? '');
      const meta = done && !dated && s.occurred_at ? `${s.detail} · ${ddmmyyyy(s.occurred_at)}` : (s.detail ?? '');
      return {
        n: s.stage_no as number,
        state: (s.state === 'upcoming' && s.stage_no === 6 ? 'final' : s.state) as 'done' | 'current' | 'upcoming' | 'final',
        title: s.title as string,
        hi: (s.title_hi ?? null) as string | null,
        badge: done ? (s.stage_no === 3 ? 'CONFIRMED' : 'VERIFIED') : s.state === 'current' ? 'IN PROGRESS' : s.stage_no === 6 ? 'FINAL STEP' : 'UPCOMING',
        icon: STAGE_ICON[s.stage_no] ?? 'clock-outline',
        meta,
        desc: s.stage_no === 6 && app.expected_amount ? `₹${Number(app.expected_amount).toLocaleString('en-IN')} ${STAGE_DESC[6].charAt(0).toLowerCase()}${STAGE_DESC[6].slice(1)}` : STAGE_DESC[s.stage_no],
        desk: (s.desk ?? null) as string | null,
        eta: (s.eta ?? null) as string | null,
      };
    });

    const current = rows.find((s) => s.state === 'current');
    const remaining = rows.filter((s) => s.state !== 'done').length;
    const expectedDays = finished ? 0 : Math.max(1, remaining * 4);
    const expectedOn = new Date(Date.now() + expectedDays * 86_400_000);

    return json({
      application: {
        id: app.id,
        applicationNo: app.application_no,
        title: app.schemes?.title,
        titleHi: app.schemes?.title_hi,
        amount: app.expected_amount as number | null,
        academicYear: '2026–27',
        currentStage: current?.stage_no ?? (finished ? 6 : app.current_stage),
        finished,
        steps,
        expected: {
          days: expectedDays,
          date: ddmmyyyy(expectedOn),
        },
      },
      bank,
      beneficiary: student.name,
    });
  } catch {
    return fail('Could not load your application status', 500);
  }
}
