import { Badge } from "@/components/ui/badge";
import type { DeviceStatus } from "@/lib/database.types";

const LABELS: Record<DeviceStatus, string> = {
  in_stock: "Disponible",
  reserved: "Reservado",
  sold: "Vendido",
};

const VARIANTS: Record<DeviceStatus, "success" | "warning" | "outline"> = {
  in_stock: "success",
  reserved: "warning",
  sold: "outline",
};

export function DeviceStatusBadge({ status }: { status: DeviceStatus }) {
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>;
}
