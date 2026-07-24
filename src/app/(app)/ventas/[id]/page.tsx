import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InstallmentRow } from "@/components/installment-row";
import { DeleteSaleButton } from "@/components/delete-sale-button";
import { formatCurrency } from "@/lib/currency";

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: sale } = await supabase
    .from("sales")
    .select("*, devices(id, model, imei, storage_gb), clients(name, phone), installments(*)")
    .eq("id", id)
    .maybeSingle();

  if (!sale) notFound();

  const installments = (sale.installments ?? []).sort(
    (a, b) => a.installment_number - b.installment_number,
  );

  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Venta del {sale.sale_date}</h1>
        <DeleteSaleButton saleId={sale.id} deviceId={sale.device_id} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalle</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Dispositivo</p>
            <Link href={`/inventario/${sale.devices?.id}`} className="hover:underline">
              {sale.devices?.model} {sale.devices?.storage_gb ? `· ${sale.devices.storage_gb}GB` : ""}
            </Link>
            <p className="font-mono text-xs text-muted-foreground">{sale.devices?.imei}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Cliente</p>
            <p>{sale.clients?.name ?? "—"}</p>
            {sale.clients?.phone ? (
              <p className="text-xs text-muted-foreground">{sale.clients.phone}</p>
            ) : null}
          </div>
          <div>
            <p className="text-muted-foreground">Monto</p>
            <p>{formatCurrency(sale.sale_amount, sale.sale_currency)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Forma de pago</p>
            <p className="capitalize">{sale.payment_type}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Cotización al vender</p>
            <p>{sale.exchange_rate_snapshot ?? "—"}</p>
          </div>
          {sale.notes ? (
            <div className="col-span-full">
              <p className="text-muted-foreground">Notas</p>
              <p>{sale.notes}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {installments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cuotas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {installments.map((inst) => (
              <InstallmentRow
                key={inst.id}
                id={inst.id}
                saleId={sale.id}
                number={inst.installment_number}
                dueDate={inst.due_date}
                amount={inst.amount}
                currency={inst.currency}
                paid={inst.paid}
              />
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
