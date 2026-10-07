import { ddmmyyyy } from './format';

// Database rows use snake_case; the app uses camelCase. Keeping the translation in one place means screens never see
// raw column names.
export function toStudent(row: any) {
  return {
    id: row.id as string,
    phone: row.phone as string,
    name: row.name as string,
    nameHi: (row.name_hi ?? null) as string | null,
    initials: String(row.name ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .map((w: string) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase(),
    apaarId: (row.apaar_id ?? null) as string | null,
    category: row.category as string,
    gender: (row.gender ?? null) as string | null,
    dob: ddmmyyyy(row.dob ? `${row.dob}T00:00:00+05:30` : null),
    district: (row.district ?? null) as string | null,
    state: (row.state ?? null) as string | null,
    districtHi: (row.district_hi ?? null) as string | null,
    stateHi: (row.state_hi ?? null) as string | null,
    institute: (row.institute ?? null) as string | null,
    course: (row.course ?? null) as string | null,
    ekycDone: Boolean(row.ekyc_done),
    language: row.language as 'en' | 'hi',
    bank: {
      name: (row.bank_name ?? null) as string | null,
      last4: (row.account_last4 ?? null) as string | null,
      ifsc: (row.ifsc ?? null) as string | null,
      aadhaarSeeded: Boolean(row.aadhaar_seeded),
      npciMapped: Boolean(row.npci_mapped),
    },
  };
}

export type Student = ReturnType<typeof toStudent>;
