import { db } from '../_lib/supabase';
import { fail, json } from '../_lib/http';
import { studentIdFrom } from '../_lib/auth';
import { clockIst } from '../_lib/today';
import { hasDevanagari, jagoReply, type Lang, type Reply } from '../_lib/jago';
import { MAX_AI_QUESTIONS_PER_HOUR, aiEnabled, aiReply, type ChatTurn } from '../_lib/jago-ai';

const shape = (m: any) => {
  let card: unknown = null;
  if (m.kind !== 'text') {
    try { card = JSON.parse(m.body ?? 'null'); } catch { card = null; }
  }
  return {
    id: m.id as string,
    from: m.role as 'user' | 'bot',
    kind: m.kind as 'text' | 'status' | 'docs',
    text: m.kind === 'text' ? ((m.body ?? '') as string) : null,
    card,
    time: clockIst(m.created_at),
  };
};

// GET /api/chat: the conversation so far, oldest first.
export async function GET(request: Request) {
  const id = studentIdFrom(request);
  if (!id) return fail('Please sign in', 401);
  const { data, error } = await db().from('chat_messages').select('*').eq('student_id', id).order('created_at', { ascending: false }).limit(60);
  if (error) return fail('Could not load the chat', 500);
  return json({ messages: (data ?? []).reverse().map(shape) });
}

// POST /api/chat  { message, lang? }: stores the question, works out JAGO's answer from the student's records and stores that too.
export async function POST(request: Request) {
  const id = studentIdFrom(request);
  if (!id) return fail('Please sign in', 401);
  const body = await request.json().catch(() => null);
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  if (!message) return fail('Type a message first', 422);
  if (message.length > 500) return fail('Please keep your message under 500 characters', 422);
  const lang: Lang = hasDevanagari(message) || body?.lang === 'hi' ? 'hi' : 'en';

  try {
    const asked = await db().from('chat_messages').insert({ student_id: id, role: 'user', kind: 'text', body: message }).select('*').single();
    if (asked.error) throw asked.error;

    // The keyword rules always run: they build the status / documents cards, and they answer alone when the AI is off.
    const rule = await jagoReply(id, message, lang);
    const cardKind = rule.kind === 'text' ? null : rule.kind;
    const toRow = (r: Reply) => ({ kind: r.kind, body: r.kind === 'text' ? r.text : JSON.stringify(r.card) });
    let answers: { kind: string; body: string }[] = [toRow(rule)];

    if (aiEnabled()) {
      const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
      const [recent, past] = await Promise.all([
        db().from('chat_messages').select('id', { count: 'exact', head: true }).eq('student_id', id).eq('role', 'user').gte('created_at', hourAgo),
        db().from('chat_messages').select('role, kind, body').eq('student_id', id).neq('id', asked.data.id).order('created_at', { ascending: false }).limit(8),
      ]);
      if ((recent.count ?? 0) <= MAX_AI_QUESTIONS_PER_HOUR && !past.error) {
        const history: ChatTurn[] = ((past.data ?? []) as any[]).reverse().map((m) => ({
          role: m.role,
          text: m.kind === 'text' ? String(m.body ?? '') : m.kind === 'status' ? '[showed the application status card]' : '[showed the documents checklist card]',
        }));
        const text = await aiReply({ studentId: id, question: message, lang, history, card: cardKind });
        if (text) answers = [{ kind: 'text', body: text }, ...(cardKind ? [toRow(rule)] : [])];
      }
    }

    const saved: any[] = [];
    for (let i = 0; i < answers.length; i++) {
      const a = await db()
        .from('chat_messages')
        .insert({ student_id: id, role: 'bot', ...answers[i], created_at: new Date(Date.now() + 1 + i).toISOString() })
        .select('*')
        .single();
      if (a.error) throw a.error;
      saved.push(a.data);
    }

    return json({ messages: [shape(asked.data), ...saved.map(shape)] });
  } catch {
    return fail('JAGO could not answer right now. Please try again.', 500);
  }
}
