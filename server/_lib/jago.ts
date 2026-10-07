import { db } from './supabase';
import { ddmmyyyy } from './format';
import { evaluate, statusFor } from './eligibility';
import { documentChecklist, isActive } from './applications';
import { buildSteps, type StageRow } from './progress';
import { daysBetween, todayIst } from './today';

// JAGO answers from the student's own records with simple keyword rules (no AI model). Each answer is either plain
// text or a card (kind "status" / "docs"); cards are stored as JSON in the message body so history shows what was said.
export type Lang = 'en' | 'hi';
export type Reply = { kind: 'text'; text: string } | { kind: 'status' | 'docs'; card: Record<string, unknown> };

export const hasDevanagari = (s: string) => /[ऀ-ॿ]/.test(s);

const has = (m: string, words: RegExp) => words.test(m);

const T = {
  noApp: {
    en: 'You have no active application yet. Open Schemes to see what you can apply for.',
    hi: 'आपका कोई सक्रिय आवेदन अभी नहीं है। आवेदन के लिए "योजनाएं" खोलें।',
  },
  fallback: {
    en: 'I can help with your application status, eligibility, documents, deadlines, Aadhaar seeding and grievances. Tap a quick reply below or ask in your own words.',
    hi: 'मैं आपके आवेदन की स्थिति, पात्रता, दस्तावेज़, अंतिम तिथियाँ, आधार सीडिंग और शिकायतों में मदद कर सकता हूँ। नीचे दिए विकल्प चुनें या अपने शब्दों में पूछें।',
  },
  hello: {
    en: 'Hello! I am JAGO. Ask me about your status, eligibility, documents or deadlines.',
    hi: 'नमस्ते! मैं JAGO हूँ। मुझसे अपनी स्थिति, पात्रता, दस्तावेज़ या अंतिम तिथियों के बारे में पूछें।',
  },
};

const inr = (n: number | null | undefined) => (n == null ? '' : `₹${Number(n).toLocaleString('en-IN')}`);

async function activeApplication(studentId: string) {
  const { data, error } = await db()
    .from('applications')
    .select('id, application_no, scheme_code, status, current_stage, expected_amount, form, schemes(title, title_hi)')
    .eq('student_id', studentId)
    .neq('status', 'draft')
    .order('updated_at', { ascending: false })
    .limit(6);
  if (error) throw error;
  return ((data ?? []) as any[]).find((a) => isActive(a)) ?? null;
}

async function statusReply(studentId: string, lang: Lang): Promise<Reply> {
  const app = await activeApplication(studentId);
  if (!app) return { kind: 'text', text: T.noApp[lang] };
  const st = await db().from('application_stages').select('*').eq('application_id', app.id).order('stage_no', { ascending: true });
  if (st.error) throw st.error;
  const rows = (st.data ?? []) as any[];
  const finished = rows.length === 6 && rows.every((s) => s.state === 'done');
  const current = rows.find((s) => s.state === 'current');
  const remaining = rows.filter((s) => s.state !== 'done').length;
  const on = ddmmyyyy(new Date(Date.now() + Math.max(1, remaining * 4) * 86_400_000));
  const amount = inr(app.expected_amount);

  const info = finished
    ? lang === 'hi' ? `आपकी ${amount} की छात्रवृत्ति आपके बैंक खाते में जमा हो चुकी है।` : `Your scholarship of ${amount} has been credited to your bank account.`
    : lang === 'hi'
      ? `अभी चरण ${current?.stage_no ?? app.current_stage}/6: ${current?.title_hi ?? current?.title}। ${amount} का भुगतान लगभग ${on} तक अपेक्षित है।`
      : `Now at stage ${current?.stage_no ?? app.current_stage} of 6: ${current?.title}. Expected payment of ${amount} around ${on}.`;

  return {
    kind: 'status',
    card: {
      title: lang === 'hi' ? app.schemes?.title_hi ?? app.schemes?.title : app.schemes?.title,
      applicationNo: app.application_no,
      statusLabel: finished ? 'Credited' : app.status === 'sanctioned' ? 'Sanctioned' : 'In Review',
      steps: buildSteps(rows as StageRow[]).map((s) => ({ label: s.label, state: s.state === 'todo' ? 'todo' : s.state })),
      info,
    },
  };
}

