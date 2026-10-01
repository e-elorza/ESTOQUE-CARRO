-- Initial schema for the white-label dealership site.
-- Apply with the Supabase CLI (`supabase db push`) or paste into the SQL editor.

create extension if not exists "pgcrypto";

-- Enums ---------------------------------------------------------------------

create type transmission as enum ('manual', 'automatico', 'cvt', 'automatizado');
create type fuel as enum ('flex', 'gasolina', 'diesel', 'hibrido', 'eletrico');
create type body_type as enum ('hatch', 'seda', 'suv', 'picape', 'minivan', 'cupe', 'conversivel');
create type vehicle_status as enum ('disponivel', 'reservado', 'vendido', 'rascunho');
create type lead_type as enum ('financiamento', 'troca', 'proposta', 'visita', 'contato');
create type lead_status as enum ('novo', 'em_contato', 'negociacao', 'fechado', 'perdido');
create type site_theme as enum ('light', 'dark');

-- Staff ---------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);

create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid());
$$;

-- Dealership settings (single row) -------------------------------------------

create table dealership_settings (
  id boolean primary key default true check (id), -- enforces a single row
  name text not null,
  code_prefix text not null default 'VA' check (code_prefix ~ '^[A-Z]{1,4}$'),
  logo_url text,
  accent_color text not null default '#1f3fbf' check (accent_color ~ '^#[0-9a-fA-F]{6}$'),
  theme site_theme not null default 'light',
  whatsapp text not null check (whatsapp ~ '^\d{12,13}$'),
  phone text not null check (phone ~ '^\d{12,13}$'),
  email text not null,
  instagram text,
  facebook text,
  seo_title text not null,
  seo_description text not null,
  about text not null default '',
  year_founded int,
  reasons jsonb not null default '[]'::jsonb,
  site_url text not null,
  updated_at timestamptz not null default now()
);

-- Locations -------------------------------------------------------------------

create table locations (
  id text primary key,
  name text not null,
  street text not null,
  district text not null,
  city text not null,
  state char(2) not null,
  cep text not null,
  phone text,
  whatsapp text,
  maps_url text,
  hours jsonb not null default '[]'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Vehicles --------------------------------------------------------------------

create sequence vehicle_code_seq start 140;

create table vehicles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  slug text not null unique,
  brand text not null,
  model text not null,
  version text not null default '',
  year_manufacture int not null check (year_manufacture between 1950 and 2100),
  year_model int not null check (year_model between year_manufacture and year_manufacture + 1),
  mileage_km int not null check (mileage_km >= 0),
  transmission transmission not null,
  fuel fuel not null,
  body_type body_type not null,
  color text not null,
  doors smallint not null default 4,
  engine text,
  power_cv int,
  plate_final smallint check (plate_final between 0 and 9),
  price int not null check (price > 0),
  promo_price int check (promo_price is null or (promo_price > 0 and promo_price < price)),
  status vehicle_status not null default 'rascunho',
  featured boolean not null default false,
  badges text[] not null default '{}',
  location_id text references locations (id) on delete set null,
  description text not null default '',
  equipment text[] not null default '{}',
  sold_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index vehicles_listing_idx on vehicles (status, created_at desc);
create index vehicles_brand_model_idx on vehicles (brand, model);

create table vehicle_photos (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles (id) on delete cascade,
  position int not null default 0,
  path_thumb text not null,
  path_card text not null,
  path_full text not null,
  width int not null,
  height int not null,
  alt text not null default '',
  created_at timestamptz not null default now()
);

create index vehicle_photos_vehicle_idx on vehicle_photos (vehicle_id, position);

-- Leads -------------------------------------------------------------------

create table leads (
  id uuid primary key default gen_random_uuid(),
  type lead_type not null,
  status lead_status not null default 'novo',
  name text not null,
  phone text not null,
  email text,
  vehicle_id uuid references vehicles (id) on delete set null,
  vehicle_code text,
  details jsonb not null default '{}'::jsonb,
  consent_at timestamptz not null default now(),
  consent_version text not null,
  source_url text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_inbox_idx on leads (status, created_at desc);

-- Anonymous WhatsApp click counter (no personal data)
create table whatsapp_clicks (
  id bigint generated always as identity primary key,
  vehicle_id uuid references vehicles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index whatsapp_clicks_vehicle_idx on whatsapp_clicks (vehicle_id, created_at desc);

-- Form rate limiting (hashed key, no raw IP stored)
create table rate_limits (
  key_hash text not null,
  created_at timestamptz not null default now()
);

create index rate_limits_idx on rate_limits (key_hash, created_at desc);

-- updated_at triggers -----------------------------------------------------------

create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger vehicles_touch before update on vehicles for each row execute function touch_updated_at();
create trigger leads_touch before update on leads for each row execute function touch_updated_at();
create trigger settings_touch before update on dealership_settings for each row execute function touch_updated_at();

-- Row Level Security ------------------------------------------------------------
-- Public: read published content only. Leads, clicks and rate limits are written by
-- the server with the service role key, never directly from the browser.

alter table profiles enable row level security;
alter table dealership_settings enable row level security;
alter table locations enable row level security;
alter table vehicles enable row level security;
alter table vehicle_photos enable row level security;
alter table leads enable row level security;
alter table whatsapp_clicks enable row level security;
alter table rate_limits enable row level security;

create policy "public reads settings" on dealership_settings for select using (true);
create policy "public reads locations" on locations for select using (true);
create policy "public reads published vehicles" on vehicles for select using (status <> 'rascunho' or is_staff());
create policy "public reads photos of published vehicles" on vehicle_photos for select using (
  exists (select 1 from vehicles v where v.id = vehicle_id and (v.status <> 'rascunho' or is_staff()))
);

create policy "staff reads own profile" on profiles for select using (id = auth.uid());
create policy "staff manages settings" on dealership_settings for all using (is_staff()) with check (is_staff());
create policy "staff manages locations" on locations for all using (is_staff()) with check (is_staff());
create policy "staff manages vehicles" on vehicles for all using (is_staff()) with check (is_staff());
create policy "staff manages photos" on vehicle_photos for all using (is_staff()) with check (is_staff());
create policy "staff manages leads" on leads for all using (is_staff()) with check (is_staff());
create policy "staff reads clicks" on whatsapp_clicks for select using (is_staff());

-- Storage bucket for vehicle photos (public read, staff write) ----------------------

insert into storage.buckets (id, name, public) values ('vehicle-photos', 'vehicle-photos', true)
on conflict (id) do nothing;

create policy "staff uploads photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'vehicle-photos' and is_staff());
create policy "staff deletes photos" on storage.objects for delete to authenticated
  using (bucket_id = 'vehicle-photos' and is_staff());
