import { db } from '../_lib/supabase';
import { fail, json } from '../_lib/http';
import { studentIdFrom } from '../_lib/auth';
import { ddmmyyyy } from '../_lib/format';

// GET /api/dbt?fy=2025-26: the payment ledger for one financial year plus the bank / seeding summary.
export async function GET(request: Request) {
  const id = studentIdFrom(request);
  if (!id) return fail('Please sign in', 401);
  const wanted = new URL(request.url).searchParams.get('fy');

  try {
    const [studentQ, payQ] = await Promise.all([
      db().from('students').select('name, apaar_id, bank_name, account_last4, ifsc, aadhaar_seeded, npci_mapped').eq('id', id).maybeSingle(),
      db().from('payments').select('*').eq('student_id', id).order('paid_on', { ascending: false, nullsFirst: true }),
    ]);
    if (studentQ.error || payQ.error) throw studentQ.error ?? payQ.error;
    const student: any = studentQ.data;
    if (!student) return fail('Please sign in', 401);

    const all = (payQ.data ?? []) as any[];
    const fys = [...new Set(all.map((p) => p.fy as string))].sort().reverse();
    const fy = wanted && fys.includes(wanted) ? wanted : (fys[0] ?? '2025-26');

    const payments = all
      .filter((p) => p.fy === fy)
      .map((p) => ({
        id: p.id as string,
        label: p.label as string,
        source: (p.source ?? '') as string,
        amount: p.amount as number,
        status: p.status as 'credited' | 'processing' | 'failed',
        date: p.status === 'processing' ? `${ddmmyyyy(p.paid_on ? `${p.paid_on}T00:00:00+05:30` : null)} · Pending Settlement` : ddmmyyyy(p.paid_on ? `${p.paid_on}T00:00:00+05:30` : null),
        reference: (p.reference ?? null) as string | null,
        failureReason: (p.failure_reason ?? null) as string | null,
        failureRef: (p.failure_ref ?? null) as string | null,
      }));

    const failed = all.filter((p) => p.status === 'failed');
    const seeded = Boolean(student.aadhaar_seeded && student.npci_mapped);
    const apaar: string = student.apaar_id ?? '';

    return json({
      fy,
      fys,
      totalDisbursed: all.filter((p) => p.status === 'credited').reduce((sum, p) => sum + p.amount, 0),
      scholarId: apaar || null,
      pfmsId: apaar ? `PFMS-JH-2026-${apaar.slice(-4)}` : null,
      bank: { name: student.bank_name as string | null, last4: student.account_last4 as string | null, ifsc: student.ifsc as string | null, seeded },
      alert: failed.length
        ? { count: failed.length, text: failed[0].failure_reason ?? 'A payment could not be completed. Please re-check your bank seeding.' }
        : null,
      payments,
    });
  } catch {
    return fail('Could not load your payments', 500);
  }
}
