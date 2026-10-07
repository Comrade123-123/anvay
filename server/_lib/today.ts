// "Today" is always the date in India, whatever time zone the server runs in. Dates are plain YYYY-MM-DD strings.
export const todayIst = (): string => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

const dayMs = 86_400_000;
const utc = (isoDate: string) => Date.parse(`${isoDate}T00:00:00Z`);

export const daysBetween = (fromIso: string, toIso: string): number => Math.round((utc(toIso) - utc(fromIso)) / dayMs);

export const addDays = (isoDate: string, n: number): string => new Date(utc(isoDate) + n * dayMs).toISOString().slice(0, 10);

// "07:05 PM" in India time, for chat bubbles.
export function clockIst(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true }).format(d);
}
