-- Precio de venta (al consumidor final) por dispositivo, para armar listas
-- de precios rápido, separado del monto real de una venta ya concretada.

alter table devices
  add column list_price_amount numeric(12, 2) check (list_price_amount >= 0),
  add column list_price_currency currency_code;
