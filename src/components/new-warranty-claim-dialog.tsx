"use client";

import { useRef, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { createWarrantyClaim } from "@/lib/actions/warranty";

export function NewWarrantyClaimDialog({
  devices,
  clients,
}: {
  devices: { id: string; model: string; imei: string }[];
  clients: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createWarrantyClaim(formData);
      setOpen(false);
      formRef.current?.reset();
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Nuevo reclamo
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Nuevo reclamo de garantía</DialogTitle>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="device_id">Dispositivo</Label>
            <Select
              name="device_id"
              items={devices.map((d) => ({ value: d.id, label: `${d.model} · ${d.imei}` }))}
              required
            >
              <SelectTrigger id="device_id" className="w-full">
                <SelectValue placeholder="Elegir dispositivo" />
              </SelectTrigger>
              <SelectContent>
                {devices.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.model} · {d.imei}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="client_id">Cliente</Label>
            <Select
              name="client_id"
              items={clients.map((c) => ({ value: c.id, label: c.name }))}
            >
              <SelectTrigger id="client_id" className="w-full">
                <SelectValue placeholder="Sin cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="claim_date">Fecha del reclamo</Label>
            <Input
              id="claim_date"
              name="claim_date"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" name="description" rows={3} required />
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
