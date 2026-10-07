import { db } from './supabase';
import { kindOfName } from './docs';

export const ACTIVE_STATUSES = ['submitted', 'in_review', 'sanctioned', 'credited'];

// An application the student replaced by switching to another scheme stays in the table but no longer counts as active.
export const isActive = (app: { status: string; form?: any }) => ACTIVE_STATUSES.includes(app.status) && !app.form?.switchedTo;

// MOTA/TC/2026/JH/007831: scheme prefix, year, state code, running number.
export async function nextApplicationNo(schemeCode: string): Promise<string> {
  const { count } = await db().from('applications').select('id', { count: 'exact', head: true });
  const prefix = schemeCode.split('-')[0];
  const n = 7000 + (count ?? 0) + 1;
  return `MOTA/${prefix}/${new Date().getFullYear()}/JH/${String(n).padStart(6, '0')}`;
}

// Loads an application only if it belongs to this student.
export async function ownedApplication(applicationId: string, studentId: string) {
  const { data, error } = await db()
    .from('applications')
    .select('*, schemes(code, title, title_hi, amount_text, amount_value, deadline, documents)')
    .eq('id', applicationId)
    .eq('student_id', studentId)
    .maybeSingle();
  if (error) throw error;
  return data as any | null;
}

// For each document the scheme asks for, how the student's wallet currently stands.
export async function documentChecklist(studentId: string, requiredNames: string[]) {
  const { data, error } = await db().from('documents').select('kind, title, status, problems, issuer').eq('student_id', studentId);
  if (error) throw error;
  return requiredNames.map((name) => {
    const kind = kindOfName(name);
    const doc = kind ? (data ?? []).find((d: any) => d.kind === kind) : undefined;
    return {
      name,
      kind,
      status: (doc?.status ?? 'missing') as 'verified' | 'pending' | 'rejected' | 'missing',
      problems: (doc?.problems ?? []) as string[],
      source: (doc?.issuer ?? null) as string | null,
    };
  });
}

export const idFromPath = (request: Request, fromEnd = 1) => {
  const parts = new URL(request.url).pathname.split('/').filter(Boolean);
  return decodeURIComponent(parts[parts.length - fromEnd] ?? '');
};
