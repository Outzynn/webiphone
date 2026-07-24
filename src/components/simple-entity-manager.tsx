"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Plus, Trash2 } from "lucide-react";

export interface EntityField {
  key: string;
  label: string;
  type?: "text" | "email" | "tel" | "textarea";
  required?: boolean;
}

type Row = Record<string, string | null> & { id: string };

export function SimpleEntityManager({
  table,
  title,
  fields,
  columns,
}: {
  table: "clients" | "suppliers";
  title: string;
  fields: EntityField[];
  columns: EntityField[];
}) {
  const supabase = createClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("name");
    if (error) toast.error(`No se pudo cargar: ${error.message}`);
    setRows((data as unknown as Row[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(row: Row) {
    setEditing(row);
    setOpen(true);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const payload: Record<string, string | null> = {};
    for (const f of fields) {
      const value = formData.get(f.key);
      payload[f.key] = typeof value === "string" && value.trim() !== "" ? value.trim() : null;
    }

    const { error } = editing
      ? await supabase.from(table).update(payload as never).eq("id", editing.id)
      : await supabase.from(table).insert(payload as never);

    setSaving(false);
    if (error) {
      toast.error(`No se pudo guardar: ${error.message}`);
      return;
    }
    toast.success(editing ? "Actualizado" : "Agregado");
    setOpen(false);
    load();
  }

  async function handleDelete(row: Row) {
    if (!confirm(`¿Eliminar "${row.name}"?`)) return;
    const { error } = await supabase.from(table).delete().eq("id", row.id);
    if (error) {
      toast.error(`No se pudo eliminar: ${error.message}`);
      return;
    }
    toast.success("Eliminado");
    load();
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => (
                  <TableHead key={c.key}>{c.label}</TableHead>
                ))}
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((c) => (
                    <TableCell key={c.key}>{row[c.key] ?? "—"}</TableCell>
                  ))}
                  <TableCell className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(row)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(row)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="text-center text-muted-foreground">
                    Sin registros todavía.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar" : "Nuevo"}</DialogTitle>
            </DialogHeader>
            {fields.map((f) => (
              <div key={f.key} className="grid gap-2">
                <Label htmlFor={f.key}>{f.label}</Label>
                {f.type === "textarea" ? (
                  <Textarea
                    id={f.key}
                    name={f.key}
                    defaultValue={editing?.[f.key] ?? ""}
                    rows={3}
                  />
                ) : (
                  <Input
                    id={f.key}
                    name={f.key}
                    type={f.type ?? "text"}
                    required={f.required}
                    defaultValue={editing?.[f.key] ?? ""}
                  />
                )}
              </div>
            ))}
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
