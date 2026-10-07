import { db } from '../_lib/supabase';
import { fail, json } from '../_lib/http';
import { studentIdFrom } from '../_lib/auth';
import { toStudent } from '../_lib/mappers';
import { ddmmyyyy } from '../_lib/format';
import { documentChecklist, idFromPath, ownedApplication } from '../_lib/applications';

// GET /api/applications/:id: the draft with the scheme, the student's prefilled details and the document checklist.
export async function GET(request: Request) {
  const studentId = studentIdFrom(request);
  if (!studentId) return fail('Please sign in', 401);
  try {
    const app = await ownedApplication(idFromPath(request), studentId);
    if (!app) return fail('Application not found', 404);
    const studentQ = await db().from('students').select('*').eq('id', studentId).single();
    if (studentQ.error) throw studentQ.error;

    const required: string[] = app.schemes?.documents ?? [];
    const documents = await documentChecklist(studentId, required);
    return json({
      id: app.id,
      applicationNo: app.application_no,
      status: app.status,
      residency: app.residency as 'hostel' | 'day' | null,
      switchFrom: Boolean(app.form?.switchFrom),
      scheme: {
        code: app.schemes?.code,
        title: app.schemes?.title,
        titleHi: app.schemes?.title_hi,
        amountText: app.schemes?.amount_text,
        amountValue: app.schemes?.amount_value,
        deadline: ddmmyyyy(app.schemes?.deadline ? `${app.schemes.deadline}T00:00:00+05:30` : null),
      },
      student: toStudent(studentQ.data),
      documents,
      ready: Boolean(app.residency) && documents.every((d) => d.status === 'verified'),
    });
  } catch {
    return fail('Could not load your application', 500);
  }
}

// PATCH /api/applications/:id  { residency }  saves the draft.
export async function PATCH(request: Request) {
  const studentId = studentIdFrom(request);
  if (!studentId) return fail('Please sign in', 401);
  const body = await request.json().catch(() => null);
  if (body?.residency !== 'hostel' && body?.residency !== 'day') return fail('Choose hostel or day scholar', 422);
  try {
    const app = await ownedApplication(idFromPath(request), studentId);
    if (!app) return fail('Application not found', 404);
    if (app.status !== 'draft') return fail('This application has already been submitted', 409);
    const { error } = await db().from('applications').update({ residency: body.residency, updated_at: new Date().toISOString() }).eq('id', app.id);
    if (error) throw error;
    return json({ residency: body.residency });
  } catch {
    return fail('Could not save your draft', 500);
  }
}
