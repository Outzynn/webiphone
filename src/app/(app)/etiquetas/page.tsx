import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { LabelPrinter } from "@/components/label-printer";

export default async function EtiquetasPage({
  searchParams,
}: {
  searchParams: Promise<{ device?: string }>;
}) {
  const { device } = await searchParams;
  const supabase = await createClient();
  const settings = await getSettings();

  const { data: devices } = await supabase
    .from("devices")
    .select("id, model, imei, storage_gb, battery_health_pct")
    .order("model");

  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      <h1 className="text-2xl font-semibold print:hidden">Etiquetas</h1>
      <LabelPrinter
        devices={devices ?? []}
        labelSize={settings.labelSizeMm}
        preselectedId={device}
      />
    </div>
  );
}
