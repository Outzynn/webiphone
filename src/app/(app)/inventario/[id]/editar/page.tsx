import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeviceForm } from "@/components/device-form";
import { updateDevice } from "@/lib/actions/devices";

export default async function EditarDispositivoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: device } = await supabase
    .from("devices")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!device) notFound();

  const action = updateDevice.bind(null, id);

  return (
    <div className="mx-auto grid max-w-3xl gap-4">
      <h1 className="text-2xl font-semibold">Editar dispositivo</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del equipo</CardTitle>
        </CardHeader>
        <CardContent>
          <DeviceForm mode="edit" action={action} defaultValues={device} />
        </CardContent>
      </Card>
    </div>
  );
}
