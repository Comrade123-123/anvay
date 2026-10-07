import { ddmmyyyy } from './format';

export type StageRow = { stage_no: number; state: 'done' | 'current' | 'upcoming'; occurred_at: string | null };

// The app shows six internal milestones as four steps: Submitted | Verified (stages 2-4) | Sanctioned | Disbursed.
export function buildSteps(stages: StageRow[]) {
  const by = (n: number) => stages.find((s) => s.stage_no === n);
  const group = (nos: number[]) => {
    const rows = nos.map(by).filter(Boolean) as StageRow[];
    const done = rows.length > 0 && rows.every((r) => r.state === 'done');
    const started = rows.some((r) => r.state !== 'upcoming');
    const last = [...rows].reverse().find((r) => r.state === 'done' && r.occurred_at);
    return { state: done ? 'done' : started ? 'current' : 'todo', date: ddmmyyyy(last?.occurred_at) };
  };
  const submitted = group([1]);
  const verified = group([2, 3, 4]);
  const sanctioned = group([5]);
  const disbursed = group([6]);
  return [
    { key: 'submitted', label: 'Submitted', sub: submitted.date || 'Pending', state: submitted.state },
    { key: 'verified', label: 'Verified', sub: verified.date || 'In progress', state: verified.state },
    { key: 'sanctioned', label: 'Sanctioned', sub: sanctioned.state === 'done' ? sanctioned.date : 'Pending', state: sanctioned.state },
    { key: 'disbursed', label: 'Disbursed', sub: disbursed.state === 'done' ? disbursed.date : 'PFMS', state: disbursed.state },
  ];
}
