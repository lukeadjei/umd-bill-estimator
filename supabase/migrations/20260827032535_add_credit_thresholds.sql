-- Full-time credit thresholds are institution policy, not a rate that differs by
-- residency/plan/etc, so they live directly on academic_years rather than a new
-- table. Two separate columns because they're genuinely different thresholds:
-- undergrad tuition switches to a flat rate at 12 credits, but fees (both
-- undergrad and graduate) switch to their flat rate at 9 credits. Graduate
-- tuition has no full-time concept at all (always per-credit), so there's no
-- graduate tuition threshold column.

alter table academic_years
add column undergrad_tuition_full_time_credit_threshold integer not null,
add column full_time_fee_credit_threshold integer not null;
