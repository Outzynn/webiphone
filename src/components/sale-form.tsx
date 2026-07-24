"use client";

import { useState } from "react";
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
import type { PaymentType } from "@/lib/database.types";

interface DeviceOption {
  id: string;
  model: string;
  imei: string;
  storage_gb: number | null;
}

export function SaleForm({
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
  const [paymentType, setPaymentType] = useState<PaymentType>("contado");

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
        >
          <SelectTrigger id="client_id" className="w-full">
            <SelectValue placeholder="Sin cliente" />
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
          <Label htmlFor="sale_date">Fecha de venta</Label>
          <Input
            id="sale_date"
            name="sale_date"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="sale_amount">Monto</Label>
          <Input
            id="sale_amount"
            name="sale_amount"
            type="number"
            min={0}
            step="0.01"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="sale_currency">Moneda</Label>
          <Select
            name="sale_currency"
            defaultValue="USD"
            items={[
              { value: "USD", label: "USD" },
              { value: "ARS", label: "ARS" },
            ]}
          >
            <SelectTrigger id="sale_currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="ARS">ARS</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="payment_type">Forma de pago</Label>
          <Select
            name="payment_type"
            defaultValue="contado"
            items={[
              { value: "contado", label: "Contado" },
              { value: "cuotas", label: "Cuotas" },
            ]}
            onValueChange={(v) => setPaymentType(v as PaymentType)}
          >
            <SelectTrigger id="payment_type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contado">Contado</SelectItem>
              <SelectItem value="cuotas">Cuotas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {paymentType === "cuotas" ? (
          <div className="grid gap-2">
            <Label htmlFor="installment_count">Cantidad de cuotas</Label>
            <Input
              id="installment_count"
              name="installment_count"
              type="number"
              min={2}
              max={24}
              defaultValue={3}
            />
          </div>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" name="notes" rows={3} />
      </div>

      <div className="flex justify-end">
        <SubmitButton>Registrar venta</SubmitButton>
      </div>
    </form>
  );
}
