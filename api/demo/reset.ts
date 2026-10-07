import { db } from '../_lib/supabase';
import { fail, json } from '../_lib/http';
import { DEMO_STUDENT_ID, studentIdFrom } from '../_lib/auth';

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

    return json({ reset: true });
  } catch {
    return fail('Could not reset the demo data', 500);
  }
}
