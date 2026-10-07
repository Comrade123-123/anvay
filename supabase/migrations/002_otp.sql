-- One row per mobile number holds the latest OTP that was sent (only a keyed hash of it, never the code itself),
-- how many wrong tries it has had, and the send counters used to stop SMS abuse.
create table if not exists otp_codes (
  phone         text primary key,
  code_hash     text not null,
  expires_at    timestamptz not null,
  attempts      integer not null default 0,
  last_sent_at  timestamptz not null default now(),
  window_start  timestamptz not null default now(),
  window_count  integer not null default 1
);

-- same lock-down as every other table: only the server (service role) can read or write it
alter table otp_codes enable row level security;
