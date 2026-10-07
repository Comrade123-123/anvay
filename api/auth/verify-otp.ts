import { db } from '../_lib/supabase';
import { fail, json } from '../_lib/http';
import { readEnv } from '../_lib/env';
import { DEMO_STUDENT_ID, sameSecret, signToken } from '../_lib/auth';
import { toStudent } from '../_lib/mappers';

// POST /api/auth/verify-otp  { kind, value, code }
// Prototype behaviour: the OTP is fixed (DEMO_OTP). Any mobile / Aadhaar number signs in as the demo student so the
// whole app can be shown; a number that already belongs to a student signs in as that student.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const kind = body?.kind === 'aadhaar' ? 'aadhaar' : 'mobile';
  const value = String(body?.value ?? '').replace(/\D/g, '');
  const code = String(body?.code ?? '');

  if (!value) return fail('Enter your mobile or Aadhaar number first', 422);
  if (!sameSecret(code, readEnv().demoOtp)) return fail('Incorrect OTP. Please try again.', 401);

  try {
    let student: any = null;
    if (kind === 'mobile') {
      const found = await db().from('students').select('*').eq('phone', value).maybeSingle();
      student = found.data;
    }
    if (!student) {
      const demo = await db().from('students').select('*').eq('id', DEMO_STUDENT_ID).single();
      if (demo.error) throw demo.error;
      student = demo.data;
    }
    return json({ token: signToken(student.id), student: toStudent(student) });
  } catch {
    return fail('Could not sign you in right now. Please try again.', 500);
  }
}
