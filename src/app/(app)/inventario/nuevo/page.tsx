import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeviceForm } from "@/components/device-form";
import { createDevice } from "@/lib/actions/devices";

export default async function NuevoDispositivoPage() {
  const supabase = await createClient();
  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id, name")
    .order("name");

  return (
    <div className="mx-auto grid max-w-3xl gap-4">
      <h1 className="text-2xl font-semibold">Nuevo dispositivo</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del equipo y de la compra</CardTitle>
        </CardHeader>
        <CardContent>
          <DeviceForm mode="create" action={createDevice} suppliers={suppliers ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
