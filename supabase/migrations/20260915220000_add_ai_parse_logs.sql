-- Debugging log for the AI natural-language input feature (step 11). Stores
-- one row per chat turn: what the user typed, what the model's tool call
-- produced, and whether it passed verification -- enough to diagnose a bad
-- parse without keeping a running transcript. Deliberately NOT related to
-- scenarios/academic_years -- this is operational/debugging data, not
-- billing data, so it gets its own isolated table rather than a column
-- bolted onto something else (CLAUDE.md rule 5).
--
-- user_id is nullable and ON DELETE SET NULL on purpose: a guest's logs stay
-- fully anonymous (never had a user_id to begin with), and a signed-in
-- user's logs lose the identifying link if they delete their account rather
-- than being deleted outright -- debugging value outlives the account, but
-- the identity tie shouldn't.
--
-- No RLS policies at all (not even a read policy) -- this table is
-- service-role-only by design, same posture as scenarios' write path,
-- but stricter since there's no legitimate reason for any client-side
-- request (authenticated or not) to ever read this table directly.
--
-- Retention: rows are meant to be short-lived (14-30 days), per the
-- documented privacy design -- pruning old rows is a separate scheduled job,
-- not yet built as of this migration. Tracked as a follow-up, not forgotten.
create table ai_parse_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users (id) on delete set null,
  provider text not null,
  user_message text not null,
  tool_call_output jsonb,
  validation_errors text[],
  latency_ms integer,
  success boolean not null default true,
  error_message text
);

alter table ai_parse_logs enable row level security;
