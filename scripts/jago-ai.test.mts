// Logic test for JAGO's AI layer with a fake database and a fake model client (no network, no API key needed).
// Run: npx tsx --experimental-test-module-mocks --test scripts/jago-ai.test.mts
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const tables: Record<string, any> = {
  students: { id: 's1', name: 'Ramesh Kumar Munda', course: 'B.Tech', institute: 'IIT Kharagpur', category: 'ST', income_annual: 300000, bank_name: 'SBI', account_last4: '4417', aadhaar_seeded: true, npci_mapped: true },
  payments: [{ label: 'Book Grant', amount: 4500, status: 'failed', fy: '2025-26', paid_on: '2025-12-02', failure_reason: 'NPCI mapper' }],
  documents: [{ title: 'Admission Letter', status: 'rejected', problems: ['blurry'], expires_on: null }],
  deadlines: [{ kind: 'deadline', title: 'Top Class closes', subtitle: '', due_on: '2099-01-01' }],
  grievances: [],
  schemes: [],
  applications: [],
};
const fakeDb = () => ({
  from: (t: string) => {
    const chain: any = {};
    for (const m of ['select', 'eq', 'neq', 'in', 'order', 'limit', 'gte']) chain[m] = () => chain;
    chain.single = async () => ({ data: tables[t], error: null });
    chain.maybeSingle = async () => ({ data: tables[t] ?? null, error: null });
    chain.then = (res: any) => res({ data: Array.isArray(tables[t]) ? tables[t] : [], error: null });
    return chain;
  },
});
mock.module(pathToFileURL(path.resolve('server/_lib/supabase.ts')).href, { namedExports: { db: fakeDb } });

const { aiReply, toApiMessages, buildContext } = await import('../server/_lib/jago-ai.ts');

const fake = (reply: any, calls: any[] = []) => ({
  messages: {
    create: async (req: any) => {
      calls.push(req);
      if (reply instanceof Error) throw reply;
      return reply;
    },
  },
}) as any;
const input = { studentId: 's1', question: 'mera paisa kab aayega?', lang: 'en' as const, history: [], card: null };

test('history becomes alternating messages that start with the user and end with the question', () => {
  const m = toApiMessages(
    [
      { role: 'bot', text: 'Namaste' },
      { role: 'user', text: 'hi' },
      { role: 'user', text: 'status?' },
      { role: 'bot', text: 'Stage 4' },
    ],
    'and money?',
  );
  assert.equal(m[0].role, 'user');
  for (let i = 1; i < m.length; i++) assert.notEqual(m[i].role, m[i - 1].role);
  assert.equal(m[m.length - 1].role, 'user');
  assert.match(String(m[m.length - 1].content), /and money\?$/);
  assert.equal(m.length, 3); // user(hi+status), assistant, user(question)
});

test('only the last 8 turns are sent', () => {
  const turns = Array.from({ length: 30 }, (_, i) => ({ role: (i % 2 ? 'bot' : 'user') as 'bot' | 'user', text: `t${i}` }));
  const m = toApiMessages(turns, 'q');
  const text = m.map((x) => String(x.content)).join(' ');
  assert.ok(!text.includes('t10 ') && text.includes('t29'));
});

test('the model is shown the student\'s own data and the right request settings', async () => {
  const calls: any[] = [];
  const out = await aiReply(input, fake({ stop_reason: 'end_turn', content: [{ type: 'text', text: ' Aapka ₹4,500 abhi ruka hai. ' }] }, calls));
  assert.equal(out, 'Aapka ₹4,500 abhi ruka hai.');
  const req = calls[0];
  assert.equal(req.model, 'claude-opus-5-5');
  assert.equal(req.output_config.effort, 'low');
  assert.ok(req.max_tokens >= 300);
  const data = req.system[1].text;
  assert.match(data, /"firstName":"Ramesh"/);
  assert.match(data, /Book Grant/);
  assert.match(data, /Admission Letter/);
  assert.match(data, /"aadhaarSeededWithBank":true/);
  assert.doesNotMatch(data, /income_annual|300000/); // raw income is not sent
  assert.match(req.system[0].text, /Answer only from the STUDENT DATA/);
  assert.equal(req.messages[req.messages.length - 1].role, 'user');
});

test('the context records whether a card is shown', async () => {
  const ctx: any = await buildContext('s1', 'hi', 'status');
  assert.equal(ctx.cardShownUnderYourMessage, 'application status card');
  assert.equal(ctx.preferredLanguage, 'Hindi');
  const none: any = await buildContext('s1', 'en', null);
  assert.equal(none.cardShownUnderYourMessage, 'none');
});

test('a refusal, an empty answer, an API error and a missing key all fall back (null)', async () => {
  assert.equal(await aiReply(input, fake({ stop_reason: 'refusal', content: [] })), null);
  assert.equal(await aiReply(input, fake({ stop_reason: 'end_turn', content: [{ type: 'text', text: '   ' }] })), null);
  assert.equal(await aiReply(input, fake({ stop_reason: 'end_turn', content: [] })), null);
  assert.equal(await aiReply(input, fake(new Error('529 overloaded'))), null);
  delete process.env.ANTHROPIC_API_KEY;
  assert.equal(await aiReply(input), null);
});

test('thinking blocks are ignored and a very long answer is capped', async () => {
  const out = await aiReply(input, fake({ stop_reason: 'end_turn', content: [{ type: 'thinking', thinking: 'secret' }, { type: 'text', text: 'x'.repeat(5000) }] }));
  assert.ok(out && out.length === 1200 && !out.includes('secret'));
});
