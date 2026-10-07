import { db } from '../_lib/supabase';
import { fail, json } from '../_lib/http';
import { studentIdFrom } from '../_lib/auth';
import { evaluate, statusFor } from '../_lib/eligibility';
import { isActive, nextApplicationNo } from '../_lib/applications';

// POST /api/applications  { schemeCode, confirmSwitch? }
// Starts (or resumes) a draft application. If the student already holds another active scholarship the call is
// refused with code SWITCH_REQUIRED until they confirm the Single-Scholarship switch.
export async function POST(request: Request) {
  const studentId = studentIdFrom(request);
  if (!studentId) return fail('Please sign in', 401);
  const body = await request.json().catch(() => null);
  const schemeCode = String(body?.schemeCode ?? '');
  const confirmSwitch = body?.confirmSwitch === true;
  if (!schemeCode) return fail('Choose a scheme first', 422);

  try {
    const [schemeQ, studentQ, appsQ] = await Promise.all([
      db().from('schemes').select('*').eq('code', schemeCode).maybeSingle(),
      db().from('students').select('category, income_annual, course, institute').eq('id', studentId).maybeSingle(),
      db().from('applications').select('id, application_no, scheme_code, status, form, schemes(title)').eq('student_id', studentId),
    ]);
    if (schemeQ.error || studentQ.error || appsQ.error) throw schemeQ.error ?? studentQ.error ?? appsQ.error;
    if (!schemeQ.data) return fail('Scheme not found', 404);
    if (!studentQ.data) return fail('Please sign in', 401);

    const apps = (appsQ.data ?? []) as any[];
    const mine = apps.find((a) => a.scheme_code === schemeCode);
    if (mine && mine.status !== 'draft') return fail('You have already applied for this scheme', 409, { code: 'ALREADY_APPLIED' });
    if (mine) return json({ id: mine.id, applicationNo: mine.application_no, resumed: true });

    const { status, reason } = statusFor(evaluate(studentQ.data, schemeQ.data as any), false);
    if (status !== 'eligible') return fail(reason ?? 'You are not eligible for this scheme', 403, { code: 'NOT_ELIGIBLE' });

    const current = apps.find((a) => a.scheme_code !== schemeCode && isActive(a));
    if (current && !confirmSwitch) {
      return fail('You already receive another scholarship. Confirm to switch.', 409, { code: 'SWITCH_REQUIRED', currentTitle: current.schemes?.title ?? current.scheme_code });
    }

    const created = await db()
      .from('applications')
      .insert({
        application_no: await nextApplicationNo(schemeCode),
        student_id: studentId,
        scheme_code: schemeCode,
        status: 'draft',
        current_stage: 0,
        expected_amount: (schemeQ.data as any).amount_value,
        form: current ? { switchFrom: current.id } : {},
      })
      .select('id, application_no')
      .single();
    if (created.error) throw created.error;
    return json({ id: created.data.id, applicationNo: created.data.application_no, resumed: false }, 201);
  } catch {
    return fail('Could not start your application. Please try again.', 500);
  }
}
