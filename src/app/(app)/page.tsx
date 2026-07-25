import Link from "next/link";
import { format, subDays } from "date-fns";
import {
  AlertTriangle,
  Boxes,
  CalendarClock,
  DollarSign,
  TrendingUp,
  ShoppingCart,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSettings, resolveCurrentExchangeRate } from "@/lib/settings";
import { toBaseCurrency, formatCurrency } from "@/lib/currency";
import { StatCard } from "@/components/stat-card";
import { ProfitChart } from "@/components/profit-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function DashboardPage() {
  const supabase = await createClient();
  const settings = await getSettings();

  let currentRate = 0;
  try {
    currentRate = await resolveCurrentExchangeRate(settings);
  } catch {
    currentRate = settings.manualExchangeRate ?? 0;
  }

  const { data: devices } = await supabase
    .from("devices")
    .select(
      "id, model, status, purchases(cost_amount, cost_currency, exchange_rate_snapshot), sales:sales!sales_device_id_fkey(sale_amount, sale_currency, exchange_rate_snapshot, sale_date)",
    );

  const rows = devices ?? [];
  const base = settings.baseCurrency;

  function rateFor(snapshot: number | null) {
    return snapshot && snapshot > 0 ? snapshot : currentRate;
  }

  const stockRows = rows.filter((d) => d.status !== "sold");
  const stockCount = stockRows.length;
  const stockValue = stockRows.reduce((sum, d) => {
    if (!d.purchases) return sum;
    return (
      sum +
      toBaseCurrency(
        d.purchases.cost_amount,
        d.purchases.cost_currency,
        rateFor(d.purchases.exchange_rate_snapshot),
        base,
      )
    );
  }, 0);

  const soldRows = rows.filter((d) => d.status === "sold" && d.sales && d.purchases);

  let totalProfit = 0;
  let totalRevenue = 0;
  const profitByMonth = new Map<string, number>();

  for (const d of soldRows) {
    const cost = toBaseCurrency(
      d.purchases!.cost_amount,
      d.purchases!.cost_currency,
      rateFor(d.purchases!.exchange_rate_snapshot),
      base,
    );
    const revenue = toBaseCurrency(
      d.sales!.sale_amount,
      d.sales!.sale_currency,
      rateFor(d.sales!.exchange_rate_snapshot),
      base,
    );
    const profit = revenue - cost;
    totalProfit += profit;
    totalRevenue += revenue;

    const month = d.sales!.sale_date.slice(0, 7);
    profitByMonth.set(month, (profitByMonth.get(month) ?? 0) + profit);
  }

  const chartData = Array.from(profitByMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, profit]) => ({ month, profit: Math.round(profit * 100) / 100 }));

  const { data: pendingInstallments } = await supabase
    .from("installments")
    .select("amount, currency, due_date")
    .eq("paid", false);

  const pendingTotal = (pendingInstallments ?? []).reduce(
    (sum, i) => sum + toBaseCurrency(i.amount, i.currency, currentRate, base),
    0,
  );
  const pendingCount = pendingInstallments?.length ?? 0;

  const overdueThreshold = format(subDays(new Date(), 3), "yyyy-MM-dd");
  const overdueInstallments = (pendingInstallments ?? []).filter(
    (i) => i.due_date < overdueThreshold,
  );
  const overdueTotal = overdueInstallments.reduce(
    (sum, i) => sum + toBaseCurrency(i.amount, i.currency, currentRate, base),
    0,
  );
  const overdueCount = overdueInstallments.length;

  const { data: recentSales } = await supabase
    .from("sales")
    .select(
      "id, sale_date, sale_amount, sale_currency, devices:devices!sales_device_id_fkey(model, imei)",
    )
    .order("sale_date", { ascending: false })
    .limit(5);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Cotización {settings.exchangeRateSource}: {currentRate ? currentRate.toFixed(2) : "—"}{" "}
          ARS/USD
        </p>
      </div>

      {overdueCount > 0 ? (
        <Link
          href="/cuotas"
          className="flex items-center gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive hover:bg-destructive/15"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Tenés <strong>{overdueCount}</strong> cuota{overdueCount === 1 ? "" : "s"} vencida
            {overdueCount === 1 ? "" : "s"} hace más de 3 días, por{" "}
            {formatCurrency(overdueTotal, base)}. Ver detalle →
          </span>
        </Link>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Stock actual"
          value={`${stockCount}`}
          sub="equipos en stock o reservados"
          icon={Boxes}
        />
        <StatCard
          label="Inversión actual"
          value={formatCurrency(stockValue, base)}
          sub="costo del stock sin vender"
          icon={DollarSign}
        />
        <StatCard
          label="Ganancia total"
          value={formatCurrency(totalProfit, base)}
          sub="acumulada de equipos vendidos"
          icon={TrendingUp}
        />
        <StatCard
          label="Ventas totales"
          value={formatCurrency(totalRevenue, base)}
          sub={`${soldRows.length} equipos vendidos`}
          icon={ShoppingCart}
        />
        <StatCard
          label="Cuotas pendientes"
          value={formatCurrency(pendingTotal, base)}
          sub={`${pendingCount} cuota${pendingCount === 1 ? "" : "s"} por cobrar`}
          icon={CalendarClock}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ganancia por mes ({base})</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ProfitChart data={chartData} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Todavía no hay ventas suficientes para graficar.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ventas recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Dispositivo</TableHead>
                <TableHead>Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSales?.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Link href={`/ventas/${s.id}`} className="hover:underline">
                      {s.sale_date}
                    </Link>
                  </TableCell>
                  <TableCell>{s.devices?.model}</TableCell>
                  <TableCell>{formatCurrency(s.sale_amount, s.sale_currency)}</TableCell>
                </TableRow>
              ))}
              {recentSales?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Sin ventas todavía.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
