-- ANVAY database schema. Safe to run more than once.
-- Every table has row level security switched on with NO policies: the browser/app can never read or write tables
-- directly. All access goes through the serverless API in api/, which uses the service role key and scopes every query
-- to the signed-in student.

-- ---------------------------------------------------------------- students
create table if not exists students (
  id              uuid primary key default gen_random_uuid(),
  phone           text not null unique,
  name            text not null,
  name_hi         text,
  apaar_id        text unique,
  category        text not null default 'ST',
  gender          text,
  dob             date,
  district        text,
  state           text,
  institute       text,
  course          text,
  income_annual   integer,
  photo_url       text,
  ekyc_done       boolean not null default false,
  language        text not null default 'en' check (language in ('en', 'hi')),
  -- bank + Aadhaar seeding (DBT)
  bank_name       text,
  account_last4   text,
  ifsc            text,
  aadhaar_seeded  boolean not null default false,
  npci_mapped     boolean not null default false,
  created_at      timestamptz not null default now()
);

-- ----------------------------------------------------------------- schemes
create table if not exists schemes (
  code             text primary key,
  title            text not null,
  title_hi         text,
  category         text not null check (category in ('pre', 'post', 'higher', 'fellowship', 'overseas')),
  amount_text      text not null,
  amount_value     integer,
  summary          text,
  -- simple, machine-readable rules used for the "eligible / not eligible" match
  rules            jsonb not null default '{}'::jsonb,
  documents        text[] not null default '{}',
  deadline         date,
  created_at       timestamptz not null default now()
);

-- ------------------------------------------------------------ applications
create table if not exists applications (
  id              uuid primary key default gen_random_uuid(),
  application_no  text not null unique,
  student_id      uuid not null references students (id) on delete cascade,
  scheme_code     text not null references schemes (code),
  status          text not null default 'draft'
                  check (status in ('draft', 'submitted', 'in_review', 'sanctioned', 'credited', 'rejected')),
  current_stage   integer not null default 0 check (current_stage between 0 and 6),
  residency       text check (residency in ('hostel', 'day')),
  form            jsonb not null default '{}'::jsonb,
  expected_amount integer,
  submitted_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (student_id, scheme_code)
);
create index if not exists applications_student_idx on applications (student_id);

-- six milestones per application (Submitted, Auto-verified, Institute, District, State sanction, PFMS credit)
create table if not exists application_stages (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references applications (id) on delete cascade,
  stage_no        integer not null check (stage_no between 1 and 6),
  title           text not null,
  title_hi        text,
  state           text not null default 'upcoming' check (state in ('done', 'current', 'upcoming')),
  occurred_at     timestamptz,
  detail          text,
  desk            text,
  eta             text,
  unique (application_id, stage_no)
);

-- --------------------------------------------------------------- documents
create table if not exists documents (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references students (id) on delete cascade,
  application_id  uuid references applications (id) on delete set null,
  kind            text not null,
  title           text not null,
  title_hi        text,
  issuer          text,
  status          text not null default 'pending' check (status in ('verified', 'pending', 'rejected', 'missing')),
  problems        text[] not null default '{}',
  file_path       text,
  expires_on      date,
  verified_at     timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists documents_student_idx on documents (student_id);

-- ---------------------------------------------------------------- payments
create table if not exists payments (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references students (id) on delete cascade,
  application_id  uuid references applications (id) on delete set null,
  label           text not null,
  source          text,
  amount          integer not null,
  status          text not null check (status in ('credited', 'processing', 'failed')),
  fy              text not null default '2025-26',
  paid_on         date,
  reference       text,
  failure_reason  text,
  failure_ref     text,
  created_at      timestamptz not null default now()
);
create index if not exists payments_student_idx on payments (student_id);

-- ----------------------------------------------------------- notifications
create table if not exists notifications (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references students (id) on delete cascade,
  category        text not null check (category in ('payments', 'applications', 'deadlines', 'general')),
  tone            text not null default 'blue' check (tone in ('green', 'blue', 'amber', 'red')),
  icon            text,
  title           text not null,
  body            text,
  link_label      text,
  link_to         text,
  unread          boolean not null default true,
  created_at      timestamptz not null default now()
);
create index if not exists notifications_student_idx on notifications (student_id, created_at desc);

-- -------------------------------------------------------------- grievances
create table if not exists grievances (
  id              uuid primary key default gen_random_uuid(),
  ticket_no       text not null unique,
  student_id      uuid not null references students (id) on delete cascade,
  application_id  uuid references applications (id) on delete set null,
  category        text not null,
  title           text not null,
  description     text,
  status          text not null default 'in_progress' check (status in ('in_progress', 'resolved')),
  assigned_to     text,
  progress        integer not null default 0 check (progress between 0 and 100),
  due_on          date,
  resolved_on     date,
  rating          integer check (rating between 1 and 5),
  created_at      timestamptz not null default now()
);
create index if not exists grievances_student_idx on grievances (student_id);

-- --------------------------------------------------------------- deadlines
create table if not exists deadlines (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references students (id) on delete cascade,
  kind            text not null check (kind in ('action', 'deadline', 'renewal', 'payment')),
  title           text not null,
  subtitle        text,
  due_on          date not null,
  link_to         text
);
create index if not exists deadlines_student_idx on deadlines (student_id, due_on);

-- ----------------------------------------------------------- chat messages
create table if not exists chat_messages (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references students (id) on delete cascade,
  role            text not null check (role in ('user', 'bot')),
  kind            text not null default 'text' check (kind in ('text', 'status', 'docs')),
  body            text,
  created_at      timestamptz not null default now()
);
create index if not exists chat_student_idx on chat_messages (student_id, created_at);

-- ------------------------------------------------------ lock everything down
alter table students           enable row level security;
alter table schemes            enable row level security;
alter table applications       enable row level security;
alter table application_stages enable row level security;
alter table documents          enable row level security;
alter table payments           enable row level security;
alter table notifications      enable row level security;
alter table grievances         enable row level security;
alter table deadlines          enable row level security;
alter table chat_messages      enable row level security;
