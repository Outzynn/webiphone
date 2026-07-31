import { Plus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSettings, resolveCurrentExchangeRate } from "@/lib/settings";
import { toBaseCurrency } from "@/lib/currency";
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
      "id, model, storage_gb, color, condition, grade, imei, status, battery_health_pct, list_price_amount, list_price_currency, purchases(cost_amount, cost_currency)",
    )
    .order("created_at", { ascending: false });

  if (status && VALID_STATUSES.includes(status as DeviceStatus)) {
    query = query.eq("status", status as DeviceStatus);
  }
  if (q) query = query.or(`imei.ilike.%${q}%,model.ilike.%${q}%`);

  const { data: devices, error } = await query;

  const settings = await getSettings();
  let currentRate = 0;
  try {
    currentRate = await resolveCurrentExchangeRate(settings);
  } catch {
    currentRate = settings.manualExchangeRate ?? 0;
  }

  const rows: InventarioRow[] = (devices ?? []).map((d) => {
    const cost = d.purchases?.cost_amount ?? null;
    const price = d.list_price_amount;
    let marginPct: number | null = null;
    if (cost && price && d.purchases?.cost_currency && d.list_price_currency) {
      const costInPriceCurrency = toBaseCurrency(
        cost,
        d.purchases.cost_currency,
        currentRate,
        d.list_price_currency,
      );
      if (costInPriceCurrency > 0) {
        marginPct = ((price - costInPriceCurrency) / costInPriceCurrency) * 100;
      }
    }

    return {
      id: d.id,
      model: d.model,
      storageGb: d.storage_gb,
      color: d.color,
      condition: d.condition,
      grade: d.grade,
      imei: d.imei,
      status: d.status,
      batteryHealthPct: d.battery_health_pct,
      costAmount: cost,
      costCurrency: d.purchases?.cost_currency ?? null,
      listPriceAmount: d.list_price_amount,
      listPriceCurrency: d.list_price_currency,
      marginPct,
    };
  });

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Inventario</h1>
          <p className="text-sm text-muted-foreground">
            Controlá cada producto, su estado y sus números.
          </p>
        </div>
        <LinkButton href="/inventario/nuevo">
          <Plus className="h-4 w-4" />
          Cargar producto
        </LinkButton>
      </div>

      <Card>
        <CardContent className="pt-4">
          <form className="mb-4 flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                placeholder="Buscar por modelo o IMEI..."
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
              <option value="in_stock">Disponible</option>
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
