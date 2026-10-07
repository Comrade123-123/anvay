/// <reference types="node" />
import { createHmac, randomInt } from 'node:crypto';
import { db } from './supabase';
import { readEnv } from './env';
import { sameSecret } from './auth';

// Rules for real OTPs: valid for 5 minutes, 5 wrong tries per code, one new code per 30 seconds, 5 codes per hour per number.
export const OTP_TTL_MS = 5 * 60_000;
export const RESEND_MS = 30_000;
export const MAX_ATTEMPTS = 5;
export const MAX_SENDS_PER_HOUR = 5;
const HOUR_MS = 60 * 60_000;

export const newOtp = () => String(randomInt(100000, 1000000));

// Only a keyed hash is stored, so a leaked table does not reveal any code.
export const hashOtp = (phone: string, code: string) => createHmac('sha256', readEnv().jwtSecret).update(`${phone}:${code}`).digest('hex');

export type SendCheck = { ok: true; windowStart: Date; windowCount: number } | { ok: false; message: string; retryAfter: number };

// Decides whether this number may be sent another code right now.
export async function checkCanSend(phone: string): Promise<SendCheck> {
  const { data, error } = await db().from('otp_codes').select('*').eq('phone', phone).maybeSingle();
  if (error) throw error;
  const now = Date.now();
  if (!data) return { ok: true, windowStart: new Date(now), windowCount: 1 };

  const sinceLast = now - new Date(data.last_sent_at).getTime();
  if (sinceLast < RESEND_MS) {
    const wait = Math.ceil((RESEND_MS - sinceLast) / 1000);
    return { ok: false, message: `Please wait ${wait} seconds before asking for another OTP.`, retryAfter: wait };
  }
  const windowAge = now - new Date(data.window_start).getTime();
  if (windowAge >= HOUR_MS) return { ok: true, windowStart: new Date(now), windowCount: 1 };
  if (data.window_count >= MAX_SENDS_PER_HOUR) {
    const wait = Math.ceil((HOUR_MS - windowAge) / 1000);
    return { ok: false, message: 'Too many OTP requests for this number. Please try again later.', retryAfter: wait };
  }
  return { ok: true, windowStart: new Date(data.window_start), windowCount: data.window_count + 1 };
}

export async function saveOtp(phone: string, code: string, windowStart: Date, windowCount: number) {
  const now = new Date();
  const { error } = await db().from('otp_codes').upsert({
    phone,
    code_hash: hashOtp(phone, code),
    expires_at: new Date(now.getTime() + OTP_TTL_MS).toISOString(),
    attempts: 0,
    last_sent_at: now.toISOString(),
    window_start: windowStart.toISOString(),
    window_count: windowCount,
  });
  if (error) throw error;
}

export type VerifyOutcome = { ok: true } | { ok: false; status: number; message: string };

// Checks a code the student typed. A correct code is used up; a wrong one counts against the 5 tries.
export async function checkOtp(phone: string, code: string): Promise<VerifyOutcome> {
  const { data, error } = await db().from('otp_codes').select('*').eq('phone', phone).maybeSingle();
  if (error) throw error;
  if (!data) return { ok: false, status: 401, message: 'No OTP was requested for this number. Tap Send OTP first.' };
  if (new Date(data.expires_at).getTime() < Date.now()) return { ok: false, status: 401, message: 'This OTP has expired. Please request a new one.' };
  if (data.attempts >= MAX_ATTEMPTS) return { ok: false, status: 429, message: 'Too many wrong attempts. Please request a new OTP.' };

  if (sameSecret(hashOtp(phone, code), data.code_hash)) {
    await db().from('otp_codes').delete().eq('phone', phone);
    return { ok: true };
  }
  const attempts = data.attempts + 1;
  await db().from('otp_codes').update({ attempts }).eq('phone', phone);
  const left = MAX_ATTEMPTS - attempts;
  return { ok: false, status: 401, message: left > 0 ? `Incorrect OTP. ${left} ${left === 1 ? 'try' : 'tries'} left.` : 'Too many wrong attempts. Please request a new OTP.' };
}
