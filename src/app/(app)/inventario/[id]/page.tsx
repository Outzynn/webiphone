import { notFound } from "next/navigation";
import { Pencil, Tag, ShoppingCart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DeviceStatusBadge } from "@/components/device-status-badge";
import { DeleteDevicePhotoButton } from "@/components/delete-device-photo-button";
import { DeleteDeviceButton } from "@/components/delete-device-button";
import { formatCurrency } from "@/lib/currency";

const PHOTOS_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_PHOTOS_BUCKET ?? "device-photos";

export default async function DeviceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: device } = await supabase
    .from("devices")
    .select(
      "*, purchases(*, suppliers(name), trade_in_clients:clients!purchases_trade_in_client_id_fkey(name)), sales:sales!sales_device_id_fkey(*, clients(name), installments(*)), warranty_claims(*)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!device) notFound();

  const { data: photos } = await supabase
    .from("device_photos")
    .select("id, storage_path")
    .eq("device_id", id);

  let photoUrls: { id: string; url: string; path: string }[] = [];
  if (photos && photos.length > 0) {
    const { data: signed } = await supabase.storage
      .from(PHOTOS_BUCKET)
      .createSignedUrls(
        photos.map((p) => p.storage_path),
        3600,
      );
    photoUrls = photos.map((p, i) => ({
      id: p.id,
      path: p.storage_path,
      url: signed?.[i]?.signedUrl ?? "",
    }));
  }

  const purchase = device.purchases;
  const sale = device.sales;

  return (
    <div className="mx-auto grid max-w-3xl gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {device.model} {device.storage_gb ? `· ${device.storage_gb}GB` : ""}
          </h1>
          <p className="font-mono text-sm text-muted-foreground">{device.imei}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DeviceStatusBadge status={device.status} />
          <LinkButton href={`/etiquetas?device=${device.id}`} variant="outline" size="sm">
            <Tag className="h-4 w-4" />
            Etiqueta
          </LinkButton>
          <LinkButton href={`/inventario/${device.id}/editar`} variant="outline" size="sm">
            <Pencil className="h-4 w-4" />
            Editar
          </LinkButton>
          {device.status === "in_stock" ? (
            <LinkButton href={`/ventas/nueva?device=${device.id}`} size="sm">
              <ShoppingCart className="h-4 w-4" />
              Vender
            </LinkButton>
          ) : null}
          <DeleteDeviceButton deviceId={device.id} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del equipo</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <Field label="Condición" value={device.condition} />
          <Field label="Grado" value={device.grade ?? "—"} />
          <Field label="Color" value={device.color ?? "—"} />
          <Field
            label="Batería"
            value={device.battery_health_pct ? `${device.battery_health_pct}%` : "—"}
          />
          <Field label="N° de serie" value={device.serial_number ?? "—"} />
          {device.notes ? (
            <div className="col-span-full">
              <p className="text-muted-foreground">Notas</p>
              <p>{device.notes}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {photoUrls.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fotos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {photoUrls.map((p) => (
              <div key={p.id} className="relative h-28 w-28 overflow-hidden rounded-md border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className="h-full w-full object-cover" />
                <div className="absolute right-1 top-1">
                  <DeleteDevicePhotoButton
                    deviceId={device.id}
                    photoId={p.id}
                    storagePath={p.path}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {purchase ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compra</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <Field label="Fecha" value={purchase.purchase_date} />
            <Field
              label="Costo"
              value={formatCurrency(purchase.cost_amount, purchase.cost_currency)}
            />
            <Field
              label={purchase.trade_in_clients ? "Cliente (plan canje)" : "Proveedor"}
              value={purchase.trade_in_clients?.name ?? purchase.suppliers?.name ?? "—"}
            />
            <Field
              label="Cotización al comprar"
              value={purchase.exchange_rate_snapshot ?? "—"}
            />
          </CardContent>
        </Card>
      ) : null}

      {sale ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Venta</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <Field label="Fecha" value={sale.sale_date} />
              <Field
                label="Monto"
                value={formatCurrency(sale.sale_amount, sale.sale_currency)}
              />
              <Field label="Cliente" value={sale.clients?.name ?? "—"} />
              <Field label="Forma de pago" value={sale.payment_type} />
            </div>
            {sale.installments && sale.installments.length > 0 ? (
              <>
                <Separator />
                <div className="grid gap-1 text-sm">
                  <p className="font-medium">Cuotas</p>
                  {sale.installments
                    .sort((a, b) => a.installment_number - b.installment_number)
                    .map((inst) => (
                      <div key={inst.id} className="flex items-center justify-between">
                        <span>
                          #{inst.installment_number} · vence {inst.due_date}
                        </span>
                        <span>
                          {formatCurrency(inst.amount, inst.currency)} ·{" "}
                          {inst.paid ? "Pagada" : "Pendiente"}
                        </span>
                      </div>
                    ))}
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {device.warranty_claims && device.warranty_claims.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Garantía / postventa</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {device.warranty_claims.map((claim) => (
              <div key={claim.id} className="rounded-md border p-2">
                <p className="font-medium">
                  {claim.claim_date} — {claim.status}
                </p>
                <p className="text-muted-foreground">{claim.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="capitalize">{value}</p>
    </div>
  );
}
