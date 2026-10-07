import { db } from '../_lib/supabase';
import { fail, json } from '../_lib/http';
import { studentIdFrom } from '../_lib/auth';

// POST /api/payments/:id/retry: re-initiates one failed payment.
export async function POST(request: Request) {
  const studentId = studentIdFrom(request);
  if (!studentId) return fail('Please sign in', 401);
  const parts = new URL(request.url).pathname.split('/').filter(Boolean);
  const paymentId = decodeURIComponent(parts[parts.length - 2] ?? '');

  try {
    const found = await db().from('payments').select('id, status, label').eq('id', paymentId).eq('student_id', studentId).maybeSingle();
    if (found.error) throw found.error;
    if (!found.data) return fail('Payment not found', 404);
    if ((found.data as any).status !== 'failed') return fail('Only a failed payment can be re-initiated', 409);

    const stu = await db().from('students').select('aadhaar_seeded, npci_mapped').eq('id', studentId).single();
    if (stu.error) throw stu.error;
    if (!(stu.data as any).aadhaar_seeded || !(stu.data as any).npci_mapped) {
      return fail('Complete your Aadhaar seeding first', 409, { code: 'SEEDING_REQUIRED' });
    }
    const upd = await db()
      .from('payments')
      .update({ status: 'processing', failure_reason: null, failure_ref: null, paid_on: new Date().toISOString().slice(0, 10) })
      .eq('id', paymentId);
    if (upd.error) throw upd.error;
    return json({ id: paymentId, status: 'processing' });
  } catch {
    return fail('Could not re-initiate the payment', 500);
  }
}
