import { db } from '../_lib/supabase';
import { fail, json } from '../_lib/http';
import { studentIdFrom } from '../_lib/auth';
import { deadlineInfo, evaluate, statusFor } from '../_lib/eligibility';

const ACTIVE = ['submitted', 'in_review', 'sanctioned', 'credited'];

// GET /api/schemes/:code: one scheme, this student's rule-by-rule eligibility, and the documents it needs with the
// state of each one in the student's wallet.
export async function GET(request: Request) {
  const id = studentIdFrom(request);
  if (!id) return fail('Please sign in', 401);
  const code = decodeURIComponent(new URL(request.url).pathname.split('/').pop() ?? '');

  try {
    const schemeQ = await db().from('schemes').select('*').eq('code', code).maybeSingle();
    if (schemeQ.error) throw schemeQ.error;
    if (!schemeQ.data) return fail('Scheme not found', 404);
    const s: any = schemeQ.data;

    const [studentQ, appQ, docsQ] = await Promise.all([
      db().from('students').select('category, income_annual, course, institute, bank_name, account_last4, aadhaar_seeded, npci_mapped').eq('id', id).maybeSingle(),
      db().from('applications').select('id, status, current_stage').eq('student_id', id).eq('scheme_code', code).maybeSingle(),
      db().from('documents').select('kind, title, status').eq('student_id', id),
    ]);
    if (studentQ.error || appQ.error || docsQ.error) throw studentQ.error ?? appQ.error ?? docsQ.error;
    if (!studentQ.data) return fail('Please sign in', 401);

    const checks = evaluate(studentQ.data, s);
    const { status, reason } = statusFor(checks, Boolean(appQ.data && ACTIVE.includes((appQ.data as any).status)));

    // Match each required document name against what the student already holds.
    const held = docsQ.data ?? [];
    const documents = (s.documents as string[]).map((name) => {
      const key = name.toLowerCase().split(' ')[0];
      const doc = held.find((d: any) => d.title.toLowerCase().includes(key) || String(d.kind).includes(key));
      return { name, status: (doc?.status ?? 'missing') as string };
    });

    return json({
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
      documents,
      bank: { name: (studentQ.data as any).bank_name, last4: (studentQ.data as any).account_last4, seeded: (studentQ.data as any).aadhaar_seeded && (studentQ.data as any).npci_mapped },
      application: appQ.data ? { id: (appQ.data as any).id, status: (appQ.data as any).status, currentStage: (appQ.data as any).current_stage } : null,
    });
  } catch {
    return fail('Could not load this scheme', 500);
  }
}
