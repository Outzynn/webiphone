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
import { Separator } from "@/components/ui/separator";
import { PhotoPicker } from "@/components/photo-picker";
import { SubmitButton } from "@/components/submit-button";
import type { DeviceCondition, DeviceGrade } from "@/lib/database.types";

export interface DeviceFormValues {
  model?: string;
  storage_gb?: number | null;
  color?: string | null;
  condition?: DeviceCondition;
  grade?: DeviceGrade | null;
  battery_health_pct?: number | null;
  imei?: string;
  serial_number?: string | null;
  list_price_amount?: number | null;
  list_price_currency?: string | null;
  notes?: string | null;
}

export function DeviceForm({
  mode,
  action,
  defaultValues,
  suppliers,
}: {
  mode: "create" | "edit";
  action: (formData: FormData) => void;
  defaultValues?: DeviceFormValues;
  suppliers?: { id: string; name: string }[];
}) {
  const [condition, setCondition] = useState<DeviceCondition>(
    defaultValues?.condition ?? "usado",
  );

  function handleImeiKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      document.getElementById("model-field")?.focus();
    }
  }

  return (
    <form action={action} className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="imei-field">IMEI</Label>
          <Input
            id="imei-field"
            name="imei"
            required
            autoFocus={mode === "create"}
            placeholder="Escanear o tipear el IMEI"
            defaultValue={defaultValues?.imei}
            onKeyDown={handleImeiKeyDown}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="model-field">Modelo</Label>
          <Input
            id="model-field"
            name="model"
            required
            placeholder="iPhone 13 Pro"
            defaultValue={defaultValues?.model}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="color">Color</Label>
          <Input
            id="color"
            name="color"
            defaultValue={defaultValues?.color ?? ""}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="storage_gb">Almacenamiento (GB)</Label>
          <Input
            id="storage_gb"
            name="storage_gb"
            type="number"
            min={0}
            step={1}
            defaultValue={defaultValues?.storage_gb ?? ""}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="battery_health_pct">Batería (%)</Label>
          <Input
            id="battery_health_pct"
            name="battery_health_pct"
            type="number"
            min={0}
            max={100}
            defaultValue={defaultValues?.battery_health_pct ?? ""}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="condition">Condición</Label>
          <Select
            name="condition"
            defaultValue={condition}
            items={[
              { value: "nuevo", label: "Nuevo" },
              { value: "usado", label: "Usado" },
            ]}
            onValueChange={(v) => setCondition(v as DeviceCondition)}
          >
            <SelectTrigger id="condition">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nuevo">Nuevo</SelectItem>
              <SelectItem value="usado">Usado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {condition === "usado" ? (
          <div className="grid gap-2">
            <Label htmlFor="grade">Grado estético</Label>
            <Select
              name="grade"
              defaultValue={defaultValues?.grade ?? undefined}
              items={[
                { value: "A", label: "A - Excelente" },
                { value: "B", label: "B - Bueno" },
                { value: "C", label: "C - Con marcas visibles" },
              ]}
            >
              <SelectTrigger id="grade">
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
          <Label htmlFor="serial_number">N° de serie (opcional)</Label>
          <Input
            id="serial_number"
            name="serial_number"
            defaultValue={defaultValues?.serial_number ?? ""}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="list_price_amount">Precio de venta</Label>
          <Input
            id="list_price_amount"
            name="list_price_amount"
            type="number"
            min={0}
            step="0.01"
            defaultValue={defaultValues?.list_price_amount ?? ""}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="list_price_currency">Moneda del precio</Label>
          <Select
            name="list_price_currency"
            defaultValue={defaultValues?.list_price_currency ?? "USD"}
            items={[
              { value: "USD", label: "USD" },
              { value: "ARS", label: "ARS" },
            ]}
          >
            <SelectTrigger id="list_price_currency">
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
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={defaultValues?.notes ?? ""}
        />
      </div>

      <div className="grid gap-2">
        <Label>Fotos</Label>
        <PhotoPicker />
      </div>

      {mode === "create" ? (
        <>
          <Separator />
          <div>
            <h3 className="mb-3 font-medium">Datos de la compra</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="supplier_id">Proveedor</Label>
                <Select
                  name="supplier_id"
                  items={suppliers?.map((s) => ({ value: s.id, label: s.name })) ?? []}
                >
                  <SelectTrigger id="supplier_id">
                    <SelectValue placeholder="Sin proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="purchase_date">Fecha de compra</Label>
                <Input
                  id="purchase_date"
                  name="purchase_date"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cost_amount">Costo</Label>
                <Input
                  id="cost_amount"
                  name="cost_amount"
                  type="number"
                  min={0}
                  step="0.01"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cost_currency">Moneda</Label>
                <Select
                  name="cost_currency"
                  defaultValue="USD"
                  items={[
                    { value: "USD", label: "USD" },
                    { value: "ARS", label: "ARS" },
                  ]}
                >
                  <SelectTrigger id="cost_currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="ARS">ARS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="purchase_notes">Notas de la compra</Label>
                <Textarea id="purchase_notes" name="purchase_notes" rows={2} />
              </div>
            </div>
          </div>
        </>
      ) : null}

      <div className="flex justify-end">
        <SubmitButton>
          {mode === "create" ? "Agregar al inventario" : "Guardar cambios"}
        </SubmitButton>
      </div>
    </form>
  );
}
