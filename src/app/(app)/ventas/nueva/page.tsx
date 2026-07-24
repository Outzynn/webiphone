import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SaleForm } from "@/components/sale-form";
import { createSale } from "@/lib/actions/sales";

export default async function NuevaVentaPage({
  searchParams,
}: {
  searchParams: Promise<{ device?: string }>;
}) {
  const { device } = await searchParams;
  const supabase = await createClient();

  const [{ data: devices }, { data: clients }] = await Promise.all([
    supabase
      .from("devices")
      .select("id, model, imei, storage_gb")
      .eq("status", "in_stock")
      .order("model"),
    supabase.from("clients").select("id, name").order("name"),
  ]);

  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      <h1 className="text-2xl font-semibold">Nueva venta</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos de la venta</CardTitle>
        </CardHeader>
        <CardContent>
          <SaleForm
            action={createSale}
            devices={devices ?? []}
            clients={clients ?? []}
            preselectedDeviceId={device}
          />
        </CardContent>
      </Card>
    </div>
  );
}
