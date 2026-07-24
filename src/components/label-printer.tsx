"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Printer, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface DeviceOption {
  id: string;
  model: string;
  imei: string;
  storage_gb: number | null;
  battery_health_pct: number | null;
}

export function LabelPrinter({
  devices,
  labelSize,
  preselectedId,
}: {
  devices: DeviceOption[];
  labelSize: { width: number; height: number };
  preselectedId?: string;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    new Set(preselectedId ? [preselectedId] : []),
  );
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    if (!query.trim()) return devices;
    const q = query.toLowerCase();
    return devices.filter(
      (d) => d.model.toLowerCase().includes(q) || d.imei.includes(q),
    );
  }, [devices, query]);

  const selectedDevices = devices.filter((d) => selected.has(d.id));

  useEffect(() => {
    let cancelled = false;
    async function generate() {
      const entries = await Promise.all(
        selectedDevices.map(async (d) => {
          const url = await QRCode.toDataURL(d.imei, { margin: 0, width: 160 });
          return [d.id, url] as const;
        }),
      );
      if (!cancelled) setQrCodes(Object.fromEntries(entries));
    }
    if (selectedDevices.length > 0) generate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="grid gap-4">
      <style>{`
        @page { size: ${labelSize.width}mm ${labelSize.height}mm; margin: 0; }
        @media print {
          body * { visibility: hidden; }
          .label-print-area, .label-print-area * { visibility: visible; }
          .label-print-area { position: absolute; inset: 0; }
          .label-card { break-after: page; }
          .label-card:last-child { break-after: auto; }
        }
      `}</style>

      <Card className="print:hidden">
        <CardContent className="grid gap-3 pt-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por modelo o IMEI..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button onClick={() => window.print()} disabled={selected.size === 0}>
              <Printer className="h-4 w-4" />
              Imprimir ({selected.size})
            </Button>
          </div>

          <div className="grid max-h-80 gap-1 overflow-y-auto">
            {filtered.map((d) => (
              <label
                key={d.id}
                className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm hover:bg-muted"
              >
                <input
                  type="checkbox"
                  checked={selected.has(d.id)}
                  onChange={() => toggle(d.id)}
                />
                <span>
                  {d.model} {d.storage_gb ? `· ${d.storage_gb}GB` : ""}
                </span>
                <span className="ml-auto font-mono text-xs text-muted-foreground">
                  {d.imei}
                </span>
              </label>
            ))}
            {filtered.length === 0 ? (
              <p className="p-2 text-sm text-muted-foreground">Sin resultados.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="label-print-area grid gap-3">
        {selectedDevices.map((d) => (
          <div
            key={d.id}
            className="label-card flex items-center gap-2 border border-dashed p-2"
            style={{
              width: `${labelSize.width}mm`,
              height: `${labelSize.height}mm`,
            }}
          >
            {qrCodes[d.id] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrCodes[d.id]} alt="" className="h-full shrink-0" />
            ) : null}
            <div className="min-w-0 flex-1 overflow-hidden text-[7px] leading-tight">
              <p className="truncate font-semibold">{d.model}</p>
              <p className="truncate">IMEI: {d.imei}</p>
              <p className="truncate">
                {d.storage_gb ? `${d.storage_gb}GB` : ""}
                {d.battery_health_pct ? ` · Bat. ${d.battery_health_pct}%` : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
