import { route } from '../server/router';

// The only serverless function. Every /api/... request lands here and is dispatched by server/router.ts.
export const GET = (request: Request) => route(request);
export const POST = (request: Request) => route(request);
export const PATCH = (request: Request) => route(request);
export const DELETE = (request: Request) => route(request);
