import { db } from '../_lib/supabase';
import { fail, json } from '../_lib/http';
import { studentIdFrom } from '../_lib/auth';
import { seedingService } from '../_lib/adapters/simulated';

// POST /api/dbt/fix-seeding: completes the (simulated) NPCI Aadhaar mapping and re-initiates every failed payment.
export async function POST(request: Request) {
  const id = studentIdFrom(request);
  if (!id) return fail('Please sign in', 401);

  try {
    const status = await seedingService.fix(id);
    const stu = await db().from('students').update({ aadhaar_seeded: status.seeded, npci_mapped: status.npciMapped }).eq('id', id);
    if (stu.error) throw stu.error;

    const retried = await db()
      .from('payments')
      .update({ status: 'processing', failure_reason: null, failure_ref: null, paid_on: new Date().toISOString().slice(0, 10) })
      .eq('student_id', id)
      .eq('status', 'failed')
      .select('id');
    if (retried.error) throw retried.error;

    const n = retried.data?.length ?? 0;
    if (n) {
      await db().from('notifications').insert({
        student_id: id, category: 'payments', tone: 'green', icon: 'bank-check',
        title: 'Aadhaar seeding verified',
        body: `${n} failed payment${n === 1 ? ' was' : 's were'} sent again and will settle shortly.`,
        link_label: 'View payment', link_to: 'dbt',
      });
    }
    return json({ seeded: status.seeded, retried: n, bank: { name: status.bank, last4: status.last4 } });
  } catch {
    return fail('Could not complete the seeding check', 500);
  }
}
