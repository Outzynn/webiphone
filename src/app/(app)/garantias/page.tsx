import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { NewWarrantyClaimDialog } from "@/components/new-warranty-claim-dialog";
import { ManageWarrantyClaimDialog } from "@/components/manage-warranty-claim-dialog";

const STATUS_LABEL: Record<string, string> = {
  abierto: "Abierto",
  en_reparacion: "En reparación",
  resuelto: "Resuelto",
};

export default async function GarantiasPage() {
  const supabase = await createClient();

  const [{ data: claims }, { data: devices }, { data: clients }] = await Promise.all([
    supabase
      .from("warranty_claims")
      .select("*, devices(model, imei), clients(name)")
      .order("claim_date", { ascending: false }),
    supabase.from("devices").select("id, model, imei").order("model"),
    supabase.from("clients").select("id, name").order("name"),
  ]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Garantías / postventa</h1>
        <NewWarrantyClaimDialog devices={devices ?? []} clients={clients ?? []} />
      </div>

      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Dispositivo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims?.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.claim_date}</TableCell>
                  <TableCell>
                    {c.devices?.model} ·{" "}
                    <span className="font-mono text-xs">{c.devices?.imei}</span>
                  </TableCell>
                  <TableCell>{c.clients?.name ?? "—"}</TableCell>
                  <TableCell className="max-w-64 truncate">{c.description}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === "resuelto" ? "outline" : "secondary"}>
                      {STATUS_LABEL[c.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ManageWarrantyClaimDialog
                      claimId={c.id}
                      status={c.status}
                      resolutionNotes={c.resolution_notes}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {claims?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Sin reclamos registrados.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
