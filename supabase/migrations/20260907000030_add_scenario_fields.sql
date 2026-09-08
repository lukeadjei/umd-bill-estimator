-- Extends scenarios to match everything the dashboard actually collects.
-- Three real gaps found comparing this table against the live Selections
-- type: no way to record which semester a saved computed_total is for
-- (calculateTotal is one-semester-at-a-time, so this was ambiguous), no way
-- to reference graduate tuition at all (tuition_rate_id only ever pointed at
-- the undergrad table), and no column for health insurance whatsoever.
--
-- tuition_rate_id becomes nullable to pair with the new
-- graduate_tuition_rate_id -- exactly one of the two is set per scenario,
-- enforced in application code (the save Server Action), not a CHECK
-- constraint, matching the existing resident/block dining pattern already
-- established in the init migration's own comment.
--
-- Table is empty (no scenarios saved yet -- save flow didn't exist until
-- now), so no backfill/default-value concerns for the new NOT NULL column.

alter table scenarios
  add column semester text not null,
  add column graduate_tuition_rate_id uuid references graduate_tuition_rates (id),
  add column insurance_selected boolean not null default false;

alter table scenarios
  alter column tuition_rate_id drop not null;
