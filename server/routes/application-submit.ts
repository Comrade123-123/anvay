import { db } from '../_lib/supabase';
import { fail, json } from '../_lib/http';
import { studentIdFrom } from '../_lib/auth';
import { ddmmyyyy } from '../_lib/format';
import { documentChecklist, idFromPath, ownedApplication } from '../_lib/applications';

const STAGES: { no: number; title: string; titleHi: string; detail: string; desk?: string; eta?: string }[] = [
  { no: 1, title: 'Application Submitted', titleHi: 'आवेदन प्रस्तुत', detail: 'Online Portal / DigiLocker e-Sign' },
  { no: 2, title: 'Auto-Verified', titleHi: 'स्वतः सत्यापित', detail: 'State Scholarship Portal · automatic checks running', eta: 'ETA ~1 Day' },
  { no: 3, title: 'Institute Confirmed', titleHi: 'संस्थान द्वारा पुष्टि', detail: 'Institute Nodal Officer' },
  { no: 4, title: 'District Review', titleHi: 'जिला समीक्षा', detail: 'District Welfare Officer' },
  { no: 5, title: 'State Sanction', titleHi: 'राज्य स्वीकृति', detail: 'State Tribal Welfare Commissioner' },
  { no: 6, title: 'PFMS DBT Bank Credit', titleHi: 'प्रत्यक्ष लाभ अंतरण', detail: 'PFMS Treasury Nodal Officer' },
];

// POST /api/applications/:id/submit: final step. Needs a residency choice and every required document verified.
export async function POST(request: Request) {
  const studentId = studentIdFrom(request);
  if (!studentId) return fail('Please sign in', 401);

  try {
    const app = await ownedApplication(idFromPath(request, 2), studentId);
    if (!app) return fail('Application not found', 404);
    if (app.status !== 'draft') return fail('This application has already been submitted', 409);
    if (!app.residency) return fail('Choose hostel or day scholar first', 422);

    const checklist = await documentChecklist(studentId, app.schemes?.documents ?? []);
    const missing = checklist.filter((d) => d.status !== 'verified').map((d) => d.name);
    if (missing.length) return fail(`These documents still need attention: ${missing.join(', ')}`, 422, { code: 'DOCUMENTS_PENDING', missing });

    const now = new Date();
    const upd = await db()
      .from('applications')
      .update({ status: 'submitted', current_stage: 2, submitted_at: now.toISOString(), updated_at: now.toISOString() })
      .eq('id', app.id)
      .eq('status', 'draft');
    if (upd.error) throw upd.error;

    const when = ddmmyyyy(now);
    const stages = STAGES.map((s) => ({
      application_id: app.id,
      stage_no: s.no,
      title: s.title,
      title_hi: s.titleHi,
      state: s.no === 1 ? 'done' : s.no === 2 ? 'current' : 'upcoming',
      occurred_at: s.no === 1 ? now.toISOString() : null,
      detail: s.no === 1 ? `${s.detail} · ${when}` : s.detail,
      eta: s.eta ?? null,
    }));
    const st = await db().from('application_stages').upsert(stages, { onConflict: 'application_id,stage_no' });
    if (st.error) throw st.error;

    // Switching schemes: the previous scholarship stops counting as active for this student.
    let switched = false;
    if (app.form?.switchFrom) {
      const old = await db().from('applications').select('id, form, schemes(title)').eq('id', app.form.switchFrom).eq('student_id', studentId).maybeSingle();
      if (old.data) {
        const oldRow: any = old.data;
        await db().from('applications').update({ form: { ...(oldRow.form ?? {}), switchedTo: app.id } }).eq('id', oldRow.id);
        await db().from('notifications').insert({
          student_id: studentId,
          category: 'applications',
          tone: 'amber',
          icon: 'swap-horizontal',
          title: 'Scholarship switched',
          body: `${oldRow.schemes?.title ?? 'Your earlier scholarship'} will end from the next instalment.`,
        });
        switched = true;
      }
    }

    const due = new Date(now.getTime() + 7 * 86_400_000);
    await db().from('notifications').insert({
      student_id: studentId,
      category: 'applications',
      tone: 'green',
      icon: 'check-decagram-outline',
      title: 'Application submitted',
      body: `${app.schemes?.title} · ${app.application_no}`,
      link_label: 'Track status',
      link_to: 'journey',
    });
    await db().from('deadlines').insert({
      student_id: studentId,
      kind: 'deadline',
      title: 'Institute nodal officer verification',
      subtitle: `${app.schemes?.title} · alert set`,
      due_on: due.toISOString().slice(0, 10),
      link_to: 'journey',
    });

    const time = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }).format(now).toUpperCase();
    return json({
      id: app.id,
      applicationNo: app.application_no,
      submittedAt: `${when}, ${time}`,
      reminderOn: ddmmyyyy(due),
      switched,
      scheme: { code: app.schemes?.code, title: app.schemes?.title, titleHi: app.schemes?.title_hi },
    });
  } catch {
    return fail('Could not submit your application. Please try again.', 500);
  }
}
