-- A plain application-code "read the row, check it, write it back" would
-- have a real race: two concurrent requests from the same caller could both
-- read count=N and both write N+1, letting one extra request through right
-- at the cap. This function does the read-check-write as ONE atomic
-- statement (INSERT ... ON CONFLICT DO UPDATE), so Postgres's own row-level
-- locking serializes concurrent callers correctly -- no separate locking
-- code needed on the application side.
--
-- Resets the window (count back to 1) when the existing window_start is
-- older than the caller-supplied duration; otherwise increments in place.
-- Returns whether THIS request is allowed (count <= limit) after the
-- increment/reset -- the caller (rateLimit.ts) doesn't need a second query
-- to find out.
--
-- No SECURITY DEFINER -- this only ever needs to run via the service-role
-- client (already bypasses RLS on its own), so there's no reason to grant
-- this function elevated privileges beyond what its caller already has.
create or replace function check_and_consume_ai_rate_limit(
  p_identifier text,
  p_window_kind text,
  p_limit integer,
  p_duration_seconds integer
) returns boolean
language plpgsql
as $$
declare
  v_request_count integer;
begin
  insert into ai_rate_limits (identifier, window_kind, window_start, request_count)
  values (p_identifier, p_window_kind, now(), 1)
  on conflict (identifier, window_kind) do update
    set
      request_count = case
        when ai_rate_limits.window_start <= now() - make_interval(secs => p_duration_seconds) then 1
        else ai_rate_limits.request_count + 1
      end,
      window_start = case
        when ai_rate_limits.window_start <= now() - make_interval(secs => p_duration_seconds) then now()
        else ai_rate_limits.window_start
      end
  returning request_count into v_request_count;

  return v_request_count <= p_limit;
end;
$$;
