import { db } from '../_lib/supabase';
import { fail, json } from '../_lib/http';
import { studentIdFrom } from '../_lib/auth';
import { deadlineInfo, evaluate, statusFor } from '../_lib/eligibility';

const ACTIVE = ['submitted', 'in_review', 'sanctioned', 'credited'];

// GET /api/schemes: every scheme with this student's eligibility, plus the counts the Scholarships hub shows.
export async function GET(request: Request) {
  const id = studentIdFrom(request);
  if (!id) return fail('Please sign in', 401);

  try {
    const [studentQ, schemesQ, appsQ] = await Promise.all([
      db().from('students').select('category, income_annual, course, institute').eq('id', id).maybeSingle(),
      db().from('schemes').select('*').order('amount_value', { ascending: false }),
      db().from('applications').select('id, scheme_code, status, current_stage, expected_amount').eq('student_id', id),
    ]);
    if (studentQ.error || schemesQ.error || appsQ.error) throw studentQ.error ?? schemesQ.error ?? appsQ.error;
    const student = studentQ.data;
    if (!student) return fail('Please sign in', 401);

    const apps = appsQ.data ?? [];
    const items = (schemesQ.data ?? []).map((s: any) => {
      const app = apps.find((a: any) => a.scheme_code === s.code);
      const checks = evaluate(student, s);
      const { status, reason } = statusFor(checks, Boolean(app && ACTIVE.includes(app.status)));
      return {
        code: s.code,
        title: s.title,
        titleHi: s.title_hi,
        category: s.category,
        amountText: s.amount_text,
        amountValue: s.amount_value,
        summary: s.summary,
        ...deadlineInfo(s.deadline),
        status,
        reason,
        matched: checks.filter((c) => c.ok).length,
        total: checks.length,
        checks,
        applicationId: app?.id ?? null,
        applicationStatus: app?.status ?? null,
      };
    });

    const order = { enrolled: 0, eligible: 1, not_eligible: 2 } as const;
    items.sort((a, b) => order[a.status] - order[b.status] || (b.amountValue ?? 0) - (a.amountValue ?? 0));

    const summary = {
      total: items.length,
      active: items.filter((i) => i.status === 'enrolled').length,
      eligible: items.filter((i) => i.status === 'eligible').length,
      ineligible: items.filter((i) => i.status === 'not_eligible').length,
    };
    return json({ summary, schemes: items });
  } catch {
    return fail('Could not load schemes', 500);
  }
}