// Picks the scheme the student named ("top class", "post matric"…) by matching words from scheme titles.
function mentionedScheme(message: string, schemes: any[]) {
  const stop = new Set(['scholarship', 'national', 'students', 'student', 'education', 'scheme', 'for', 'and', 'the', 'st', 'tribal']);
  const m = message.toLowerCase();
  let best: any = null;
  let bestScore = 0;
  let tie = false;
  for (const s of schemes) {
    const tokens = String(s.title).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !stop.has(w));
    const score = tokens.filter((w) => m.includes(w)).length;
    if (score > bestScore) { best = s; bestScore = score; tie = false; }
    else if (score === bestScore && score > 0) tie = true;
  }
  return bestScore > 0 && !tie ? best : null;
}

async function loadSchemes() {
  const { data, error } = await db().from('schemes').select('code, title, title_hi, rules, documents, deadline').order('code');
  if (error) throw error;
  return (data ?? []) as any[];
}

async function eligibilityReply(studentId: string, lang: Lang): Promise<Reply> {
  const [stu, schemes, app] = await Promise.all([db().from('students').select('*').eq('id', studentId).single(), loadSchemes(), activeApplication(studentId)]);
  if (stu.error) throw stu.error;
  const enrolledCode = app?.scheme_code;
  const eligible: string[] = [];
  for (const s of schemes) {
    const { status } = statusFor(evaluate(stu.data, s), false);
    if (status === 'eligible' && s.code !== enrolledCode) eligible.push(lang === 'hi' ? s.title_hi ?? s.title : s.title);
  }
  const enrolled = app ? (lang === 'hi' ? app.schemes?.title_hi ?? app.schemes?.title : app.schemes?.title) : null;
  const parts: string[] = [];
  if (enrolled) parts.push(lang === 'hi' ? `आप पहले से "${enrolled}" में नामांकित हैं।` : `You are already enrolled in ${enrolled}.`);
  parts.push(
    eligible.length
      ? lang === 'hi' ? `आप इनके लिए पात्र हैं: ${eligible.join(', ')}। विवरण के लिए "योजनाएं" खोलें।` : `You are eligible for: ${eligible.join(', ')}. Open Schemes for details.`
      : lang === 'hi' ? 'अभी किसी और योजना के लिए आपकी पात्रता नहीं बनती।' : 'You do not match any other scheme right now.',
  );
  return { kind: 'text', text: parts.join(' ') };
}

async function documentsReply(studentId: string, message: string, lang: Lang): Promise<Reply> {
  const schemes = await loadSchemes();
  let scheme = mentionedScheme(message, schemes);
  if (!scheme) {
    const stu = await db().from('students').select('*').eq('id', studentId).single();
    if (stu.error) throw stu.error;
    const app = await activeApplication(studentId);
    // otherwise the best scheme the student could still apply for, else the one they are in
    scheme = schemes.find((s) => s.code !== app?.scheme_code && statusFor(evaluate(stu.data, s), false).status === 'eligible') ?? schemes.find((s) => s.code === app?.scheme_code) ?? schemes[0];
  }
  const list = await documentChecklist(studentId, scheme.documents ?? []);
  const verified = list.filter((d) => d.status === 'verified').length;
  return {
    kind: 'docs',
    card: {
      title: `${lang === 'hi' ? scheme.title_hi ?? scheme.title : scheme.title} · ${lang === 'hi' ? 'आवश्यक दस्तावेज़' : 'Required Documents'}`,
      verified,
      total: list.length,
      items: list.map((d, i) => ({ name: `${i + 1}. ${d.name}`, ok: d.status === 'verified' })),
      upload: list.find((d) => d.status !== 'verified')?.name ?? null,
    },
  };
}

