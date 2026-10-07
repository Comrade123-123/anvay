import { db } from '../_lib/supabase';
import { fail, json } from '../_lib/http';
import { studentIdFrom } from '../_lib/auth';
import { isDocKind } from '../_lib/docs';
import { ALLOWED_TYPES, DOCUMENT_BUCKET, MAX_FILE_BYTES, ensureBucket } from '../_lib/storage';
import { documentVerifier } from '../_lib/adapters/simulated';

const TITLES: Record<string, string> = {
  aadhaar: 'Aadhaar Card',
  st_caste: 'ST Caste Certificate',
  income: 'Annual Income Certificate',
  residence: 'Permanent Resident Certificate',
  marksheet: 'Class 10 & 12 Marksheets',
  bonafide: 'Bonafide Student Certificate',
  admission: 'Admission Letter',
};

// POST /api/documents/upload  { kind, fileName, contentType, dataBase64 }
// The file goes to private storage, then the (simulated) verifier checks it and the wallet row is updated.
export async function POST(request: Request) {
  const id = studentIdFrom(request);
  if (!id) return fail('Please sign in', 401);

  const body = await request.json().catch(() => null);
  const { kind, fileName, contentType, dataBase64 } = body ?? {};
  if (!isDocKind(kind)) return fail('Unknown document type', 422);
  if (typeof fileName !== 'string' || typeof dataBase64 !== 'string' || !dataBase64) return fail('No file received', 422);
  if (!ALLOWED_TYPES.includes(contentType)) return fail('Only JPG, PNG or PDF files are allowed', 415);

  const bytes = Buffer.from(dataBase64, 'base64');
  if (bytes.length === 0) return fail('The file is empty', 422);
  if (bytes.length > MAX_FILE_BYTES) return fail('File is larger than 2 MB', 413);

  try {
    const student = await db().from('students').select('name').eq('id', id).single();
    if (student.error) throw student.error;

    const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
    const path = `${id}/${kind}-${Date.now()}-${safe}`;
    await ensureBucket();
    const up = await db().storage.from(DOCUMENT_BUCKET).upload(path, bytes, { contentType, upsert: true });
    if (up.error) throw up.error;

    const check = await documentVerifier.verify({ kind, fileName, studentName: student.data.name });
    const row = {
      status: check.ok ? 'verified' : 'rejected',
      problems: check.problems,
      file_path: path,
      verified_at: check.ok ? new Date().toISOString() : null,
      issuer: 'Uploaded by student',
    };

    const existing = await db().from('documents').select('id').eq('student_id', id).eq('kind', kind).maybeSingle();
    if (existing.error) throw existing.error;
    const saved = existing.data
      ? await db().from('documents').update(row).eq('id', existing.data.id).select('id, kind, status, problems').single()
      : await db().from('documents').insert({ student_id: id, kind, title: TITLES[kind], ...row }).select('id, kind, status, problems').single();
    if (saved.error) throw saved.error;

    return json({ kind, status: saved.data.status, problems: saved.data.problems, source: check.source });
  } catch {
    return fail('Could not upload the document. Please try again.', 500);
  }
}
