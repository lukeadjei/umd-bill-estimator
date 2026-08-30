-- Staging tables for the scraper (CLAUDE.md rule 6): scraped values land here
-- first, get reviewed by a human, then a promotion step copies them into the
-- live tables the app actually reads from. Never written to directly by the app.
--
-- academic_years_staging is the one exception to the pattern: every other
-- staging table mirrors its live table's exact columns (since promotion there
-- means inserting a brand-new row). academic_years is the anchor every other
-- table's academic_year_id points to, so it must already exist before anything
-- else can be staged -- its "staging" proposes updated threshold values for an
-- EXISTING year (promotion = update), not a new row, so it has no label column.

create table academic_years_staging (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_years (id),
  undergrad_tuition_full_time_credit_threshold integer not null,
  full_time_fee_credit_threshold integer not null,
  scraped_at timestamptz not null default now()
);

create table tuition_rates_staging (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_years (id),
  residency text not null check (residency in ('resident', 'non_resident')),
  full_time_rate numeric(10, 2) not null,
  per_credit_rate numeric(10, 2) not null,
  scraped_at timestamptz not null default now()
);

create table mandatory_fees_staging (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_years (id),
  part_time_rate numeric(10, 2) not null,
  full_time_rate numeric(10, 2) not null,
  scraped_at timestamptz not null default now()
);

create table differential_tuition_staging (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_years (id),
  full_time_rate numeric(10, 2) not null,
  per_credit_rate numeric(10, 2) not null,
  scraped_at timestamptz not null default now()
);

create table housing_rates_staging (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_years (id),
  room_type text not null,
  building_category text not null,
  rate numeric(10, 2) not null,
  scraped_at timestamptz not null default now()
);

create table resident_dining_plans_staging (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_years (id),
  plan_name text not null,
  dining_dollars numeric(10, 2) not null,
  guest_passes integer not null,
  fall_price numeric(10, 2) not null,
  spring_price numeric(10, 2) not null,
  scraped_at timestamptz not null default now()
);

create table block_dining_plans_staging (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_years (id),
  plan_label text not null,
  meal_count integer not null,
  dining_dollars numeric(10, 2) not null,
  price numeric(10, 2) not null,
  scraped_at timestamptz not null default now()
);

create table parking_permits_staging (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_years (id),
  permit_type text not null,
  term text not null check (term in ('annual', 'fall', 'spring', 'summer')),
  price numeric(10, 2) not null,
  scraped_at timestamptz not null default now()
);

create table graduate_tuition_rates_staging (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_years (id),
  residency text not null check (residency in ('resident', 'non_resident')),
  per_credit_rate numeric(10, 2) not null,
  scraped_at timestamptz not null default now()
);

create table graduate_fees_staging (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_years (id),
  part_time_rate numeric(10, 2) not null,
  full_time_rate numeric(10, 2) not null,
  scraped_at timestamptz not null default now()
);

create table health_insurance_rates_staging (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_years (id),
  fall_price numeric(10, 2) not null,
  spring_price numeric(10, 2) not null,
  scraped_at timestamptz not null default now()
);

-- Row Level Security: staging tables are never touched by the public app at
-- all, in either direction. Only the scraper (service_role) and the developer
-- (Supabase Studio, which uses admin access and bypasses RLS) ever read or
-- write these. RLS enabled with zero policies means the public/authenticated
-- role is denied everything by default -- no read, no write.

alter table academic_years_staging enable row level security;
alter table tuition_rates_staging enable row level security;
alter table mandatory_fees_staging enable row level security;
alter table differential_tuition_staging enable row level security;
alter table housing_rates_staging enable row level security;
alter table resident_dining_plans_staging enable row level security;
alter table block_dining_plans_staging enable row level security;
alter table parking_permits_staging enable row level security;
alter table graduate_tuition_rates_staging enable row level security;
alter table graduate_fees_staging enable row level security;
alter table health_insurance_rates_staging enable row level security;
