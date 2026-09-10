-- Grants/aid the student applies against their estimate: three named grants
-- (fixed real UMD aid programs) plus up to 5 user-defined miscellaneous
-- entries. Snapshotted into the scenario at save time, same as every other
-- selection, so loading a saved scenario back reproduces the exact bill it
-- originally showed -- no separate "saved aid profile" table, grants live on
-- the dashboard and on scenarios exactly like every other field already does.
--
-- misc_grants shape: [{ "id": string, "note": string (<=50 chars), "amount": number }, ...]
-- jsonb rather than a child table -- bounded at 5 entries, never queried or
-- filtered on independently, so a normalized table would only add a
-- delete-and-reinsert-on-update dance for no real benefit (CLAUDE.md rule 5).
--
-- Per-element numeric/length bounds on misc_grants aren't enforced as a `check`
-- here -- Postgres `check` constraints can't cleanly validate inside a jsonb
-- array without a wrapper function, more machinery than this bounded,
-- non-critical data is worth. Enforced instead at the input layer and again
-- in saveScenario's server-side re-validation (same defense-in-depth spirit
-- as the existing note-length check, just not a DB constraint for this field).
--
-- The three named columns are plain scalars, so those get real `check`
-- constraints: 0 means "not entered" (the default/untouched state), anything
-- else must fall within the $1-$20,000 range the user specified.
alter table scenarios
  add column pell_grant_amount numeric(10, 2) not null default 0,
  add column terrapin_commitment_amount numeric(10, 2) not null default 0,
  add column rawlings_ea_amount numeric(10, 2) not null default 0,
  add column misc_grants jsonb not null default '[]';

alter table scenarios
  add constraint scenarios_pell_grant_range
    check (pell_grant_amount = 0 or (pell_grant_amount >= 1 and pell_grant_amount <= 20000)),
  add constraint scenarios_terrapin_commitment_range
    check (terrapin_commitment_amount = 0 or (terrapin_commitment_amount >= 1 and terrapin_commitment_amount <= 20000)),
  add constraint scenarios_rawlings_ea_range
    check (rawlings_ea_amount = 0 or (rawlings_ea_amount >= 1 and rawlings_ea_amount <= 20000)),
  add constraint scenarios_misc_grants_length
    check (jsonb_array_length(misc_grants) <= 5);
