"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/submit-button";
import type { AppSettings } from "@/lib/settings";

export function SettingsForm({
  action,
  settings,
}: {
  action: (formData: FormData) => void;
  settings: AppSettings;
}) {
  const [source, setSource] = useState(settings.exchangeRateSource);

  return (
    <form action={action} className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="exchange_rate_source">Fuente de cotización dólar</Label>
          <Select
            name="exchange_rate_source"
            defaultValue={source}
            items={[
              { value: "blue", label: "Dólar blue" },
              { value: "oficial", label: "Dólar oficial" },
              { value: "manual", label: "Manual" },
            ]}
            onValueChange={(v) => setSource(v as typeof source)}
          >
            <SelectTrigger id="exchange_rate_source">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blue">Dólar blue</SelectItem>
              <SelectItem value="oficial">Dólar oficial</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {source === "manual" ? (
          <div className="grid gap-2">
            <Label htmlFor="manual_exchange_rate">Cotización manual (ARS por USD)</Label>
            <Input
              id="manual_exchange_rate"
              name="manual_exchange_rate"
              type="number"
              step="0.01"
              defaultValue={settings.manualExchangeRate ?? ""}
            />
          </div>
        ) : null}

        <div className="grid gap-2">
          <Label htmlFor="base_currency">Moneda base para reportes</Label>
          <Select
            name="base_currency"
            defaultValue={settings.baseCurrency}
            items={[
              { value: "USD", label: "USD" },
              { value: "ARS", label: "ARS" },
            ]}
          >
            <SelectTrigger id="base_currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="ARS">ARS</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="label_width_mm">Ancho de etiqueta (mm)</Label>
          <Input
            id="label_width_mm"
            name="label_width_mm"
            type="number"
            min={10}
            defaultValue={settings.labelSizeMm.width}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="label_height_mm">Alto de etiqueta (mm)</Label>
          <Input
            id="label_height_mm"
            name="label_height_mm"
            type="number"
            min={10}
            defaultValue={settings.labelSizeMm.height}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <SubmitButton>Guardar configuración</SubmitButton>
      </div>
    </form>
  );
}
