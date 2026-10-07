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
  incomeAnnual: number | null;
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
  alert: { kind: 'document' | 'seeding'; title: string; body: string; due: string | null; linkTo: 'wallet' | 'seeding' } | null;
  nextDeadline: { title: string; subtitle: string; date: string; daysLeft: number } | null;
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

export type DocItem = {
  name: string;
  kind: string | null;
  status: 'verified' | 'pending' | 'rejected' | 'missing';
  problems: string[];
  source: string | null;
};

export type ApplicationDraft = {
  id: string;
  applicationNo: string;
  status: string;
  residency: 'hostel' | 'day' | null;
  switchFrom: boolean;
  scheme: { code: string; title: string; titleHi: string | null; amountText: string; amountValue: number | null; deadline: string };
  student: Student;
  documents: DocItem[];
  ready: boolean;
};

export type SubmitResult = {
  id: string;
  applicationNo: string;
  submittedAt: string;
  reminderOn: string;
  switched: boolean;
  scheme: { code: string; title: string; titleHi: string | null };
};

export type JourneyStep = {
  n: number;
  state: 'done' | 'current' | 'upcoming' | 'final';
  title: string;
  hi: string | null;
  badge: string;
  icon: string;
  meta: string;
  desc: string;
  desk: string | null;
  eta: string | null;
};

export type JourneyData = {
  application: {
    id: string;
    applicationNo: string;
    title: string;
    titleHi: string | null;
    amount: number | null;
    academicYear: string;
    currentStage: number;
    finished: boolean;
    steps: JourneyStep[];
    expected: { days: number; date: string };
  } | null;
  bank: { name: string | null; last4: string | null; seeded: boolean };
  beneficiary: string;
};

export type DbtPayment = {
  id: string;
  label: string;
  source: string;
  amount: number;
  status: 'credited' | 'processing' | 'failed';
  date: string;
  reference: string | null;
  failureReason: string | null;
  failureRef: string | null;
};

export type DbtData = {
  fy: string;
  fys: string[];
  totalDisbursed: number;
  scholarId: string | null;
  pfmsId: string | null;
  bank: { name: string | null; last4: string | null; ifsc: string | null; seeded: boolean };
  alert: { count: number; text: string } | null;
  payments: DbtPayment[];
};

export type NotificationItem = {
  id: string;
  category: 'payments' | 'applications' | 'deadlines' | 'general';
  tone: 'green' | 'blue' | 'amber' | 'red';
  icon: string;
  title: string;
  body: string;
  linkLabel: string | null;
  linkTo: string | null;
  unread: boolean;
  createdAt: string;
};

export type NotificationsData = { unread: number; items: NotificationItem[] };

export type GrievanceItem = {
  id: string;
  ticketNo: string;
  status: 'progress' | 'resolved';
  category: string;
  title: string;
  sub: string;
  progress: number;
  due: string | null;
  detail: string;
  rating: number | null;
};

export type GrievancesData = {
  categories: string[];
  applications: { id: string; label: string }[];
  items: GrievanceItem[];
};

export type CalendarItem = {
  id: string;
  kind: 'action' | 'deadline' | 'renewal' | 'payment';
  date: string;
  title: string;
  subtitle: string;
  linkTo: string | null;
  daysLeft: number;
  group: 'This week' | 'This month' | 'Later';
  pill: string;
};

export type CalendarData = { today: string; items: CalendarItem[]; priority: CalendarItem | null };

export type ChatCard =
  | { title: string; applicationNo: string; statusLabel: string; steps: { label: string; state: 'done' | 'current' | 'todo' }[]; info: string }
  | { title: string; verified: number; total: number; items: { name: string; ok: boolean }[]; upload: string | null };

export type ChatMessage = {
  id: string;
  from: 'user' | 'bot';
  kind: 'text' | 'status' | 'docs';
  text: string | null;
  card: ChatCard | null;
  time: string;
};

export type WalletDoc = {
  id: string;
  kind: string;
  title: string;
  titleHi: string | null;
  issuer: string | null;
  status: 'verified' | 'pending' | 'rejected' | 'missing';
  problems: string[];
  hasFile: boolean;
  verifiedOn: string;
  expiresOn: string;
};
