"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/submit-button";

interface DeviceOption {
  id: string;
  model: string;
  imei: string;
  storage_gb: number | null;
}

export function ReservationForm({
  action,
  devices,
  clients,
  preselectedDeviceId,
}: {
  action: (formData: FormData) => void;
  devices: DeviceOption[];
  clients: { id: string; name: string }[];
  preselectedDeviceId?: string;
}) {
  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="device_id">Dispositivo</Label>
        <Select
          name="device_id"
          defaultValue={preselectedDeviceId}
          items={devices.map((d) => ({
            value: d.id,
            label: `${d.model}${d.storage_gb ? ` · ${d.storage_gb}GB` : ""} · ${d.imei}`,
          }))}
          required
        >
          <SelectTrigger id="device_id" className="w-full">
            <SelectValue placeholder="Elegir dispositivo en stock" />
          </SelectTrigger>
          <SelectContent>
            {devices.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.model} {d.storage_gb ? `· ${d.storage_gb}GB` : ""} · {d.imei}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="client_id">Cliente</Label>
        <Select
          name="client_id"
          items={clients.map((c) => ({ value: c.id, label: c.name }))}
          required
        >
          <SelectTrigger id="client_id" className="w-full">
            <SelectValue placeholder="Elegir cliente" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="reservation_date">Fecha de la reserva</Label>
          <Input
            id="reservation_date"
            name="reservation_date"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="deposit_amount">Seña</Label>
          <Input
            id="deposit_amount"
            name="deposit_amount"
            type="number"
            min={0}
            step="0.01"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="deposit_currency">Moneda</Label>
          <Select
            name="deposit_currency"
            defaultValue="USD"
            items={[
              { value: "USD", label: "USD" },
              { value: "ARS", label: "ARS" },
            ]}
          >
            <SelectTrigger id="deposit_currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="ARS">ARS</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" name="notes" rows={3} />
      </div>

      <div className="flex justify-end">
        <SubmitButton>Registrar reserva</SubmitButton>
      </div>
    </form>
  );
}
