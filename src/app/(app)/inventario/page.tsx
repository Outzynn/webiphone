import { Plus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/link-button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { InventarioTable, type InventarioRow } from "@/components/inventario-table";
import type { DeviceStatus } from "@/lib/database.types";

const VALID_STATUSES: DeviceStatus[] = ["in_stock", "reserved", "sold"];

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("devices")
    .select(
      "id, model, storage_gb, color, condition, imei, status, battery_health_pct, list_price_amount, list_price_currency, purchases(cost_amount, cost_currency)",
    )
    .order("created_at", { ascending: false });

  if (status && VALID_STATUSES.includes(status as DeviceStatus)) {
    query = query.eq("status", status as DeviceStatus);
  }
  if (q) query = query.or(`imei.ilike.%${q}%,model.ilike.%${q}%`);

  const { data: devices, error } = await query;

  const rows: InventarioRow[] = (devices ?? []).map((d) => ({
    id: d.id,
    model: d.model,
    storageGb: d.storage_gb,
    color: d.color,
    condition: d.condition,
    imei: d.imei,
    status: d.status,
    batteryHealthPct: d.battery_health_pct,
    costAmount: d.purchases?.cost_amount ?? null,
    costCurrency: d.purchases?.cost_currency ?? null,
    listPriceAmount: d.list_price_amount,
    listPriceCurrency: d.list_price_currency,
  }));

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Inventario</h1>
        <LinkButton href="/inventario/nuevo">
          <Plus className="h-4 w-4" />
          Nuevo dispositivo
        </LinkButton>
      </div>

      <Card>
        <CardContent className="pt-4">
          <form className="mb-4 flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                placeholder="Buscar por IMEI o modelo..."
                defaultValue={q}
                className="pl-8"
              />
            </div>
            <select
              name="status"
              defaultValue={status ?? ""}
              className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            >
              <option value="">Todos los estados</option>
              <option value="in_stock">En stock</option>
              <option value="reserved">Reservado</option>
              <option value="sold">Vendido</option>
            </select>
            <Button type="submit" variant="secondary">
              Filtrar
            </Button>
          </form>

          {error ? (
            <p className="text-sm text-destructive">
              Error cargando el inventario: {error.message}
            </p>
          ) : null}

          <InventarioTable rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
