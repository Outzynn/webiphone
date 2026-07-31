import Link from "next/link";
import {
  addDays,
  format,
  startOfMonth,
  startOfWeek,
  subDays,
  subWeeks,
} from "date-fns";
import {
  AlertTriangle,
  Boxes,
  CalendarClock,
  CalendarCheck,
  DollarSign,
  PackageSearch,
  Plus,
  TrendingUp,
  ShoppingCart,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSettings, resolveCurrentExchangeRate } from "@/lib/settings";
import { toBaseCurrency, formatCurrency } from "@/lib/currency";
import { StatCard } from "@/components/stat-card";
import { ProfitChart } from "@/components/profit-chart";
import { LinkButton } from "@/components/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Buen día";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

function firstNameFromEmail(email: string) {
  const local = email.split("@")[0] ?? "";
  const first = local.split(/[._-]+/)[0] ?? local;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const settings = await getSettings();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  const stockCount = stockRows.filter((d) => d.status === "in_stock").length;
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

  const today = new Date();
  const monthStart = format(startOfMonth(today), "yyyy-MM-dd");
  const sevenDaysAgo = format(subDays(today, 7), "yyyy-MM-dd");
  const thirtyDaysAgo = format(subDays(today, 30), "yyyy-MM-dd");

  let totalProfit = 0;
  let monthRevenue = 0;
  let monthProfit = 0;
  const profitByMonth = new Map<string, number>();
  const weeklyRevenue = new Map<string, number>();
  const salesLast7DaysByModel = new Map<string, number>();
  const salesLast30DaysByModel = new Map<string, number>();

  const weekBuckets = Array.from({ length: 6 }).map((_, i) => {
    const start = startOfWeek(subWeeks(today, 5 - i), { weekStartsOn: 1 });
    return { start, end: addDays(start, 7), label: format(start, "dd/MM") };
  });

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

    const saleDate = d.sales!.sale_date;
    if (saleDate >= monthStart) {
      monthRevenue += revenue;
      monthProfit += profit;
    }
    if (saleDate >= sevenDaysAgo) {
      salesLast7DaysByModel.set(d.model, (salesLast7DaysByModel.get(d.model) ?? 0) + 1);
    }
    if (saleDate >= thirtyDaysAgo) {
      salesLast30DaysByModel.set(d.model, (salesLast30DaysByModel.get(d.model) ?? 0) + 1);
    }

    const month = saleDate.slice(0, 7);
    profitByMonth.set(month, (profitByMonth.get(month) ?? 0) + profit);

    const saleDateObj = new Date(`${saleDate}T00:00:00`);
    const bucket = weekBuckets.find((b) => saleDateObj >= b.start && saleDateObj < b.end);
    if (bucket) {
      weeklyRevenue.set(bucket.label, (weeklyRevenue.get(bucket.label) ?? 0) + revenue);
    }
  }

  const chartData = Array.from(profitByMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, profit]) => ({ month, profit: Math.round(profit * 100) / 100 }));

  const weeklyChartData = weekBuckets.map((b) => ({
    month: b.label,
    profit: Math.round((weeklyRevenue.get(b.label) ?? 0) * 100) / 100,
  }));

  const stockCountByModel = new Map<string, number>();
  for (const d of stockRows) {
    if (d.status === "in_stock") {
      stockCountByModel.set(d.model, (stockCountByModel.get(d.model) ?? 0) + 1);
    }
  }

  const restockAlerts = Array.from(salesLast7DaysByModel.entries())
    .map(([model, soldLast7]) => ({
      model,
      soldLast7,
      remaining: stockCountByModel.get(model) ?? 0,
    }))
    .filter((r) => r.remaining <= r.soldLast7)
    .sort((a, b) => b.soldLast7 - a.soldLast7);

  const rotationByModel = Array.from(salesLast30DaysByModel.entries())
    .map(([model, sold]) => ({ model, sold }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 8);

  const { count: reservedCount } = await supabase
    .from("reservations")
    .select("id", { count: "exact", head: true })
    .eq("status", "activa");

  const { data: pendingInstallments } = await supabase
    .from("installments")
    .select("amount, currency, due_date")
    .eq("paid", false);

  const pendingTotal = (pendingInstallments ?? []).reduce(
    (sum, i) => sum + toBaseCurrency(i.amount, i.currency, currentRate, base),
    0,
  );
  const pendingCount = pendingInstallments?.length ?? 0;

  const overdueThreshold = format(subDays(today, 3), "yyyy-MM-dd");
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
        <div>
          <h1 className="text-2xl font-semibold">
            {greeting()}
            {user?.email ? `, ${firstNameFromEmail(user.email)}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            Así está funcionando tu tienda hoy · Cotización {settings.exchangeRateSource}:{" "}
            {currentRate ? currentRate.toFixed(2) : "—"} ARS/USD
          </p>
        </div>
        <LinkButton href="/inventario/nuevo">
          <Plus className="h-4 w-4" />
          Cargar producto
        </LinkButton>
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Ventas del mes"
          value={formatCurrency(monthRevenue, base)}
          sub="ingresos de equipos vendidos este mes"
          icon={ShoppingCart}
        />
        <StatCard
          label="Ganancia del mes"
          value={formatCurrency(monthProfit, base)}
          sub="margen de lo vendido este mes"
          icon={TrendingUp}
        />
        <StatCard
          label="Stock disponible"
          value={`${stockCount}`}
          sub="equipos listos para vender"
          icon={Boxes}
        />
        <StatCard
          label="Reservados"
          value={`${reservedCount ?? 0}`}
          sub="reservas activas con seña"
          icon={CalendarCheck}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          label="Cuotas pendientes"
          value={formatCurrency(pendingTotal, base)}
          sub={`${pendingCount} cuota${pendingCount === 1 ? "" : "s"} por cobrar`}
          icon={CalendarClock}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ventas de las últimas 6 semanas</CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyChartData.some((w) => w.profit > 0) ? (
              <ProfitChart data={weeklyChartData} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Todavía no hay ventas en las últimas 6 semanas.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alerta de reposición</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {restockAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Todavía no hay suficiente ritmo de ventas reciente para calcular una alerta
                confiable. En cuanto un modelo tenga ventas en los últimos 7 días, va a
                aparecer acá si el stock restante no alcanza a cubrir esa semana.
              </p>
            ) : (
              restockAlerts.map((r) => (
                <div
                  key={r.model}
                  className="flex items-center gap-3 rounded-md border border-warning/30 bg-warning/10 p-2 text-sm text-warning"
                >
                  <PackageSearch className="h-4 w-4 shrink-0" />
                  <span>
                    <strong>{r.model}</strong>: quedan {r.remaining}, se vendieron{" "}
                    {r.soldLast7} en los últimos 7 días.
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Ventas recientes</CardTitle>
            <Link href="/ventas" className="text-sm text-primary hover:underline">
              Ver todas
            </Link>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rotación por modelo (30 días)</CardTitle>
          </CardHeader>
          <CardContent>
            {rotationByModel.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin ventas en los últimos 30 días todavía.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Vendidos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rotationByModel.map((r) => (
                    <TableRow key={r.model}>
                      <TableCell>{r.model}</TableCell>
                      <TableCell>{r.sold}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
