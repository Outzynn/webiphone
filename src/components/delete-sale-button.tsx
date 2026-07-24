"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteSale } from "@/lib/actions/sales";

export function DeleteSaleButton({
  saleId,
  deviceId,
}: {
  saleId: string;
  deviceId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (
      !confirm(
        "¿Eliminar esta venta? El dispositivo volverá a quedar en stock.",
      )
    ) {
      return;
    }
    startTransition(() => deleteSale(saleId, deviceId));
  }

  return (
    <Button variant="outline" size="sm" disabled={isPending} onClick={handleClick}>
      <Trash2 className="h-4 w-4" />
      Eliminar venta
    </Button>
  );
}
