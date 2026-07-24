import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/link-button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeviceStatusBadge } from "@/components/device-status-badge";
import { formatCurrency } from "@/lib/currency";
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
    .select("id, model, storage_gb, color, condition, imei, status, purchases(cost_amount, cost_currency)")
    .order("created_at", { ascending: false });

  if (status && VALID_STATUSES.includes(status as DeviceStatus)) {
    query = query.eq("status", status as DeviceStatus);
  }
  if (q) query = query.or(`imei.ilike.%${q}%,model.ilike.%${q}%`);

  const { data: devices, error } = await query;

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

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Modelo</TableHead>
                <TableHead>IMEI</TableHead>
                <TableHead>Condición</TableHead>
                <TableHead>Costo</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices?.map((d) => (
                <TableRow key={d.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/inventario/${d.id}`} className="hover:underline">
                      {d.model} {d.storage_gb ? `· ${d.storage_gb}GB` : ""}{" "}
                      {d.color ? `· ${d.color}` : ""}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{d.imei}</TableCell>
                  <TableCell className="capitalize">{d.condition}</TableCell>
                  <TableCell>
                    {d.purchases
                      ? formatCurrency(
                          d.purchases.cost_amount,
                          d.purchases.cost_currency,
                        )
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <DeviceStatusBadge status={d.status} />
                  </TableCell>
                </TableRow>
              ))}
              {devices?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No hay dispositivos que coincidan con la búsqueda.
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
