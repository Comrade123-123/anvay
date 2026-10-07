// Logic test for the OTP rules (expiry, 5 tries, 30 s resend gap, 5 per hour) against an in-memory table.
// Run: JWT_SECRET=test npx tsx --experimental-test-module-mocks --test scripts/otp.test.mts
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const rows = new Map<string, any>();
const fakeDb = () => ({
  from: () => {
    let phone = '';
    const api: any = {
      select: () => api,
      eq: (_c: string, v: string) => ((phone = v), api),
      maybeSingle: async () => ({ data: rows.get(phone) ?? null, error: null }),
      upsert: async (row: any) => (rows.set(row.phone, { ...row }), { error: null }),
      update: (patch: any) => ({ eq: async (_c: string, v: string) => (rows.set(v, { ...rows.get(v), ...patch }), { error: null }) }),
      delete: () => ({ eq: async (_c: string, v: string) => (rows.delete(v), { error: null }) }),
    };
    return api;
  },
});

mock.module(pathToFileURL(path.resolve('server/_lib/supabase.ts')).href, { namedExports: { db: fakeDb } });
process.env.JWT_SECRET = 'test-secret';

const otp = await import('../server/_lib/otp.ts');
const P = '9123456780';
const age = (ms: number) => {
  const r = rows.get(P);
  for (const k of ['last_sent_at', 'window_start']) r[k] = new Date(new Date(r[k]).getTime() - ms).toISOString();
};

test('a new code can be sent, stored hashed, and verified once', async () => {
  rows.clear();
  const gate = await otp.checkCanSend(P);
  assert.equal(gate.ok, true);
  await otp.saveOtp(P, '123456', (gate as any).windowStart, (gate as any).windowCount);
  assert.notEqual(rows.get(P).code_hash, '123456');
  assert.deepEqual(await otp.checkOtp(P, '123456'), { ok: true });
  const again = await otp.checkOtp(P, '123456');
  assert.equal(again.ok, false); // used up
});

test('wrong codes count down and lock after 5', async () => {
  rows.clear();
  await otp.saveOtp(P, '654321', new Date(), 1);
  for (let i = 1; i <= 4; i++) {
    const r: any = await otp.checkOtp(P, '000000');
    assert.equal(r.ok, false);
    assert.match(r.message, new RegExp(`${5 - i} (try|tries) left`));
  }
  const last: any = await otp.checkOtp(P, '000000');
  assert.equal(last.status, 401);
  const locked: any = await otp.checkOtp(P, '654321'); // even the right code is refused now
  assert.equal(locked.ok, false);
  assert.equal(locked.status, 429);
});

test('expired code is refused', async () => {
  rows.clear();
  await otp.saveOtp(P, '111111', new Date(), 1);
  rows.get(P).expires_at = new Date(Date.now() - 1000).toISOString();
  const r: any = await otp.checkOtp(P, '111111');
  assert.equal(r.ok, false);
  assert.match(r.message, /expired/);
});

test('a number with no OTP requested is refused', async () => {
  rows.clear();
  const r: any = await otp.checkOtp(P, '123456');
  assert.equal(r.ok, false);
});

test('resend gap of 30 seconds', async () => {
  rows.clear();
  await otp.saveOtp(P, '222222', new Date(), 1);
  const blocked: any = await otp.checkCanSend(P);
  assert.equal(blocked.ok, false);
  assert.ok(blocked.retryAfter > 0 && blocked.retryAfter <= 30);
  age(31_000);
  assert.equal((await otp.checkCanSend(P)).ok, true);
});

test('at most 5 codes per hour, then it opens again', async () => {
  rows.clear();
  let count = 0;
  let start = new Date();
  for (let i = 0; i < 5; i++) {
    const g: any = await otp.checkCanSend(P);
    assert.equal(g.ok, true, `send ${i + 1} should be allowed`);
    count = g.windowCount;
    start = g.windowStart;
    await otp.saveOtp(P, '333333', start, count);
    age(31_000);
  }
  assert.equal(count, 5);
  const sixth: any = await otp.checkCanSend(P);
  assert.equal(sixth.ok, false);
  assert.match(sixth.message, /Too many/);
  age(61 * 60_000); // an hour later
  assert.equal((await otp.checkCanSend(P)).ok, true);
});

test('codes are 6 digits and differ', () => {
  const seen = new Set<string>();
  for (let i = 0; i < 200; i++) {
    const c = otp.newOtp();
    assert.match(c, /^\d{6}$/);
    seen.add(c);
  }
  assert.ok(seen.size > 150);
});
