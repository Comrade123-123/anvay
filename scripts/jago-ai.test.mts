// Logic test for JAGO's AI layer with a fake database and fake model calls (no network, no API key needed).
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

const { aiReply, toApiMessages, buildContext, claudeComplete, geminiComplete, providerInUse } = await import('../server/_lib/jago-ai.ts');

const input = { studentId: 's1', question: 'mera paisa kab aayega?', lang: 'en' as const, history: [], card: null };
const args = { system: 'RULES', data: 'STUDENT DATA', messages: [{ role: 'user' as const, content: 'hi' }] };

// ---------------------------------------------------------------- conversation + context
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
  assert.equal(m.length, 3);
});

test('only the last 8 turns are sent', () => {
  const turns = Array.from({ length: 30 }, (_, i) => ({ role: (i % 2 ? 'bot' : 'user') as 'bot' | 'user', text: `t${i}` }));
  const text = toApiMessages(turns, 'q').map((x) => String(x.content)).join(' ');
  assert.ok(!text.includes('t10 ') && text.includes('t29'));
});

test("the model is shown the student's own data and no raw income", async () => {
  let seen: any;
  const out = await aiReply(input, async (a) => ((seen = a), ' Aapka ₹4,500 abhi ruka hai. '));
  assert.equal(out, 'Aapka ₹4,500 abhi ruka hai.');
  assert.match(seen.data, /"firstName":"Ramesh"/);
  assert.match(seen.data, /Book Grant/);
  assert.match(seen.data, /Admission Letter/);
  assert.match(seen.data, /"aadhaarSeededWithBank":true/);
  assert.doesNotMatch(seen.data, /income_annual|300000/);
  assert.match(seen.system, /Answer only from the STUDENT DATA/);
  assert.equal(seen.messages[seen.messages.length - 1].role, 'user');
});

test('the context records whether a card is shown', async () => {
  const ctx: any = await buildContext('s1', 'hi', 'status');
  assert.equal(ctx.cardShownUnderYourMessage, 'application status card');
  assert.equal(ctx.preferredLanguage, 'Hindi');
  assert.equal(((await buildContext('s1', 'en', null)) as any).cardShownUnderYourMessage, 'none');
});

test('empty answer, error and no provider all fall back (null); long answers are capped', async () => {
  assert.equal(await aiReply(input, async () => '   '), null);
  assert.equal(await aiReply(input, async () => null), null);
  assert.equal(await aiReply(input, async () => { throw new Error('boom'); }), null);
  assert.equal(await aiReply(input, null), null);
  assert.equal((await aiReply(input, async () => 'x'.repeat(5000)))?.length, 1200);
});

test('Gemini is chosen when its key is set, Claude when only that key is set, otherwise none', () => {
  delete process.env.GEMINI_API_KEY; delete process.env.ANTHROPIC_API_KEY;
  assert.equal(providerInUse(), null);
  process.env.ANTHROPIC_API_KEY = 'a';
  assert.equal(providerInUse(), 'claude');
  process.env.GEMINI_API_KEY = 'g';
  assert.equal(providerInUse(), 'gemini');
  delete process.env.GEMINI_API_KEY; delete process.env.ANTHROPIC_API_KEY;
});

// ---------------------------------------------------------------- Gemini
const resp = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
const okBody = (text: string) => ({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text }] } }] });

