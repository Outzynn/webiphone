"use client";

import { SimpleEntityManager } from "@/components/simple-entity-manager";

const FIELDS = [
  { key: "name", label: "Nombre", required: true },
  { key: "phone", label: "Teléfono", type: "tel" as const },
  { key: "email", label: "Email", type: "email" as const },
  { key: "document_id", label: "DNI / documento" },
  { key: "notes", label: "Notas", type: "textarea" as const },
];

const COLUMNS = FIELDS.filter((f) => f.key !== "notes");

export default function ClientesPage() {
  return (
    <SimpleEntityManager
      table="clients"
      title="Clientes"
      fields={FIELDS}
      columns={COLUMNS}
    />
  );
}
