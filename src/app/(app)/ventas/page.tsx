import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/link-button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";

export default async function VentasPage() {
  const supabase = await createClient();
  const { data: sales } = await supabase
    .from("sales")
    .select("id, sale_date, sale_amount, sale_currency, payment_type, devices(model, imei), clients(name)")
    .order("sale_date", { ascending: false });

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Ventas</h1>
        <LinkButton href="/ventas/nueva">
          <Plus className="h-4 w-4" />
          Nueva venta
        </LinkButton>
      </div>

      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Dispositivo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Pago</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales?.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Link href={`/ventas/${s.id}`} className="hover:underline">
                      {s.sale_date}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {s.devices?.model} · <span className="font-mono text-xs">{s.devices?.imei}</span>
                  </TableCell>
                  <TableCell>{s.clients?.name ?? "—"}</TableCell>
                  <TableCell>{formatCurrency(s.sale_amount, s.sale_currency)}</TableCell>
                  <TableCell>
                    <Badge variant={s.payment_type === "cuotas" ? "secondary" : "outline"}>
                      {s.payment_type}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {sales?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Todavía no hay ventas registradas.
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
