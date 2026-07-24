"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { updateWarrantyClaim, deleteWarrantyClaim } from "@/lib/actions/warranty";
import type { WarrantyStatus } from "@/lib/database.types";

export function ManageWarrantyClaimDialog({
  claimId,
  status,
  resolutionNotes,
}: {
  claimId: string;
  status: WarrantyStatus;
  resolutionNotes: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateWarrantyClaim(claimId, formData);
      setOpen(false);
    });
  }

  function handleDelete() {
    if (!confirm("¿Eliminar este reclamo?")) return;
    startTransition(() => deleteWarrantyClaim(claimId));
  }

  return (
    <>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon-sm" onClick={() => setOpen(true)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={handleDelete} disabled={isPending}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Actualizar reclamo</DialogTitle>
            </DialogHeader>

            <div className="grid gap-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                name="status"
                defaultValue={status}
                items={[
                  { value: "abierto", label: "Abierto" },
                  { value: "en_reparacion", label: "En reparación" },
                  { value: "resuelto", label: "Resuelto" },
                ]}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="abierto">Abierto</SelectItem>
                  <SelectItem value="en_reparacion">En reparación</SelectItem>
                  <SelectItem value="resuelto">Resuelto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="resolution_notes">Notas de resolución</Label>
              <Textarea
                id="resolution_notes"
                name="resolution_notes"
                rows={3}
                defaultValue={resolutionNotes ?? ""}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
