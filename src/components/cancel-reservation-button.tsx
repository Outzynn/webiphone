"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cancelReservation } from "@/lib/actions/reservations";

export function CancelReservationButton({
  reservationId,
  deviceId,
}: {
  reservationId: string;
  deviceId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("¿Cancelar esta reserva? El equipo vuelve a quedar en stock.")) return;
    startTransition(() => cancelReservation(reservationId, deviceId));
  }

  return (
    <Button variant="outline" size="sm" disabled={isPending} onClick={handleClick}>
      <X className="h-4 w-4" />
      Cancelar
    </Button>
  );
}
