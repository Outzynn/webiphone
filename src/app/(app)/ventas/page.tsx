import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/link-button";
import { Card, CardContent } from "@/components/ui/card";
import { VentasTable, type VentaRow } from "@/components/ventas-table";

export default async function VentasPage() {
  const supabase = await createClient();
  const { data: sales } = await supabase
    .from("sales")
    .select(
      "id, sale_date, sale_amount, sale_currency, payment_type, devices:devices!sales_device_id_fkey(model, imei), clients(name)",
    )
    .order("sale_date", { ascending: false });

  const rows: VentaRow[] = (sales ?? []).map((s) => ({
    id: s.id,
    saleDate: s.sale_date,
    saleAmount: s.sale_amount,
    saleCurrency: s.sale_currency,
    paymentType: s.payment_type,
    deviceModel: s.devices?.model ?? null,
    deviceImei: s.devices?.imei ?? null,
    clientName: s.clients?.name ?? null,
  }));

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
          <VentasTable rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
