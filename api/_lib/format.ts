// Dates are shown in Indian format (dd/mm/yyyy) in India time, regardless of where the server runs.
export function ddmmyyyy(value: string | Date | null | undefined): string {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
}
