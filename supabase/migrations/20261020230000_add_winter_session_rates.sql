-- Winter Session rates (v2). Additive only: new tables plus one new nullable
-- column. Nothing existing is altered, so saved Fall/Spring scenarios (which
-- reference rate rows by id) are untouched.
--
-- Winter is a much simpler bill than a semester: tuition is published by UMD
-- Extended Studies as a chart of the TOTAL price for 1, 2, 3 or 4 credits per
-- student level x residency (today each total happens to be N x the 1-credit
-- price, but we store the chart as published and never multiply), plus one
-- flat fee that depends on whether any class is on campus or all are online.
--
-- Two tuition tables mirror the existing undergrad/grad split (education
-- level is which table you query, not a stored value). Winter belongs to the
-- current academic year's row, so every table points at academic_years like
-- every other rate table.

create table winter_tuition_rates (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_years (id),
  residency text not null check (residency in ('resident', 'non_resident')),
  credit_hours integer not null check (credit_hours >= 1),
  price numeric(10, 2) not null,
  unique (academic_year_id, residency, credit_hours)
);

create table winter_graduate_tuition_rates (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_years (id),
  residency text not null check (residency in ('resident', 'non_resident')),
  credit_hours integer not null check (credit_hours >= 1),
  price numeric(10, 2) not null,
  unique (academic_year_id, residency, credit_hours)
);

-- One row per academic year. campus_services_rate is charged when any class
-- requires being on campus (even alongside online classes);
-- distance_learning_rate only when every class is online/off-site. Same
-- amounts for undergrad and grad.
create table winter_fees (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_years (id) unique,
  campus_services_rate numeric(10, 2) not null,
  distance_learning_rate numeric(10, 2) not null
);

-- Staging twins (CLAUDE.md rule 6): the scraper only ever writes here; a
-- reviewed promotion step copies into the live tables. Same columns plus
-- scraped_at, no unique constraints (matches the existing staging tables --
-- they're cleared before every scrape).

create table winter_tuition_rates_staging (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_years (id),
  residency text not null check (residency in ('resident', 'non_resident')),
  credit_hours integer not null check (credit_hours >= 1),
  price numeric(10, 2) not null,
  scraped_at timestamptz not null default now()
);

create table winter_graduate_tuition_rates_staging (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_years (id),
  residency text not null check (residency in ('resident', 'non_resident')),
  credit_hours integer not null check (credit_hours >= 1),
  price numeric(10, 2) not null,
  scraped_at timestamptz not null default now()
);

create table winter_fees_staging (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_years (id),
  campus_services_rate numeric(10, 2) not null,
  distance_learning_rate numeric(10, 2) not null,
  scraped_at timestamptz not null default now()
);

-- Row Level Security. Live rate tables: public read, no write policies (same
-- as every other rate table). Staging tables: RLS on with zero policies, so
-- only the service role (scraper) and Supabase Studio can touch them.

alter table winter_tuition_rates enable row level security;
alter table winter_graduate_tuition_rates enable row level security;
alter table winter_fees enable row level security;
alter table winter_tuition_rates_staging enable row level security;
alter table winter_graduate_tuition_rates_staging enable row level security;
alter table winter_fees_staging enable row level security;

create policy "winter_tuition_rates are publicly readable" on winter_tuition_rates for select using (true);
create policy "winter_graduate_tuition_rates are publicly readable" on winter_graduate_tuition_rates for select using (true);
create policy "winter_fees are publicly readable" on winter_fees for select using (true);

-- Winter's maximum credit load. A hand-set policy number, NOT scraped: it
-- appears on no page the scraper reads, and it is deliberately kept out of the
-- scrape -> staging -> promote path (there is no staging column for it). If it
-- were staged, a scrape run by a not-yet-redeployed Lambda would stage a row
-- without it, and the next promote would write null into live, silently hiding
-- Winter. Nullable on purpose: null means "no winter configured for this
-- year", which is how the app knows to hide the Winter option (e.g. right
-- after a rollover, before winter rates are published).
alter table academic_years
  add column winter_max_credit_hours integer check (winter_max_credit_hours >= 1);

-- Seed the current year. UMD's winter chart covers 1-4 credits.
update academic_years set winter_max_credit_hours = 4 where label = '2026-2027';
