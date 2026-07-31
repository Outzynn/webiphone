-- Schema para el sistema de gestión de compra/venta de iPhones.
-- Ejecutar completo en el SQL Editor de Supabase (Project > SQL Editor > New query).

create extension if not exists pgcrypto;

-- ── Enums ──────────────────────────────────────────────────────────────────

create type device_condition as enum ('nuevo', 'usado');
create type device_status as enum ('in_stock', 'reserved', 'sold');
create type currency_code as enum ('USD', 'ARS');
create type payment_type as enum ('contado', 'cuotas');
create type warranty_status as enum ('abierto', 'en_reparacion', 'resuelto');
create type reservation_status as enum ('activa', 'convertida', 'cancelada');

-- ── Tablas base ────────────────────────────────────────────────────────────

create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  document_id text,
  notes text,
  created_at timestamptz not null default now()
);

create table suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

create table devices (
  id uuid primary key default gen_random_uuid(),
  model text not null,
  storage_gb integer,
  color text,
  condition device_condition not null,
  grade text check (grade in ('A', 'B', 'C')),
  battery_health_pct smallint check (battery_health_pct between 0 and 100),
  imei text not null unique,
  serial_number text,
  status device_status not null default 'in_stock',
  list_price_amount numeric(12, 2) check (list_price_amount >= 0),
  list_price_currency currency_code,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index devices_status_idx on devices (status);
create index devices_model_idx on devices (model);

create table device_photos (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references devices (id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index device_photos_device_id_idx on device_photos (device_id);

-- ── Compras / ventas ─────────────────────────────────────────────────────

create table purchases (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null unique references devices (id) on delete cascade,
  supplier_id uuid references suppliers (id) on delete set null,
  -- si el equipo entró por plan canje, qué cliente lo entregó (en vez de un proveedor)
  trade_in_client_id uuid references clients (id) on delete set null,
  purchase_date date not null default current_date,
  cost_amount numeric(12, 2) not null check (cost_amount >= 0),
  cost_currency currency_code not null,
  exchange_rate_snapshot numeric(12, 4),
  notes text,
  created_at timestamptz not null default now()
);

create index purchases_purchase_date_idx on purchases (purchase_date);
create index purchases_supplier_id_idx on purchases (supplier_id);
create index purchases_trade_in_client_id_idx on purchases (trade_in_client_id);

create table sales (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null unique references devices (id) on delete cascade,
  client_id uuid references clients (id) on delete set null,
  sale_date date not null default current_date,
  sale_amount numeric(12, 2) not null check (sale_amount >= 0),
  sale_currency currency_code not null,
  exchange_rate_snapshot numeric(12, 4),
  payment_type payment_type not null default 'contado',
  -- plan canje: equipo recibido del cliente como parte de pago (se carga a inventario aparte)
  trade_in_device_id uuid references devices (id) on delete set null,
  trade_in_value_amount numeric(12, 2) check (trade_in_value_amount >= 0),
  trade_in_value_currency currency_code,
  notes text,
  created_at timestamptz not null default now()
);

create index sales_sale_date_idx on sales (sale_date);
create index sales_client_id_idx on sales (client_id);
create index sales_trade_in_device_id_idx on sales (trade_in_device_id);

create table installments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales (id) on delete cascade,
  installment_number integer not null,
  due_date date not null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency currency_code not null,
  paid boolean not null default false,
  paid_date date,
  created_at timestamptz not null default now(),
  unique (sale_id, installment_number)
);

create index installments_sale_id_idx on installments (sale_id);

create table reservations (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null unique references devices (id) on delete cascade,
  client_id uuid references clients (id) on delete set null,
  reservation_date date not null default current_date,
  deposit_amount numeric(12, 2) not null check (deposit_amount >= 0),
  deposit_currency currency_code not null,
  status reservation_status not null default 'activa',
  notes text,
  created_at timestamptz not null default now()
);

create index reservations_client_id_idx on reservations (client_id);
create index reservations_status_idx on reservations (status);

create table warranty_claims (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references devices (id) on delete cascade,
  client_id uuid references clients (id) on delete set null,
  claim_date date not null default current_date,
  description text not null,
  status warranty_status not null default 'abierto',
  resolution_notes text,
  resolved_date date,
  created_at timestamptz not null default now()
);

create index warranty_claims_device_id_idx on warranty_claims (device_id);
create index warranty_claims_status_idx on warranty_claims (status);

-- ── updated_at trigger para devices ────────────────────────────────────────

create function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger devices_set_updated_at
  before update on devices
  for each row execute function set_updated_at();

-- ── Configuración de la app (clave/valor) ───────────────────────────────────
-- Guarda cosas como la fuente de cotización preferida y el tamaño de etiqueta.

create table app_settings (
  key text primary key,
  value jsonb
);

insert into app_settings (key, value) values
  ('exchange_rate_source', '"blue"'),
  ('manual_exchange_rate', 'null'),
  ('label_size_mm', '{"width": 40, "height": 30}'),
  ('base_currency', '"USD"');

-- ── Row Level Security ─────────────────────────────────────────────────────
-- Los 4 usuarios comparten el mismo rol: cualquier usuario autenticado puede
-- leer y escribir todo (no hay permisos diferenciados).

alter table clients enable row level security;
alter table suppliers enable row level security;
alter table devices enable row level security;
alter table device_photos enable row level security;
alter table purchases enable row level security;
alter table sales enable row level security;
alter table installments enable row level security;
alter table reservations enable row level security;
alter table warranty_claims enable row level security;
alter table app_settings enable row level security;

create policy "authenticated full access" on clients
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on suppliers
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on devices
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on device_photos
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on purchases
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on sales
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on installments
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on reservations
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on warranty_claims
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on app_settings
  for all to authenticated using (true) with check (true);

-- ── Storage: fotos de dispositivos ─────────────────────────────────────────
-- Crear el bucket "device-photos" (privado) desde Storage > New bucket antes
-- de correr esto, o descomentar la siguiente línea si preferís crearlo por SQL:
-- insert into storage.buckets (id, name, public) values ('device-photos', 'device-photos', false);

create policy "authenticated read device photos" on storage.objects
  for select to authenticated using (bucket_id = 'device-photos');
create policy "authenticated upload device photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'device-photos');
create policy "authenticated update device photos" on storage.objects
  for update to authenticated using (bucket_id = 'device-photos');
create policy "authenticated delete device photos" on storage.objects
  for delete to authenticated using (bucket_id = 'device-photos');