async function deadlinesReply(studentId: string, lang: Lang): Promise<Reply> {
  const [rows, docs] = await Promise.all([
    db().from('deadlines').select('kind, title, due_on').eq('student_id', studentId).order('due_on', { ascending: true }),
    db().from('documents').select('status').eq('student_id', studentId),
  ]);
  if (rows.error || docs.error) throw rows.error ?? docs.error;
  const today = todayIst();
  const needsUpload = (docs.data ?? []).some((d: any) => d.status === 'rejected' || d.status === 'missing');
  const upcoming = ((rows.data ?? []) as any[])
    .filter((r) => (r.kind !== 'action' || needsUpload) && r.kind !== 'renewal' && r.kind !== 'payment' && daysBetween(today, r.due_on) >= 0)
    .slice(0, 3);
  if (!upcoming.length) return { kind: 'text', text: lang === 'hi' ? 'अभी कोई आगामी अंतिम तिथि नहीं है।' : 'You have no upcoming deadlines right now.' };
  const lines = upcoming.map((r) => `${r.title}: ${ddmmyyyy(`${r.due_on}T00:00:00+05:30`)} (${daysBetween(today, r.due_on)} ${lang === 'hi' ? 'दिन' : 'days'})`);
  return { kind: 'text', text: (lang === 'hi' ? 'आगामी तिथियाँ: ' : 'Upcoming dates: ') + lines.join('; ') + '.' };
}

async function seedingReply(studentId: string, lang: Lang): Promise<Reply> {
  const [stu, pay] = await Promise.all([
    db().from('students').select('bank_name, account_last4, aadhaar_seeded, npci_mapped').eq('id', studentId).single(),
    db().from('payments').select('id').eq('student_id', studentId).eq('status', 'failed'),
  ]);
  if (stu.error || pay.error) throw stu.error ?? pay.error;
  const seeded = Boolean(stu.data.aadhaar_seeded && stu.data.npci_mapped);
  const failed = pay.data?.length ?? 0;
  const bank = `${stu.data.bank_name ?? 'your bank'} ••••${stu.data.account_last4 ?? ''}`;
  if (seeded && !failed) return { kind: 'text', text: lang === 'hi' ? `${bank} आधार से सीडेड है। कोई भुगतान अटका नहीं है।` : `${bank} is Aadhaar-seeded and no payment is stuck.` };
  return {
    kind: 'text',
    text: lang === 'hi'
      ? `${failed} भुगतान विफल है क्योंकि बैंक खाता NPCI से मैप नहीं है। DBT स्क्रीन पर "Fix via NPCI" चुनें।`
      : `${failed} payment${failed === 1 ? ' has' : 's have'} failed because the bank account is not mapped with NPCI. Open DBT and tap "Fix via NPCI".`,
  };
}

async function grievanceReply(studentId: string, lang: Lang): Promise<Reply> {
  const { data, error } = await db().from('grievances').select('ticket_no').eq('student_id', studentId).eq('status', 'in_progress');
  if (error) throw error;
  const n = data?.length ?? 0;
  return {
    kind: 'text',
    text: lang === 'hi'
      ? `शिकायत दर्ज करने के लिए "सहायता" खोलें।${n ? ` आपकी ${n} शिकायत प्रक्रियाधीन है: ${data!.map((g: any) => g.ticket_no).join(', ')}।` : ''}`
      : `To raise a complaint open Help & Grievance.${n ? ` You have ${n} open: ${data!.map((g: any) => g.ticket_no).join(', ')}.` : ''}`,
  };
}

export async function jagoReply(studentId: string, message: string, lang: Lang): Promise<Reply> {
  const m = message.toLowerCase();
  if (has(m, /grievance|complain|shikayat|शिकायत/)) return grievanceReply(studentId, lang);
  if (has(m, /seeding|npci|aadhaar link|bank|सीडिंग|बैंक/)) return seedingReply(studentId, lang);
  if (has(m, /document|certificate|papers|dastavej|kagaz|दस्तावेज|कागज|प्रमाण/)) return documentsReply(studentId, message, lang);
  if (has(m, /deadline|last date|due|calendar|antim|tithi|अंतिम|तिथि/)) return deadlinesReply(studentId, lang);
  if (has(m, /eligib|qualify|yogya|patra|योग्य|पात्र/)) return eligibilityReply(studentId, lang);
  if (has(m, /status|payment|money|paisa|paise|kab|when|credit|application|aavedan|स्थिति|पैसा|भुगतान|कब|आवेदन/)) return statusReply(studentId, lang);
  if (has(m, /^(hi|hello|hey|namaste)\b|नमस्ते/)) return { kind: 'text', text: T.hello[lang] };
  return { kind: 'text', text: T.fallback[lang] };
}