test('Gemini request: right URL, key in a header (not the URL), system rules + data, roles mapped', async () => {
  process.env.GEMINI_API_KEY = 'secret-key';
  delete process.env.GEMINI_MODEL;
  const calls: any[] = [];
  const f: any = async (url: string, init: any) => (calls.push({ url, init }), resp(200, okBody('Namaste Ramesh')));
  const out = await geminiComplete({ ...args, messages: [{ role: 'user', content: 'a' }, { role: 'assistant', content: 'b' }, { role: 'user', content: 'c' }] }, f);
  assert.equal(out, 'Namaste Ramesh');
  const { url, init } = calls[0];
  assert.match(url, /\/v1beta\/models\/gemini-3\.6-flash:generateContent$/);
  assert.ok(!url.includes('secret-key'));
  assert.equal(init.headers['x-goog-api-key'], 'secret-key');
  const body = JSON.parse(init.body);
  assert.match(body.systemInstruction.parts[0].text, /RULES[\s\S]*STUDENT DATA/);
  assert.deepEqual(body.contents.map((c: any) => c.role), ['user', 'model', 'user']);
  assert.equal(body.generationConfig.thinkingConfig.thinkingLevel, 'low');
  assert.ok(body.generationConfig.maxOutputTokens >= 1500); // thinking tokens count against it
});

test('Gemini: a retired model (404) or no quota (429) moves on to the next free model', async () => {
  process.env.GEMINI_API_KEY = 'k';
  const urls: string[] = [];
  const f: any = async (url: string) => (urls.push(url), url.includes('3.6-flash') ? resp(404, { error: {} }) : url.includes('3.8-flash') ? resp(429, { error: {} }) : resp(200, okBody('from lite')));
  assert.equal(await geminiComplete(args, f), 'from lite');
  assert.equal(urls.length, 3);
  assert.match(urls[2], /3\.5-flash-lite/);
});

test('Gemini: a 400 about thinking is retried once without the thinking setting', async () => {
  process.env.GEMINI_API_KEY = 'k';
  const bodies: any[] = [];
  const f: any = async (_u: string, init: any) => {
    const b = JSON.parse(init.body);
    bodies.push(b);
    return b.generationConfig.thinkingConfig ? resp(400, { error: {} }) : resp(200, okBody('ok'));
  };
  assert.equal(await geminiComplete(args, f), 'ok');
  assert.equal(bodies.length, 2);
  assert.ok(!bodies[1].generationConfig.thinkingConfig);
});

test('Gemini: blocked prompt, safety stop, other errors and network failure all return null', async () => {
  process.env.GEMINI_API_KEY = 'k';
  assert.equal(await geminiComplete(args, (async () => resp(200, { promptFeedback: { blockReason: 'SAFETY' } })) as any), null);
  assert.equal(await geminiComplete(args, (async () => resp(200, { candidates: [{ finishReason: 'SAFETY' }] })) as any), null);
  assert.equal(await geminiComplete(args, (async () => resp(500, {})) as any), null);
  assert.equal(await geminiComplete(args, (async () => resp(403, {})) as any), null);
  assert.equal(await geminiComplete(args, (async () => { throw new Error('offline'); }) as any), null);
  assert.equal(await geminiComplete(args, (async () => resp(429, {})) as any), null); // every model out of quota
});

test('Gemini: thinking parts are not shown to the student', async () => {
  process.env.GEMINI_API_KEY = 'k';
  const f: any = async () => resp(200, { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'secret thoughts', thought: true }, { text: 'Visible answer' }] } }] });
  assert.equal(await geminiComplete(args, f), 'Visible answer');
});

// ---------------------------------------------------------------- Claude
test('Claude request settings; a refusal returns null; thinking blocks are ignored', async () => {
  const calls: any[] = [];
  const fake = (reply: any) => ({ messages: { create: async (r: any) => (calls.push(r), reply) } }) as any;
  assert.equal(await claudeComplete(args, fake({ stop_reason: 'end_turn', content: [{ type: 'thinking', thinking: 'x' }, { type: 'text', text: 'Hello' }] })), 'Hello');
  assert.equal(calls[0].model, 'claude-opus-5-5');
  assert.equal(calls[0].output_config.effort, 'low');
  assert.equal(calls[0].system[1].text, 'STUDENT DATA');
  assert.equal(await claudeComplete(args, fake({ stop_reason: 'refusal', content: [] })), null);
});
