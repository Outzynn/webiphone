"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { differenceInCalendarDays } from "date-fns";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EditInstallmentDialog } from "@/components/edit-installment-dialog";
import { markInstallmentPaid } from "@/lib/actions/sales";
import { formatCurrency } from "@/lib/currency";
import type { CurrencyCode } from "@/lib/database.types";

export interface CuotaRow {
  id: string;
  saleId: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  currency: CurrencyCode;
  paid: boolean;
  clientName: string | null;
  deviceModel: string | null;
  deviceImei: string | null;
}

type Filter = "todas" | "pendientes" | "vencidas" | "pagadas";

export function CuotasTable({ rows }: { rows: CuotaRow[] }) {
  const [filter, setFilter] = useState<Filter>("todas");
  const [query, setQuery] = useState("");

  const today = useMemo(() => new Date(new Date().toDateString()), []);

  const enriched = useMemo(
    () =>
      rows.map((r) => {
        const daysOverdue = differenceInCalendarDays(today, new Date(`${r.dueDate}T00:00:00`));
        const overdue = !r.paid && daysOverdue > 0;
        return { ...r, daysOverdue, overdue };
      }),
    [rows, today],
  );

  const searched = enriched.filter(
    (r) => !query.trim() || r.clientName?.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const filtered = searched.filter((r) => {
    if (filter === "pendientes") return !r.paid && !r.overdue;
    if (filter === "vencidas") return r.overdue;
    if (filter === "pagadas") return r.paid;
    return true;
  });

  const counts = {
    todas: searched.length,
    pendientes: searched.filter((r) => !r.paid && !r.overdue).length,
    vencidas: searched.filter((r) => r.overdue).length,
    pagadas: searched.filter((r) => r.paid).length,
  };

  return (
    <div className="grid gap-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {(["todas", "pendientes", "vencidas", "pagadas"] as Filter[]).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
          >
            {f[0].toUpperCase() + f.slice(1)} ({counts[f]})
          </Button>
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vencimiento</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Dispositivo</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-28" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((r) => (
            <CuotaTableRow key={r.id} row={r} />
          ))}
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No hay cuotas en esta vista.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}

function CuotaTableRow({
  row,
}: {
  row: CuotaRow & { daysOverdue: number; overdue: boolean };
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <TableRow>
      <TableCell>{row.dueDate}</TableCell>
      <TableCell>
        <Link href={`/ventas/${row.saleId}`} className="hover:underline">
          {row.clientName ?? "Sin cliente"}
        </Link>
      </TableCell>
      <TableCell>
        {row.deviceModel}{" "}
        <span className="font-mono text-xs text-muted-foreground">{row.deviceImei}</span>
      </TableCell>
      <TableCell>{formatCurrency(row.amount, row.currency)}</TableCell>
      <TableCell>
        {row.paid ? (
          <Badge variant="success">Pagada</Badge>
        ) : row.overdue ? (
          <Badge variant="destructive">Vencida hace {row.daysOverdue}d</Badge>
        ) : (
          <Badge variant="warning">Pendiente</Badge>
        )}
      </TableCell>
      <TableCell className="flex items-center gap-1">
        <Button
          size="sm"
          variant={row.paid ? "secondary" : "outline"}
          disabled={isPending}
          onClick={() =>
            startTransition(() => markInstallmentPaid(row.id, row.saleId, !row.paid))
          }
        >
          {row.paid ? "Pendiente" : "Pagada"}
        </Button>
        <EditInstallmentDialog installmentId={row.id} dueDate={row.dueDate} amount={row.amount} />
      </TableCell>
    </TableRow>
  );
}
