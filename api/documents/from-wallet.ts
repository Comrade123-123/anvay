import { db } from '../_lib/supabase';
import { fail, json } from '../_lib/http';
import { studentIdFrom } from '../_lib/auth';
import { isDocKind } from '../_lib/docs';

// POST /api/documents/from-wallet  { kind }
// Simulates pulling the document straight from DigiLocker: it is marked verified without the student uploading anything.
export async function POST(request: Request) {
  const id = studentIdFrom(request);
  if (!id) return fail('Please sign in', 401);
  const body = await request.json().catch(() => null);
  if (!isDocKind(body?.kind)) return fail('Unknown document type', 422);

  try {
    const existing = await db().from('documents').select('id').eq('student_id', id).eq('kind', body.kind).maybeSingle();
    if (existing.error) throw existing.error;
    const row = { status: 'verified', problems: [], verified_at: new Date().toISOString(), issuer: 'DigiLocker' };
    if (existing.data) {
      const u = await db().from('documents').update(row).eq('id', existing.data.id);
      if (u.error) throw u.error;
    } else {
      const i = await db().from('documents').insert({ student_id: id, kind: body.kind, title: String(body.kind), ...row });
      if (i.error) throw i.error;
    }
    return json({ kind: body.kind, status: 'verified', problems: [], source: 'DigiLocker' });
  } catch {
    return fail('Could not fetch the document from DigiLocker', 500);
  }
}
