// Shapes returned by the API (see api/_lib/mappers.ts and api/home.ts).
export type Student = {
  id: string;
  phone: string;
  name: string;
  nameHi: string | null;
  initials: string;
  apaarId: string | null;
  category: string;
  gender: string | null;
  dob: string;
  district: string | null;
  state: string | null;
  districtHi: string | null;
  stateHi: string | null;
  institute: string | null;
  course: string | null;
  ekycDone: boolean;
  language: 'en' | 'hi';
  bank: { name: string | null; last4: string | null; ifsc: string | null; aadhaarSeeded: boolean; npciMapped: boolean };
};

export type HomeStep = { key: string; label: string; sub: string; state: 'done' | 'current' | 'todo' };

export type HomeData = {
  student: Student;
  application: {
    id: string;
    applicationNo: string;
    schemeCode: string;
    title: string;
    titleHi: string | null;
    amount: number | null;
    currentStage: number;
    statusLabel: string;
    steps: HomeStep[];
  } | null;
  unreadCount: number;
};

export type OtpKind = 'mobile' | 'aadhaar';
export type SignInResult = { token: string; student: Student };

export type SchemeCheck = { key: string; label: string; ok: boolean };
export type SchemeStatus = 'enrolled' | 'eligible' | 'not_eligible';
export type SchemeCategory = 'pre' | 'post' | 'higher' | 'fellowship' | 'overseas';

export type SchemeItem = {
  code: string;
  title: string;
  titleHi: string | null;
  category: SchemeCategory;
  amountText: string;
  amountValue: number | null;
  summary: string | null;
  deadline: string;
  daysLeft: number | null;
  status: SchemeStatus;
  reason: string | null;
  matched: number;
  total: number;
  checks: SchemeCheck[];
  applicationId: string | null;
  applicationStatus: string | null;
};

export type SchemesData = {
  summary: { total: number; active: number; eligible: number; ineligible: number };
  schemes: SchemeItem[];
};

export type SchemeDetail = SchemeItem & {
  documents: { name: string; status: string }[];
  bank: { name: string | null; last4: string | null; seeded: boolean };
  application: { id: string; status: string; currentStage: number } | null;
};
