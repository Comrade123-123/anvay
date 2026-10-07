import { db } from '../_lib/supabase';
import { fail, json } from '../_lib/http';
import { studentIdFrom } from '../_lib/auth';
import { ddmmyyyy } from '../_lib/format';
import { addDays, daysBetween, todayIst } from '../_lib/today';
import { isActive } from '../_lib/applications';
import { ALLOWED_TYPES, DOCUMENT_BUCKET, MAX_FILE_BYTES, ensureBucket } from '../_lib/storage';

export const GRIEVANCE_CATEGORIES = ['Payment not received', 'Document verification', 'Name / details mismatch', 'Application status', 'Other'];
const SLA_DAYS = 14;

const shape = (g: any, today: string) => {
  const resolved = g.status === 'resolved';
  const left = g.due_on ? daysBetween(today, g.due_on) : null;
  const took = g.resolved_on ? Math.max(0, daysBetween(g.created_at.slice(0, 10), g.resolved_on)) : null;
  return {
    id: g.id as string,
    ticketNo: g.ticket_no as string,
    status: (resolved ? 'resolved' : 'progress') as 'resolved' | 'progress',
    category: g.category as string,
    title: g.title as string,
    sub: resolved
      ? `Resolved in ${took ?? 0} ${took === 1 ? 'day' : 'days'} · ${ddmmyyyy(`${g.resolved_on}T00:00:00+05:30`)}`
      : `Assigned to ${g.assigned_to ?? 'the District Welfare Officer'} · ${ddmmyyyy(g.created_at)}`,
    progress: (g.progress ?? 0) / 100,
    due:
      resolved || left == null
        ? null
        : `Resolve by ${ddmmyyyy(`${g.due_on}T00:00:00+05:30`)} · ${left < 0 ? `overdue by ${-left} ${-left === 1 ? 'day' : 'days'}` : left === 0 ? 'due today' : `${left} ${left === 1 ? 'day' : 'days'} left`}`,
    detail: `Status: with ${g.assigned_to ?? 'the District Welfare Officer'} for verification. You will get an SMS on every update.`,
    rating: (g.rating ?? null) as number | null,
  };
};

// GET /api/grievances: this student's tickets, plus the applications a new ticket can be about.
export async function GET(request: Request) {
  const id = studentIdFrom(request);
  if (!id) return fail('Please sign in', 401);
  try {
    const [gQ, aQ] = await Promise.all([
      db().from('grievances').select('*').eq('student_id', id).order('created_at', { ascending: false }),
      db().from('applications').select('id, application_no, status, form, schemes(title)').eq('student_id', id).neq('status', 'draft').order('updated_at', { ascending: false }),
    ]);
    if (gQ.error || aQ.error) throw gQ.error ?? aQ.error;
    const today = todayIst();
    return json({
      categories: GRIEVANCE_CATEGORIES,
      applications: ((aQ.data ?? []) as any[]).filter((a) => isActive(a)).map((a) => ({ id: a.id as string, label: `${(a.schemes?.title ?? 'Scholarship').replace(/ for ST.*$/i, '')} · ${a.application_no}` })),
      items: ((gQ.data ?? []) as any[]).map((g) => shape(g, today)),
    });
  } catch {
    return fail('Could not load your grievances', 500);
  }
}

async function nextTicketNo(): Promise<string> {
  const year = new Date().getFullYear();
  const { data, error } = await db().from('grievances').select('ticket_no').like('ticket_no', `GRV/${year}/%`).order('ticket_no', { ascending: false }).limit(1);
  if (error) throw error;
  const last = Number((data?.[0]?.ticket_no ?? '').split('/').pop() ?? 0) || 400;
  return `GRV/${year}/${String(last + 1).padStart(5, '0')}`;
}

// POST /api/grievances  { category, description, applicationId?, attachment?: { fileName, contentType, dataBase64 } }
export async function POST(request: Request) {
  const id = studentIdFrom(request);
  if (!id) return fail('Please sign in', 401);

  const body = await request.json().catch(() => null);
  const category = typeof body?.category === 'string' ? body.category : '';
  const description = typeof body?.description === 'string' ? body.description.trim() : '';
  if (!GRIEVANCE_CATEGORIES.includes(category)) return fail('Choose a category', 422);
  if (description.length < 5) return fail('Please describe your issue (at least a few words).', 422);
  if (description.length > 1000) return fail('Please keep the description under 1000 characters.', 422);

  const att = body?.attachment;
  let bytes: Buffer | null = null;
  if (att) {
    if (typeof att.fileName !== 'string' || typeof att.dataBase64 !== 'string' || !ALLOWED_TYPES.includes(att.contentType)) return fail('Attach a JPG, PNG or PDF file', 415);
    bytes = Buffer.from(att.dataBase64, 'base64');
    if (bytes.length === 0) return fail('The attached file is empty', 422);
    if (bytes.length > MAX_FILE_BYTES) return fail('The attached file is larger than 2 MB', 413);
  }

  try {
    let applicationId: string | null = null;
    if (typeof body?.applicationId === 'string' && body.applicationId) {
      const own = await db().from('applications').select('id').eq('id', body.applicationId).eq('student_id', id).maybeSingle();
      if (own.error) throw own.error;
      if (!own.data) return fail('That application was not found', 404);
      applicationId = own.data.id;
    }

    const today = todayIst();
    const row = {
      student_id: id,
      application_id: applicationId,
      category,
      title: category,
      description,
      status: 'in_progress',
      assigned_to: 'District Welfare Officer, Ranchi',
      progress: 10,
      due_on: addDays(today, SLA_DAYS),
    };
    let saved: any = null;
    for (let attempt = 0; attempt < 3 && !saved; attempt++) {
      const ticket_no = await nextTicketNo();
      const ins = await db().from('grievances').insert({ ...row, ticket_no }).select('*').single();
      if (!ins.error) saved = ins.data;
      else if (ins.error.code !== '23505') throw ins.error;
    }
    if (!saved) throw new Error('no ticket number');

    if (bytes) {
      await ensureBucket();
      const safe = att.fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
      const up = await db().storage.from(DOCUMENT_BUCKET).upload(`${id}/grievances/${saved.ticket_no.replace(/\//g, '-')}-${safe}`, bytes, { contentType: att.contentType, upsert: true });
      if (up.error) throw up.error;
    }

    await db().from('notifications').insert({
      student_id: id, category: 'applications', tone: 'blue', icon: 'forum-outline',
      title: 'Grievance registered',
      body: `${saved.ticket_no} · ${category}. We will update you within ${SLA_DAYS} days.`,
      link_label: 'View grievance', link_to: 'help',
    });
    return json(shape(saved, today), 201);
  } catch {
    return fail('Could not submit your grievance. Please try again.', 500);
  }
}
