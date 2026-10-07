import { ddmmyyyy } from './format';

// Works out, for one student and one scheme, which rules pass. The rules live in schemes.rules (jsonb), for example
// {"category":"ST","levels":["ug","pg"],"max_income":800000,"institute_tier":"top"}.
export type Check = { key: string; label: string; ok: boolean };
export type SchemeStatus = 'enrolled' | 'eligible' | 'not_eligible';

type StudentRow = { category?: string | null; income_annual?: number | null; course?: string | null; institute?: string | null };
type SchemeRow = { code: string; rules?: Record<string, any> | null; deadline?: string | null };

export function levelOf(course?: string | null): string {
  const c = (course ?? '').toLowerCase();
  if (/ph\.?\s?d/.test(c)) return 'phd';
  if (/m\.?\s?phil/.test(c)) return 'mphil';
  if (/(m\.?\s?tech|m\.?\s?sc|\bmba\b|\bm\.?a\b|\bm\.?e\b|post.?grad|\bpg\b)/.test(c)) return 'pg';
  if (/class\s?(9|10)/.test(c)) return 'class9';
  if (/class\s?(11|12)/.test(c)) return 'class11';
  return 'ug';
}

const LEVEL_TEXT: Record<string, string> = {
  class9: 'Class 9',
  class10: 'Class 10',
  class11: 'Class 11',
  class12: 'Class 12',
  ug: 'undergraduate',
  pg: 'postgraduate',
  mphil: 'M.Phil',
  phd: 'PhD',
};

function levelsText(levels: string[]): string {
  if (levels.every((l) => l === 'class9' || l === 'class10')) return 'Class 9 & 10 students';
  if (levels.every((l) => l === 'pg' || l === 'phd')) return 'Masters & PhD students';
  if (levels.every((l) => l === 'mphil' || l === 'phd')) return 'M.Phil & PhD scholars';
  return levels.map((l) => LEVEL_TEXT[l] ?? l).join(' / ') + ' students';
}

const lakh = (n: number) => `₹${+(n / 100000).toFixed(2)} Lakh`;

export function evaluate(student: StudentRow, scheme: SchemeRow): Check[] {
  const rules = scheme.rules ?? {};
  const checks: Check[] = [];

  if (rules.category) {
    const ok = student.category === rules.category;
    checks.push({ key: 'category', ok, label: ok ? `${rules.category} category verified` : `Only for ${rules.category} students` });
  }
  if (rules.requires === 'pg_degree') {
    const lvl = levelOf(student.course);
    const ok = lvl === 'pg' || lvl === 'mphil' || lvl === 'phd';
    checks.push({ key: 'pg', ok, label: ok ? 'Postgraduate degree held' : 'Requires PG degree' });
  }
  if (Array.isArray(rules.levels) && rules.levels.length) {
    const ok = rules.levels.includes(levelOf(student.course));
    checks.push({ key: 'level', ok, label: ok ? `Course level fits (${student.course ?? 'your course'})` : `For ${levelsText(rules.levels)}` });
  }
  if (rules.institute_tier === 'top') {
    const ok = /(iit|iim|nit|aiims|nlu|iiit|iisc)/i.test(student.institute ?? '');
    checks.push({ key: 'institute', ok, label: ok ? `Admitted to a top institute (${student.institute})` : 'Needs admission to a top-ranked institute' });
  }
  if (typeof rules.max_income === 'number') {
    const ok = student.income_annual != null && student.income_annual <= rules.max_income;
    checks.push({ key: 'income', ok, label: ok ? `Family income within ${lakh(rules.max_income)} ceiling` : `Family income above ${lakh(rules.max_income)} ceiling` });
  }
  return checks;
}

export function statusFor(checks: Check[], hasActiveApplication: boolean): { status: SchemeStatus; reason: string | null } {
  if (hasActiveApplication) return { status: 'enrolled', reason: null };
  const failed = checks.find((c) => !c.ok);
  return failed ? { status: 'not_eligible', reason: failed.label } : { status: 'eligible', reason: null };
}

export function deadlineInfo(deadline?: string | null) {
  if (!deadline) return { deadline: '', daysLeft: null as number | null };
  const end = new Date(`${deadline}T23:59:59+05:30`).getTime();
  const days = Math.ceil((end - Date.now()) / 86_400_000);
  return { deadline: ddmmyyyy(`${deadline}T00:00:00+05:30`), daysLeft: days };
}
