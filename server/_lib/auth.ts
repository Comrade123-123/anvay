/// <reference types="node" />
import { createHmac, timingSafeEqual } from 'node:crypto';
import { readEnv } from './env';

// Minimal HS256 token (header.payload.signature) so no extra dependency is needed. The payload only carries the
// student id (sub) and an expiry; everything else is looked up from the database on each request.
const b64 = (value: Buffer | string) => Buffer.from(value).toString('base64url');
const sign = (data: string, secret: string) => createHmac('sha256', secret).update(data).digest();

export const DEMO_STUDENT_ID = '00000000-0000-4000-8000-000000000001';
const WEEK = 7 * 24 * 60 * 60;

export function signToken(studentId: string, ttlSeconds = WEEK): string {
  const { jwtSecret } = readEnv();
  if (!jwtSecret) throw new Error('JWT_SECRET is not set');
  const head = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64(JSON.stringify({ sub: studentId, exp: Math.floor(Date.now() / 1000) + ttlSeconds }));
  return `${head}.${body}.${b64(sign(`${head}.${body}`, jwtSecret))}`;
}

export function verifyToken(token: string): { sub: string } | null {
  const { jwtSecret } = readEnv();
  const parts = token.split('.');
  if (!jwtSecret || parts.length !== 3) return null;
  const expected = sign(`${parts[0]}.${parts[1]}`, jwtSecret);
  const given = Buffer.from(parts[2], 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (typeof payload.sub !== 'string' || typeof payload.exp !== 'number' || payload.exp < Date.now() / 1000) return null;
    return { sub: payload.sub };
  } catch {
    return null;
  }
}

// Returns the signed-in student's id, or null when the request has no valid token.
export function studentIdFrom(request: Request): string | null {
  const header = request.headers.get('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? (verifyToken(match[1])?.sub ?? null) : null;
}

export function sameSecret(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
