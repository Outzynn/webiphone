-- Plan canje: agrega el equipo recibido y su valor a las ventas, y el
-- cliente de origen a las compras (cuando el equipo entró por canje).
-- Ejecutar en el SQL Editor de Supabase sobre un proyecto que ya tiene
-- el schema.sql original cargado.

alter table purchases
  add column trade_in_client_id uuid references clients (id) on delete set null;

create index purchases_trade_in_client_id_idx on purchases (trade_in_client_id);

alter table sales
  add column trade_in_device_id uuid references devices (id) on delete set null,
  add column trade_in_value_amount numeric(12, 2) check (trade_in_value_amount >= 0),
  add column trade_in_value_currency currency_code;

create index sales_trade_in_device_id_idx on sales (trade_in_device_id);
