// The documents a scheme asks for are plain names ("ST Caste Certificate"); the student's wallet stores them by kind.
// This maps one to the other so both sides agree on what "the same document" means.
export type DocKind = 'aadhaar' | 'st_caste' | 'income' | 'residence' | 'marksheet' | 'bonafide' | 'admission';

export const DOC_KINDS: DocKind[] = ['aadhaar', 'st_caste', 'income', 'residence', 'marksheet', 'bonafide', 'admission'];

export function kindOfName(name: string): DocKind | null {
  const n = name.toLowerCase();
  if (n.includes('aadhaar')) return 'aadhaar';
  if (n.includes('caste')) return 'st_caste';
  if (n.includes('income')) return 'income';
  if (n.includes('resident')) return 'residence';
  if (n.includes('marksheet')) return 'marksheet';
  if (n.includes('bonafide')) return 'bonafide';
  if (n.includes('admission')) return 'admission';
  return null;
}

export const isDocKind = (v: unknown): v is DocKind => typeof v === 'string' && (DOC_KINDS as string[]).includes(v);
