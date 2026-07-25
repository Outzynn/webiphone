"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import type { CurrencyCode, PaymentType } from "@/lib/database.types";

export interface VentaRow {
  id: string;
  saleDate: string;
  saleAmount: number;
  saleCurrency: CurrencyCode;
  paymentType: PaymentType;
  deviceModel: string | null;
  deviceImei: string | null;
  clientName: string | null;
}

export function VentasTable({ rows }: { rows: VentaRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter(
      (r) =>
        r.deviceModel?.toLowerCase().includes(q) ||
        r.deviceImei?.includes(q) ||
        r.clientName?.toLowerCase().includes(q),
    );
  }, [rows, query]);

  return (
    <div className="grid gap-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por equipo (modelo/IMEI) o cliente..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Dispositivo</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Pago</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <Link href={`/ventas/${r.id}`} className="hover:underline">
                  {r.saleDate}
                </Link>
              </TableCell>
              <TableCell>
                {r.deviceModel} · <span className="font-mono text-xs">{r.deviceImei}</span>
              </TableCell>
              <TableCell>{r.clientName ?? "—"}</TableCell>
              <TableCell>{formatCurrency(r.saleAmount, r.saleCurrency)}</TableCell>
              <TableCell>
                <Badge variant={r.paymentType === "cuotas" ? "secondary" : "outline"}>
                  {r.paymentType}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                {rows.length === 0
                  ? "Todavía no hay ventas registradas."
                  : "Sin resultados para la búsqueda."}
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
