import { db } from '../_lib/supabase';
import { fail, json } from '../_lib/http';
import { studentIdFrom } from '../_lib/auth';
import { ddmmyyyy } from '../_lib/format';

// GET /api/documents: the signed-in student's DigiLocker wallet.
export async function GET(request: Request) {
  const id = studentIdFrom(request);
  if (!id) return fail('Please sign in', 401);
  const { data, error } = await db().from('documents').select('*').eq('student_id', id).order('created_at', { ascending: true });
  if (error) return fail('Could not load your documents', 500);
  return json(
    (data ?? []).map((d: any) => ({
      id: d.id,
      kind: d.kind,
      title: d.title,
      titleHi: d.title_hi,
      issuer: d.issuer,
      status: d.status,
      problems: d.problems ?? [],
      hasFile: Boolean(d.file_path),
      verifiedOn: ddmmyyyy(d.verified_at),
      expiresOn: ddmmyyyy(d.expires_on ? `${d.expires_on}T00:00:00+05:30` : null),
    })),
  );
}
