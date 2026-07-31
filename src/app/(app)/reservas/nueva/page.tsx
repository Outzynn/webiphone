import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReservationForm } from "@/components/reservation-form";
import { createReservation } from "@/lib/actions/reservations";

export default async function NuevaReservaPage({
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
      <h1 className="text-2xl font-semibold">Nueva reserva</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos de la reserva</CardTitle>
        </CardHeader>
        <CardContent>
          <ReservationForm
            action={createReservation}
            devices={devices ?? []}
            clients={clients ?? []}
            preselectedDeviceId={device}
          />
        </CardContent>
      </Card>
    </div>
  );
}
