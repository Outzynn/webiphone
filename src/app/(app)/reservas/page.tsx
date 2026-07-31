import { Plus, ShoppingCart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/link-button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CancelReservationButton } from "@/components/cancel-reservation-button";
import { formatCurrency } from "@/lib/currency";
import type { ReservationStatus } from "@/lib/database.types";

const STATUS_LABEL: Record<ReservationStatus, string> = {
  activa: "Activa",
  convertida: "Convertida",
  cancelada: "Cancelada",
};

const STATUS_VARIANT: Record<ReservationStatus, "warning" | "success" | "outline"> = {
  activa: "warning",
  convertida: "success",
  cancelada: "outline",
};

export default async function ReservasPage() {
  const supabase = await createClient();
  const { data: reservations } = await supabase
    .from("reservations")
    .select(
      "id, device_id, client_id, reservation_date, deposit_amount, deposit_currency, status, devices(model, imei, storage_gb), clients(name, phone)",
    )
    .order("created_at", { ascending: false });

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Reservas</h1>
        <LinkButton href="/reservas/nueva">
          <Plus className="h-4 w-4" />
          Nueva reserva
        </LinkButton>
      </div>

      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Dispositivo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Seña</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-48" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations?.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.reservation_date}</TableCell>
                  <TableCell>
                    {r.devices?.model}{" "}
                    {r.devices?.storage_gb ? `· ${r.devices.storage_gb}GB` : ""}{" "}
                    <span className="font-mono text-xs text-muted-foreground">
                      {r.devices?.imei}
                    </span>
                  </TableCell>
                  <TableCell>{r.clients?.name ?? "—"}</TableCell>
                  <TableCell>{formatCurrency(r.deposit_amount, r.deposit_currency)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    {r.status === "activa" ? (
                      <>
                        <LinkButton
                          href={`/ventas/nueva?device=${r.device_id}${r.client_id ? `&client=${r.client_id}` : ""}`}
                          size="sm"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Vender
                        </LinkButton>
                        <CancelReservationButton reservationId={r.id} deviceId={r.device_id} />
                      </>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
              {reservations?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No hay reservas registradas.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
