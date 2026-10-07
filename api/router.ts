import { route } from '../server/router';

// The only serverless function. vercel.json rewrites every /api/... request to /api/router?path=..., because Vercel's
// catch-all file names only match one path level. The original path is put back before dispatching to server/router.ts.
const handle = (request: Request) => {
  const url = new URL(request.url);
  const path = url.searchParams.get('path');
  if (path === null) return route(request);
  url.searchParams.delete('path');
  url.pathname = '/api/' + path.replace(/^\/+/, '');
  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  return route(new Request(url.toString(), { method: request.method, headers: request.headers, body: hasBody ? request.body : undefined, duplex: 'half' } as RequestInit));
};

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
