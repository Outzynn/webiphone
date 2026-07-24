"use client";

import { SimpleEntityManager } from "@/components/simple-entity-manager";

const FIELDS = [
  { key: "name", label: "Nombre", required: true },
  { key: "phone", label: "Teléfono", type: "tel" as const },
  { key: "notes", label: "Notas", type: "textarea" as const },
];

const COLUMNS = FIELDS.filter((f) => f.key !== "notes");

export default function ProveedoresPage() {
  return (
    <SimpleEntityManager
      table="suppliers"
      title="Proveedores"
      fields={FIELDS}
      columns={COLUMNS}
    />
  );
}
