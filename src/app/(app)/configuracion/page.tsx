import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "@/components/settings-form";
import { getSettings } from "@/lib/settings";
import { updateAppSettings } from "@/lib/actions/settings";

export default async function ConfiguracionPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto grid max-w-xl gap-4">
      <h1 className="text-2xl font-semibold">Configuración</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cotización y etiquetas</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm action={updateAppSettings} settings={settings} />
        </CardContent>
      </Card>
    </div>
  );
}
