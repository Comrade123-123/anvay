import { db } from '../_lib/supabase';
import { fail, json } from '../_lib/http';
import { DEMO_STUDENT_ID, studentIdFrom } from '../_lib/auth';
import { addDays, todayIst } from '../_lib/today';

const SEEDED_APPLICATION_ID = '00000000-0000-4000-8000-0000000000a1';

// POST /api/demo/reset: puts the demo student back to the state the seed file creates, so the apply flow can be
// shown again. It only ever touches the demo student's records.
export async function POST(request: Request) {
  const id = studentIdFrom(request);
  if (!id) return fail('Please sign in', 401);
  if (id !== DEMO_STUDENT_ID) return fail('Only the demo account can be reset', 403);

  try {
    // applications created during demos (stages are removed with them)
    const apps = await db().from('applications').delete().eq('student_id', id).neq('id', SEEDED_APPLICATION_ID);
    if (apps.error) throw apps.error;

    // the seeded application is active again (no "switched away" marker)
    const seeded = await db().from('applications').update({ form: {}, updated_at: new Date().toISOString() }).eq('id', SEEDED_APPLICATION_ID);
    if (seeded.error) throw seeded.error;

    // admission letter is rejected again; every other wallet document is verified
    const ok = await db().from('documents').update({ status: 'verified', problems: [], issuer: 'DigiLocker' }).eq('student_id', id).neq('kind', 'admission');
    if (ok.error) throw ok.error;
    const adm = await db().from('documents').update({ status: 'rejected', problems: ['blurry'], file_path: null, verified_at: null }).eq('student_id', id).eq('kind', 'admission');
    if (adm.error) throw adm.error;

    // things the apply flow created
    await db().from('notifications').delete().eq('student_id', id).in('title', ['Application submitted', 'Scholarship switched']);
    await db().from('deadlines').delete().eq('student_id', id).eq('title', 'Institute nodal officer verification');

    // the seeded application goes back to "District Review in progress"
    const SEED_STAGES = [
      { no: 1, state: 'done', at: '2026-09-15T10:00:00+05:30', detail: 'Online Portal / DigiLocker e-Sign · 15/09/2026', desk: null, eta: null },
      { no: 2, state: 'done', at: '2026-09-16T09:30:00+05:30', detail: 'State Scholarship Portal · 16/09/2026', desk: null, eta: null },
      { no: 3, state: 'done', at: '2026-09-18T12:15:00+05:30', detail: 'Institute Nodal Officer · 18/09/2026', desk: null, eta: null },
      { no: 4, state: 'current', at: null, detail: 'District Welfare Officer, Ranchi · 22/09/2026', desk: 'Desk 04 (Shri V. Markam)', eta: 'ETA ~3 Days' },
      { no: 5, state: 'upcoming', at: null, detail: 'State Tribal Welfare Commissioner, Ranchi · Expected 05/10/2026', desk: null, eta: null },
      { no: 6, state: 'upcoming', at: null, detail: 'PFMS Treasury Nodal Officer · Expected 18/10/2026', desk: null, eta: null },
    ];
    for (const s of SEED_STAGES) {
      const r = await db()
        .from('application_stages')
        .update({ state: s.state, occurred_at: s.at, detail: s.detail, desk: s.desk, eta: s.eta })
        .eq('application_id', SEEDED_APPLICATION_ID)
        .eq('stage_no', s.no);
      if (r.error) throw r.error;
    }
    const back = await db().from('applications').update({ status: 'in_review', current_stage: 4 }).eq('id', SEEDED_APPLICATION_ID);
    if (back.error) throw back.error;

    // payments: remove ones the demo created, restore the seeded two
    await db().from('payments').delete().eq('student_id', id).like('label', '%(AY 2026-27)');
    await db().from('payments').update({ status: 'processing', reference: null, paid_on: '2026-01-12' }).eq('student_id', id).eq('label', 'Maintenance Allowance (Installment 2)');
    await db()
      .from('payments')
      .update({ status: 'failed', paid_on: '2025-12-02', failure_reason: 'Secondary bank account is not mapped with the NPCI DBT mapper', failure_ref: 'NPCI-ERR-4091' })
      .eq('student_id', id)
      .eq('label', 'Book Grant (Installment 1)');
    await db().from('students').update({ aadhaar_seeded: true, npci_mapped: true }).eq('id', id);

    // notifications: drop everything created after the seed and restore read / unread
    await db().from('notifications').delete().eq('student_id', id).gt('created_at', '2026-09-30T00:00:00+05:30');
    await db().from('notifications').update({ unread: true }).eq('student_id', id).in('title', ['₹9,250 credited', 'Institute verified your application', 'Top Class application closes in 32 days']);
    await db().from('notifications').update({ unread: false }).eq('student_id', id).in('title', ['Admission letter needs re-upload', 'JAGO replied to your question']);

    // grievances raised during demos go away; the seeded ones keep no rating
    await db().from('grievances').delete().eq('student_id', id).not('ticket_no', 'in', '(GRV/2026/00412,GRV/2026/00288)');
    await db().from('grievances').update({ rating: null }).eq('student_id', id);
    await db().from('notifications').delete().eq('student_id', id).eq('title', 'Grievance registered');

    // JAGO chat goes back to the greeting
    await db().from('chat_messages').delete().eq('student_id', id).gt('created_at', '2026-09-29T10:43:00+05:30');

    // the "fix this document" date is always a week from today, so the calendar never starts out overdue
    await db()
      .from('deadlines')
      .update({ title: 'Re-upload admission letter', subtitle: 'Post-Matric 2026-27 · Action needed', due_on: addDays(todayIst(), 7) })
      .eq('student_id', id)
      .eq('kind', 'action');

    return json({ reset: true });
  } catch {
    return fail('Could not reset the demo data', 500);
  }
}
