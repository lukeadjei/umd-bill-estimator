-- Initial schema: academic_years + 10 reference/rate tables + scenarios.
-- Reference tables are populated by a reviewed, staged data-loading process
-- (not by this migration, not directly by the app) -- see CLAUDE.md rule 6.

create table academic_years (
  id uuid primary key default gen_random_uuid(),
  label text not null
);

create table tuition_rates (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_years (id),
  residency text not null check (residency in ('resident', 'non_resident')),
  full_time_rate numeric(10, 2) not null,
  per_credit_rate numeric(10, 2) not null
);

create table mandatory_fees (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_years (id),
  part_time_rate numeric(10, 2) not null,
  full_time_rate numeric(10, 2) not null
);

create table differential_tuition (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_years (id),
  full_time_rate numeric(10, 2) not null,
  per_credit_rate numeric(10, 2) not null
);

create table housing_rates (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_years (id),
  room_type text not null,
  building_category text not null,
  rate numeric(10, 2) not null
);

create table resident_dining_plans (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_years (id),
  plan_name text not null,
  dining_dollars numeric(10, 2) not null,
  guest_passes integer not null,
  fall_price numeric(10, 2) not null,
  spring_price numeric(10, 2) not null
);

create table block_dining_plans (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_years (id),
  plan_label text not null,
  meal_count integer not null,
  dining_dollars numeric(10, 2) not null,
  price numeric(10, 2) not null
);

create table parking_permits (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_years (id),
  permit_type text not null,
  term text not null check (term in ('annual', 'fall', 'spring', 'summer')),
  price numeric(10, 2) not null
);

create table graduate_tuition_rates (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_years (id),
  residency text not null check (residency in ('resident', 'non_resident')),
  per_credit_rate numeric(10, 2) not null
);

create table graduate_fees (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_years (id),
  part_time_rate numeric(10, 2) not null,
  full_time_rate numeric(10, 2) not null
);

create table health_insurance_rates (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_years (id),
  fall_price numeric(10, 2) not null,
  spring_price numeric(10, 2) not null
);

create table scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  academic_year_id uuid not null references academic_years (id),
  major text,
  credit_hours integer not null,
  applies_differential_tuition boolean not null default false,
  tuition_rate_id uuid not null references tuition_rates (id),
  housing_rate_id uuid references housing_rates (id),
  resident_dining_plan_id uuid references resident_dining_plans (id),
  block_dining_plan_id uuid references block_dining_plans (id),
  parking_permit_id uuid references parking_permits (id),
  -- A scenario should never have both dining plan types set. Deliberately not
  -- a CHECK constraint -- enforced in application code instead (CLAUDE.md rule 4/6).
  computed_total numeric(10, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function set_updated_at ()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger scenarios_set_updated_at
  before update on scenarios
  for each row
  execute function set_updated_at ();

-- Row Level Security
--
-- Reference/rate tables: publicly readable (anyone estimating a bill needs
-- these, even before signing in). No public write policies -- rows are only
-- ever written by an admin/service-role data-loading process, never by users
-- or the app's client-side code.
--
-- scenarios: owner-only reads. No public write policies at all -- every
-- create/update/delete must go through a Next.js Server Action running with
-- the service_role key, so every write passes through calculateTotal /
-- validateSelections first. See conversation log / docs for the reasoning.

alter table academic_years enable row level security;
alter table tuition_rates enable row level security;
alter table mandatory_fees enable row level security;
alter table differential_tuition enable row level security;
alter table housing_rates enable row level security;
alter table resident_dining_plans enable row level security;
alter table block_dining_plans enable row level security;
alter table parking_permits enable row level security;
alter table graduate_tuition_rates enable row level security;
alter table graduate_fees enable row level security;
alter table health_insurance_rates enable row level security;
alter table scenarios enable row level security;

create policy "academic_years are publicly readable" on academic_years for select using (true);
create policy "tuition_rates are publicly readable" on tuition_rates for select using (true);
create policy "mandatory_fees are publicly readable" on mandatory_fees for select using (true);
create policy "differential_tuition is publicly readable" on differential_tuition for select using (true);
create policy "housing_rates are publicly readable" on housing_rates for select using (true);
create policy "resident_dining_plans are publicly readable" on resident_dining_plans for select using (true);
create policy "block_dining_plans are publicly readable" on block_dining_plans for select using (true);
create policy "parking_permits are publicly readable" on parking_permits for select using (true);
create policy "graduate_tuition_rates are publicly readable" on graduate_tuition_rates for select using (true);
create policy "graduate_fees are publicly readable" on graduate_fees for select using (true);
create policy "health_insurance_rates are publicly readable" on health_insurance_rates for select using (true);

create policy "users can read their own scenarios" on scenarios for select using (auth.uid () = user_id);
