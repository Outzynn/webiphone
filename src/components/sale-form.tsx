"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/submit-button";
import { formatCurrency } from "@/lib/currency";
import type {
  CurrencyCode,
  DeviceCondition,
  PaymentType,
} from "@/lib/database.types";

interface DeviceOption {
  id: string;
  model: string;
  imei: string;
  storage_gb: number | null;
}

const CURRENCY_ITEMS = [
  { value: "USD", label: "USD" },
  { value: "ARS", label: "ARS" },
];

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
  const [saleAmount, setSaleAmount] = useState<number>(0);
  const [saleCurrency, setSaleCurrency] = useState<CurrencyCode>("USD");

  const [hasTradeIn, setHasTradeIn] = useState(false);
  const [tradeInCondition, setTradeInCondition] = useState<DeviceCondition>("usado");
  const [tradeInValue, setTradeInValue] = useState<number>(0);
  const [tradeInCurrency, setTradeInCurrency] = useState<CurrencyCode>("USD");

  const netToCollect = useMemo(() => {
    if (!hasTradeIn) return saleAmount;
    if (tradeInCurrency !== saleCurrency) return null; // se resuelve server-side con la cotización
    return saleAmount - tradeInValue;
  }, [hasTradeIn, saleAmount, saleCurrency, tradeInValue, tradeInCurrency]);

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
          <Label htmlFor="sale_amount">Monto del equipo</Label>
          <Input
            id="sale_amount"
            name="sale_amount"
            type="number"
            min={0}
            step="0.01"
            required
            onChange={(e) => setSaleAmount(Number(e.target.value) || 0)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="sale_currency">Moneda</Label>
          <Select
            name="sale_currency"
            defaultValue="USD"
            items={CURRENCY_ITEMS}
            onValueChange={(v) => setSaleCurrency(v as CurrencyCode)}
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
      </div>

      <Separator />

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          name="has_trade_in"
          checked={hasTradeIn}
          onChange={(e) => setHasTradeIn(e.target.checked)}
        />
        Plan canje: el cliente entrega un equipo usado como parte de pago
      </label>

      {hasTradeIn ? (
        <div className="grid gap-4 rounded-md border p-3 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="trade_in_imei">IMEI del equipo recibido</Label>
            <Input id="trade_in_imei" name="trade_in_imei" required={hasTradeIn} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="trade_in_model">Modelo</Label>
            <Input id="trade_in_model" name="trade_in_model" required={hasTradeIn} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="trade_in_color">Color</Label>
            <Input id="trade_in_color" name="trade_in_color" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="trade_in_storage_gb">Almacenamiento (GB)</Label>
            <Input
              id="trade_in_storage_gb"
              name="trade_in_storage_gb"
              type="number"
              min={0}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="trade_in_battery_health_pct">Batería (%)</Label>
            <Input
              id="trade_in_battery_health_pct"
              name="trade_in_battery_health_pct"
              type="number"
              min={0}
              max={100}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="trade_in_condition">Condición</Label>
            <Select
              name="trade_in_condition"
              defaultValue={tradeInCondition}
              items={[
                { value: "nuevo", label: "Nuevo" },
                { value: "usado", label: "Usado" },
              ]}
              onValueChange={(v) => setTradeInCondition(v as DeviceCondition)}
            >
              <SelectTrigger id="trade_in_condition">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nuevo">Nuevo</SelectItem>
                <SelectItem value="usado">Usado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {tradeInCondition === "usado" ? (
            <div className="grid gap-2">
              <Label htmlFor="trade_in_grade">Grado estético</Label>
              <Select
                name="trade_in_grade"
                items={[
                  { value: "A", label: "A - Excelente" },
                  { value: "B", label: "B - Bueno" },
                  { value: "C", label: "C - Con marcas visibles" },
                ]}
              >
                <SelectTrigger id="trade_in_grade">
                  <SelectValue placeholder="Sin especificar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A - Excelente</SelectItem>
                  <SelectItem value="B">B - Bueno</SelectItem>
                  <SelectItem value="C">C - Con marcas visibles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="grid gap-2">
            <Label htmlFor="trade_in_value_amount">Valor reconocido</Label>
            <Input
              id="trade_in_value_amount"
              name="trade_in_value_amount"
              type="number"
              min={0}
              step="0.01"
              required={hasTradeIn}
              onChange={(e) => setTradeInValue(Number(e.target.value) || 0)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="trade_in_value_currency">Moneda del valor</Label>
            <Select
              name="trade_in_value_currency"
              defaultValue="USD"
              items={CURRENCY_ITEMS}
              onValueChange={(v) => setTradeInCurrency(v as CurrencyCode)}
            >
              <SelectTrigger id="trade_in_value_currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="ARS">ARS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground sm:col-span-2">
            {netToCollect !== null
              ? `Monto a cobrar al cliente: ${formatCurrency(Math.max(netToCollect, 0), saleCurrency)}`
              : "El valor del canje está en otra moneda: se descuenta con la cotización del día al confirmar."}
          </p>
        </div>
      ) : null}

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2">
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
          <>
            <div className="grid gap-2">
              <Label htmlFor="installment_frequency">Frecuencia</Label>
              <Select
                name="installment_frequency"
                defaultValue="mensual"
                items={[
                  { value: "semanal", label: "Semanal" },
                  { value: "quincenal", label: "Quincenal" },
                  { value: "mensual", label: "Mensual" },
                ]}
              >
                <SelectTrigger id="installment_frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="quincenal">Quincenal</SelectItem>
                  <SelectItem value="mensual">Mensual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="installment_first_due_date">
                Fecha de la primera cuota
              </Label>
              <Input
                id="installment_first_due_date"
                name="installment_first_due_date"
                type="date"
                required
              />
              <p className="text-xs text-muted-foreground">
                Ej: elegí el próximo lunes y frecuencia semanal para que todas caigan
                los lunes.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="installment_count">Cantidad de cuotas</Label>
              <Input
                id="installment_count"
                name="installment_count"
                type="number"
                min={2}
                max={36}
                defaultValue={3}
              />
            </div>
          </>
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
