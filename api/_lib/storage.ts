import { db } from './supabase';

export const DOCUMENT_BUCKET = 'documents';
export const MAX_FILE_BYTES = 2 * 1024 * 1024;
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

let ensured = false;

// Creates the private storage bucket the first time it is needed, so there is nothing to set up by hand.
export async function ensureBucket() {
  if (ensured) return;
  const client = db();
  const existing = await client.storage.getBucket(DOCUMENT_BUCKET);
  if (existing.error) {
    const made = await client.storage.createBucket(DOCUMENT_BUCKET, { public: false, fileSizeLimit: MAX_FILE_BYTES });
    if (made.error && !/already exists/i.test(made.error.message)) throw made.error;
  }
  ensured = true;
}
