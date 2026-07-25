-- app_settings.value no debería exigir NOT NULL: la cotización manual no
-- siempre tiene un valor (cuando la fuente es blue/oficial). El código ya no
-- envía null explícito, pero se relaja la columna igual por robustez.

alter table app_settings alter column value drop not null;
