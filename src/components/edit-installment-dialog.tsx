"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { updateInstallment } from "@/lib/actions/sales";

export function EditInstallmentDialog({
  installmentId,
  dueDate,
  amount,
}: {
  installmentId: string;
  dueDate: string;
  amount: number;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateInstallment(installmentId, formData);
      setOpen(false);
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        aria-label="Editar cuota"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Editar cuota</DialogTitle>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor={`due_date-${installmentId}`}>Vencimiento</Label>
              <Input
                id={`due_date-${installmentId}`}
                name="due_date"
                type="date"
                defaultValue={dueDate}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`amount-${installmentId}`}>Monto</Label>
              <Input
                id={`amount-${installmentId}`}
                name="amount"
                type="number"
                min={0}
                step="0.01"
                defaultValue={amount}
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
