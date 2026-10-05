// Small helpers so every endpoint answers in the same JSON shape: { ok: true, data } or { ok: false, error }.
const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

export const json = (data: unknown, status = 200) => new Response(JSON.stringify({ ok: status < 400, data }), { status, headers });

export const fail = (message: string, status = 400) =>
  new Response(JSON.stringify({ ok: false, error: message }), { status, headers });
