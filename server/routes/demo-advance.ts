import { db } from '../_lib/supabase';
import { fail, json } from '../_lib/http';
import { DEMO_STUDENT_ID, studentIdFrom } from '../_lib/auth';
import { ddmmyyyy } from '../_lib/format';
import { isActive } from '../_lib/applications';
import { STAGE_DONE_NOTE, statusAtStage } from '../_lib/stages';

// POST /api/demo/advance: stands in for the officers. Completes the stage currently in progress for the demo
// student's active application and moves the next one forward, so the Journey, DBT and Notifications screens can be
// shown changing live. When the last stage completes the scholarship is credited. If called again after that, any
// payment still "processing" settles to credited.
export async function POST(request: Request) {
  const id = studentIdFrom(request);
  if (!id) return fail('Please sign in', 401);
  if (id !== DEMO_STUDENT_ID) return fail('Only the demo account can use this', 403);

  try {
    const appsQ = await db()
      .from('applications')
      .select('id, application_no, status, expected_amount, form, schemes(title)')
      .eq('student_id', id)
      .neq('status', 'draft')
      .order('updated_at', { ascending: false })
      .limit(6);
    if (appsQ.error) throw appsQ.error;
    const app: any = (appsQ.data ?? []).find((a: any) => isActive(a));
    if (!app) return fail('There is no active application to move forward', 409);

    const stagesQ = await db().from('application_stages').select('*').eq('application_id', app.id).order('stage_no', { ascending: true });
    if (stagesQ.error) throw stagesQ.error;
    const stages = (stagesQ.data ?? []) as any[];
    const current = stages.find((s) => s.state === 'current');
    const now = new Date();

    // Everything already finished: settle payments that are still processing.
    if (!current) {
      const settled = await db()
        .from('payments')
        .update({ status: 'credited', paid_on: now.toISOString().slice(0, 10), reference: `PFMS-JH-2026-${now.getTime() % 100000}` })
        .eq('student_id', id)
        .eq('status', 'processing')
        .select('id');
      if (settled.error) throw settled.error;
      const n = settled.data?.length ?? 0;
      if (n) {
        await db().from('notifications').insert({
          student_id: id, category: 'payments', tone: 'green', icon: 'cash-multiple',
          title: `${n} payment${n === 1 ? '' : 's'} credited`, body: 'Pending settlements reached your bank account.', link_label: 'View payment', link_to: 'dbt',
        });
      }
      return json({ completedStage: null, settledPayments: n, finished: true });
    }

    const done = current.stage_no as number;
    const when = ddmmyyyy(now);
    const detail = /\d{2}\/\d{2}\/\d{4}/.test(current.detail ?? '') ? current.detail : `${current.detail ?? ''} · ${when}`;
    const mark = await db().from('application_stages').update({ state: 'done', occurred_at: now.toISOString(), detail, eta: null, desk: null }).eq('id', current.id);
    if (mark.error) throw mark.error;

    const next = stages.find((s) => s.stage_no === done + 1);
    if (next) {
      const up = await db().from('application_stages').update({ state: 'current', eta: 'ETA ~3 Days' }).eq('id', next.id);
      if (up.error) throw up.error;
    }
    const finished = !next;
    const appUpdate = await db()
      .from('applications')
      .update({ current_stage: finished ? 6 : done + 1, status: statusAtStage(done + 1, finished), updated_at: now.toISOString() })
      .eq('id', app.id);
    if (appUpdate.error) throw appUpdate.error;

    const note = STAGE_DONE_NOTE[done];
    await db().from('notifications').insert({
      student_id: id,
      category: done === 6 ? 'payments' : 'applications',
      tone: done === 6 ? 'green' : 'blue',
      icon: note.icon,
      title: note.title,
      body: done === 6 ? `₹${Number(app.expected_amount ?? 0).toLocaleString('en-IN')} credited for ${app.schemes?.title}` : `${app.schemes?.title} · ${app.application_no}`,
      link_label: done === 6 ? 'View payment' : 'Track status',
      link_to: done === 6 ? 'dbt' : 'journey',
    });

    // Final stage: the money arrives.
    if (finished && app.expected_amount) {
      await db().from('payments').insert({
        student_id: id,
        application_id: app.id,
        label: `${app.schemes?.title} (AY 2026-27)`,
        source: 'MOTA CENTRAL SECTOR',
        amount: app.expected_amount,
        status: 'credited',
        fy: '2026-27',
        paid_on: now.toISOString().slice(0, 10),
        reference: `PFMS-JH-2026-${now.getTime() % 100000}`,
      });
    }

    return json({ completedStage: done, nextStage: next ? done + 1 : null, finished });
  } catch {
    return fail('Could not move the application forward', 500);
  }
}
