import { fail, json } from '../_lib/http';
import { readEnv } from '../_lib/env';
import { smsEnabled, smsSender, SmsError } from '../_lib/adapters/sms';
import { RESEND_MS, checkCanSend, newOtp, saveOtp } from '../_lib/otp';

// POST /api/auth/send-otp  { kind: 'mobile' | 'aadhaar', value: '9876543210' }
// With an SMS provider configured a random 6-digit OTP is texted to the mobile number. Without one the app is in demo
// mode: nothing is sent and the response tells the app which fixed demo OTP to use.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const kind = body?.kind === 'aadhaar' ? 'aadhaar' : 'mobile';
  const value = String(body?.value ?? '').replace(/\D/g, '');
  const valid = kind === 'mobile' ? /^[6-9]\d{9}$/.test(value) : /^\d{12}$/.test(value);
  if (!valid) return fail(kind === 'mobile' ? 'Enter a valid 10-digit mobile number' : 'Enter a valid 12-digit Aadhaar number', 422);

  if (!smsEnabled()) return json({ sent: true, demo: true, hint: `Demo mode: use OTP ${readEnv().demoOtp}` });

  // An OTP to the mobile linked with an Aadhaar number needs UIDAI's own service, which this app is not connected to.
  if (kind === 'aadhaar') return fail('Aadhaar sign-in is not available yet. Please use your mobile number.', 422);

  try {
    const gate = await checkCanSend(value);
    if (!gate.ok) return fail(gate.message, 429, { retryAfter: gate.retryAfter });

    const code = newOtp();
    await smsSender.sendOtp({ phone: value, otp: code });
    await saveOtp(value, code, gate.windowStart, gate.windowCount);
    return json({ sent: true, demo: false, resendAfter: RESEND_MS / 1000 });
  } catch (e) {
    if (e instanceof SmsError) return fail('We could not send the SMS right now. Please try again in a minute.', 502);
    return fail('Could not send the OTP. Please try again.', 500);
  }
}
