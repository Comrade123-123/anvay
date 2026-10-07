import { db } from '../_lib/supabase';
import { fail, json } from '../_lib/http';
import { studentIdFrom } from '../_lib/auth';
import { clockIst } from '../_lib/today';
import { hasDevanagari, jagoReply, type Lang } from '../_lib/jago';

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

    const reply = await jagoReply(id, message, lang);
    const answered = await db()
      .from('chat_messages')
      .insert({ student_id: id, role: 'bot', kind: reply.kind, body: reply.kind === 'text' ? reply.text : JSON.stringify(reply.card), created_at: new Date(Date.now() + 1).toISOString() })
      .select('*')
      .single();
    if (answered.error) throw answered.error;

    return json({ messages: [shape(asked.data), shape(answered.data)] });
  } catch {
    return fail('JAGO could not answer right now. Please try again.', 500);
  }
}
