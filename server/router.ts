import { fail } from './_lib/http';
import * as health from './routes/health';
import * as me from './routes/me';
import * as home from './routes/home';
import * as sendOtp from './routes/auth-send-otp';
import * as verifyOtp from './routes/auth-verify-otp';
import * as schemes from './routes/schemes';
import * as schemeDetail from './routes/scheme-detail';
import * as applications from './routes/applications';
import * as application from './routes/application';
import * as applicationSubmit from './routes/application-submit';
import * as documents from './routes/documents';
import * as documentsUpload from './routes/documents-upload';
import * as documentsFromWallet from './routes/documents-from-wallet';
import * as demoReset from './routes/demo-reset';
import * as demoAdvance from './routes/demo-advance';
import * as journey from './routes/journey';
import * as dbt from './routes/dbt';
import * as dbtFixSeeding from './routes/dbt-fix-seeding';
import * as paymentRetry from './routes/payment-retry';
import * as notifications from './routes/notifications';
import * as notificationsRead from './routes/notifications-read';

type Handler = (request: Request) => Response | Promise<Response>;
type Module = Partial<Record<'GET' | 'POST' | 'PATCH' | 'DELETE', Handler>>;

// Vercel's free plan allows 12 serverless functions per deployment, and every file in api/ becomes one. So the whole
// API is a single function (api/[...route].ts) that picks the right handler here. ":name" matches any one segment.
const routes: { pattern: string; module: Module }[] = [
  { pattern: 'health', module: health },
  { pattern: 'me', module: me },
  { pattern: 'home', module: home },
  { pattern: 'auth/send-otp', module: sendOtp },
  { pattern: 'auth/verify-otp', module: verifyOtp },
  { pattern: 'schemes', module: schemes },
  { pattern: 'schemes/:code', module: schemeDetail },
  { pattern: 'applications', module: applications },
  { pattern: 'applications/:id', module: application },
  { pattern: 'applications/:id/submit', module: applicationSubmit },
  { pattern: 'documents', module: documents },
  { pattern: 'documents/upload', module: documentsUpload },
  { pattern: 'documents/from-wallet', module: documentsFromWallet },
  { pattern: 'demo/reset', module: demoReset },
  { pattern: 'demo/advance', module: demoAdvance },
  { pattern: 'journey', module: journey },
  { pattern: 'dbt', module: dbt },
  { pattern: 'dbt/fix-seeding', module: dbtFixSeeding },
  { pattern: 'payments/:id/retry', module: paymentRetry },
  { pattern: 'notifications', module: notifications },
  { pattern: 'notifications/read-all', module: notificationsRead },
  { pattern: 'notifications/:id/read', module: notificationsRead },
];

function matches(pattern: string, segments: string[]): boolean {
  const parts = pattern.split('/');
  return parts.length === segments.length && parts.every((p, i) => p.startsWith(':') || p === segments[i]);
}

export async function route(request: Request): Promise<Response> {
  const segments = new URL(request.url).pathname.split('/').filter(Boolean).slice(1); // drop the leading "api"
  const hit = routes.find((r) => matches(r.pattern, segments));
  if (!hit) return fail('Not found', 404);
  const handler = hit.module[request.method as keyof Module];
  if (!handler) return fail('Method not allowed', 405);
  try {
    return await handler(request);
  } catch {
    return fail('Something went wrong. Please try again.', 500);
  }
}
