-- Reservas: un dispositivo se reserva para un cliente con una seña, antes de
-- concretar la venta. Al vender el dispositivo, la reserva se marca como
-- convertida automáticamente (lo hace el código, no un trigger).

create type reservation_status as enum ('activa', 'convertida', 'cancelada');

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

alter table reservations enable row level security;

create policy "authenticated full access" on reservations
  for all to authenticated using (true) with check (true);
