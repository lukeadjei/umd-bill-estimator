-- Lets a saved scenario be a Winter Session estimate. Follows the same pattern
-- as fall/spring: a scenario stores the ID of the rate row it was priced from
-- (never a copy of the price), and only the fields relevant to winter. A winter
-- scenario sets semester = 'winter', credit_hours, exactly one of the two winter
-- tuition ids (which also identifies education level, residency and credit
-- count), and winter_class_format; every fall/spring-only id stays null.
--
-- "Exactly one of the two winter tuition ids" is enforced in application code
-- (the save Server Action), matching the existing tuition_rate_id /
-- graduate_tuition_rate_id rule and the resident/block dining rule.
--
-- Additive: new nullable columns, so every existing fall/spring scenario stays
-- valid unchanged.

alter table scenarios
  add column winter_tuition_rate_id uuid references winter_tuition_rates (id),
  add column winter_graduate_tuition_rate_id uuid references winter_graduate_tuition_rates (id),
  -- Which flat winter fee the student chose: any in-person class -> campus
  -- services fee; only online classes -> distance learning fee. Null for
  -- fall/spring scenarios. Matches Selections.winterClassFormat.
  add column winter_class_format text check (winter_class_format in ('in_person', 'online_only'));

-- Winter has no living situation (no housing, dining or parking), so a winter
-- scenario has nothing to put here. Dropping NOT NULL only relaxes the column --
-- every existing row already has a value, and the on_campus/commuter check
-- constraint still applies to any value that IS stored. Fall/spring scenarios
-- are still required to set it by validateSelections and the save action.
alter table scenarios
  alter column living_situation drop not null;
