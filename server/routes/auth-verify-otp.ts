import { db } from '../_lib/supabase';
import { fail, json } from '../_lib/http';
import { readEnv } from '../_lib/env';
import { DEMO_STUDENT_ID, sameSecret, signToken } from '../_lib/auth';
import { toStudent } from '../_lib/mappers';
import { smsEnabled } from '../_lib/adapters/sms';
import { checkOtp } from '../_lib/otp';

// POST /api/auth/verify-otp  { kind, value, code }
// With SMS on, the code must be the one texted to that mobile number (5 tries, 5 minutes). In demo mode the OTP is the
// fixed DEMO_OTP. Either way a number that belongs to a student signs in as that student, and any other number signs in
// as the demo student so the whole app can be shown.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const kind = body?.kind === 'aadhaar' ? 'aadhaar' : 'mobile';
  const value = String(body?.value ?? '').replace(/\D/g, '');
  const code = String(body?.code ?? '').trim();

  if (!value) return fail('Enter your mobile or Aadhaar number first', 422);

  try {
    if (smsEnabled()) {
      if (kind !== 'mobile') return fail('Aadhaar sign-in is not available yet. Please use your mobile number.', 422);
      if (!/^\d{6}$/.test(code)) return fail('Enter the 6-digit OTP', 422);
      const outcome = await checkOtp(value, code);
      if (!outcome.ok) return fail(outcome.message, outcome.status);
    } else if (!sameSecret(code, readEnv().demoOtp)) {
      return fail('Incorrect OTP. Please try again.', 401);
    }

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
