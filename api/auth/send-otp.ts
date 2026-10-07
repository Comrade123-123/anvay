import { fail, json } from '../_lib/http';
import { readEnv } from '../_lib/env';

// POST /api/auth/send-otp  { kind: 'mobile' | 'aadhaar', value: '9876543210' }
// Prototype behaviour: no SMS is sent. The response tells the app which demo OTP to use.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const kind = body?.kind === 'aadhaar' ? 'aadhaar' : 'mobile';
  const value = String(body?.value ?? '').replace(/\D/g, '');
  const valid = kind === 'mobile' ? /^[6-9]\d{9}$/.test(value) : /^\d{12}$/.test(value);
  if (!valid) return fail(kind === 'mobile' ? 'Enter a valid 10-digit mobile number' : 'Enter a valid 12-digit Aadhaar number', 422);
  return json({ sent: true, demo: true, hint: `Demo mode: use OTP ${readEnv().demoOtp}` });
}
