-- Explicit "current academic year" flag, rather than inferring it from
-- label sort order. Enables getRatesBundle() to resolve the default year
-- deterministically once more than one academic_years row exists.
alter table academic_years
  add column is_current boolean not null default false;

-- At most one current year at a time -- app code shouldn't have to guess
-- which row wins if two were ever marked true by mistake.
create unique index academic_years_one_current_idx
  on academic_years (is_current)
  where is_current;

-- Mark the existing (only) row as current.
update academic_years set is_current = true where label = '2026-2027';
