import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { CuotasTable, type CuotaRow } from "@/components/cuotas-table";

export default async function CuotasPage() {
  const supabase = await createClient();

  const { data: installments } = await supabase
    .from("installments")
    .select(
      "*, sales(id, clients(name), devices:devices!sales_device_id_fkey(model, imei))",
    )
    .order("due_date", { ascending: true });

  const rows: CuotaRow[] = (installments ?? []).map((i) => ({
    id: i.id,
    saleId: i.sale_id,
    installmentNumber: i.installment_number,
    dueDate: i.due_date,
    amount: i.amount,
    currency: i.currency,
    paid: i.paid,
    clientName: i.sales?.clients?.name ?? null,
    deviceModel: i.sales?.devices?.model ?? null,
    deviceImei: i.sales?.devices?.imei ?? null,
  }));

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-semibold">Cuotas</h1>
      <Card>
        <CardContent className="pt-4">
          <CuotasTable rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
