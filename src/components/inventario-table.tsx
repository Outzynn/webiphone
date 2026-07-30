"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeviceStatusBadge } from "@/components/device-status-badge";
import { formatCurrency } from "@/lib/currency";
import type { CurrencyCode, DeviceStatus } from "@/lib/database.types";

export interface InventarioRow {
  id: string;
  model: string;
  storageGb: number | null;
  color: string | null;
  condition: string;
  imei: string;
  status: DeviceStatus;
  batteryHealthPct: number | null;
  costAmount: number | null;
  costCurrency: CurrencyCode | null;
  listPriceAmount: number | null;
  listPriceCurrency: CurrencyCode | null;
}

function buildPriceListText(devices: InventarioRow[]) {
  const lines = devices.map((d) => {
    const title = [d.model, d.storageGb ? `${d.storageGb}GB` : null, d.color]
      .filter(Boolean)
      .join(" - ");
    const battery = d.batteryHealthPct ? `Batería: ${d.batteryHealthPct}%` : null;
    const price =
      d.listPriceAmount && d.listPriceCurrency
        ? `Precio: ${formatCurrency(d.listPriceAmount, d.listPriceCurrency)}`
        : "Precio: consultar";
    const details = [battery, price].filter(Boolean).join(" | ");
    return `*${title}*\n${details}`;
  });
  return lines.join("\n\n");
}

export function InventarioTable({ rows }: { rows: InventarioRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const inStockRows = rows.filter((r) => r.status === "in_stock");
  const allInStockSelected =
    inStockRows.length > 0 && inStockRows.every((r) => selected.has(r.id));

  function toggleAll() {
    if (allInStockSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(inStockRows.map((r) => r.id)));
    }
  }

  async function copySelected() {
    const chosen = rows.filter((r) => selected.has(r.id));
    if (chosen.length === 0) return;
    const text = buildPriceListText(chosen);
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Lista copiada (${chosen.length} equipo${chosen.length === 1 ? "" : "s"})`);
    } catch {
      toast.error("No se pudo copiar al portapapeles. Probá de nuevo.");
    }
  }

  return (
    <div className="grid gap-3">
      {selected.size > 0 ? (
        <div className="flex items-center justify-between rounded-md border bg-muted/40 p-2 text-sm">
          <span>{selected.size} seleccionado{selected.size === 1 ? "" : "s"}</span>
          <Button size="sm" onClick={copySelected}>
            <Copy className="h-4 w-4" />
            Copiar lista de precios
          </Button>
        </div>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8">
              <input
                type="checkbox"
                checked={allInStockSelected}
                onChange={toggleAll}
                disabled={inStockRows.length === 0}
                aria-label="Seleccionar todos los que están en stock"
              />
            </TableHead>
            <TableHead>Modelo</TableHead>
            <TableHead>IMEI</TableHead>
            <TableHead>Condición</TableHead>
            <TableHead>Costo</TableHead>
            <TableHead>Precio de venta</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((d) => (
            <TableRow key={d.id}>
              <TableCell>
                {d.status === "in_stock" ? (
                  <input
                    type="checkbox"
                    checked={selected.has(d.id)}
                    onChange={() => toggle(d.id)}
                    aria-label={`Seleccionar ${d.model}`}
                  />
                ) : null}
              </TableCell>
              <TableCell>
                <Link href={`/inventario/${d.id}`} className="hover:underline">
                  {d.model} {d.storageGb ? `· ${d.storageGb}GB` : ""}{" "}
                  {d.color ? `· ${d.color}` : ""}
                </Link>
              </TableCell>
              <TableCell className="font-mono text-xs">{d.imei}</TableCell>
              <TableCell className="capitalize">{d.condition}</TableCell>
              <TableCell>
                {d.costAmount && d.costCurrency
                  ? formatCurrency(d.costAmount, d.costCurrency)
                  : "—"}
              </TableCell>
              <TableCell>
                {d.listPriceAmount && d.listPriceCurrency
                  ? formatCurrency(d.listPriceAmount, d.listPriceCurrency)
                  : "—"}
              </TableCell>
              <TableCell>
                <DeviceStatusBadge status={d.status} />
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                No hay dispositivos que coincidan con la búsqueda.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
