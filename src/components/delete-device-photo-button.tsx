"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteDevicePhoto } from "@/lib/actions/devices";

export function DeleteDevicePhotoButton({
  deviceId,
  photoId,
  storagePath,
}: {
  deviceId: string;
  photoId: string;
  storagePath: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      className="h-6 w-6 rounded-full"
      disabled={isPending}
      onClick={() =>
        startTransition(() => deleteDevicePhoto(deviceId, photoId, storagePath))
      }
      aria-label="Eliminar foto"
    >
      <X className="h-3 w-3" />
    </Button>
  );
}
