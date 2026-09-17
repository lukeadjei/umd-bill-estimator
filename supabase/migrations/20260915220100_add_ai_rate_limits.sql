-- Rate limiting state for the AI chat endpoint. A plain Postgres counter
-- table, not Redis/Upstash/Vercel KV -- chosen deliberately over adding a
-- new external service: this project already runs Supabase, the actual
-- throughput this needs to handle (a handful of increments per second at
-- realistic scale) is well within what a single row upsert handles, and
-- CLAUDE.md's own instinct throughout this project has been not to add
-- infrastructure a task doesn't actually need. Revisit only if usage ever
-- grows enough that row-level contention here becomes a real bottleneck.
--
-- identifier is "user:<uuid>" for a signed-in user or "guest:<cookie-uuid>"
-- for a guest -- deciding which applies happens in application code, not
-- here. window_kind splits per-minute and per-day enforcement into separate
-- rows (rather than one row trying to track both), each with its own
-- window_start that the app resets once the current time has moved past it.
--
-- No RLS policies at all -- service-role-only, same posture as
-- ai_parse_logs, since only the chat Route Handler should ever touch this.
create table ai_rate_limits (
  identifier text not null,
  window_kind text not null check (window_kind in ('minute', 'day')),
  window_start timestamptz not null,
  request_count integer not null default 0,
  primary key (identifier, window_kind)
);

alter table ai_rate_limits enable row level security;
