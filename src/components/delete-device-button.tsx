"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteDevice } from "@/lib/actions/devices";

export function DeleteDeviceButton({ deviceId }: { deviceId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("¿Eliminar este dispositivo? Esta acción no se puede deshacer.")) {
      return;
    }
    startTransition(() => deleteDevice(deviceId));
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={handleClick}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
