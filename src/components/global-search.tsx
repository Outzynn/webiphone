"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, Smartphone, User, Truck, CalendarCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { globalSearch, type GlobalSearchResults } from "@/lib/actions/search";

const EMPTY: GlobalSearchResults = {
  devices: [],
  clients: [],
  suppliers: [],
  reservations: [],
};

function hasResults(r: GlobalSearchResults) {
  return (
    r.devices.length > 0 ||
    r.clients.length > 0 ||
    r.suppliers.length > 0 ||
    r.reservations.length > 0
  );
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResults>(EMPTY);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults(EMPTY);
      setOpen(false);
      return;
    }
    const handle = setTimeout(async () => {
      const r = await globalSearch(query);
      setResults(r);
      setOpen(true);
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function closeAndReset() {
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Buscar equipo, cliente, proveedor o reserva..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (hasResults(results)) setOpen(true);
        }}
        className="pl-8"
      />

      {open ? (
        <div className="absolute z-50 mt-1 w-full max-h-96 overflow-y-auto rounded-md border bg-popover p-2 text-sm shadow-md">
          {!hasResults(results) ? (
            <p className="p-2 text-muted-foreground">Sin resultados.</p>
          ) : (
            <div className="grid gap-3">
              {results.devices.length > 0 ? (
                <ResultGroup title="Dispositivos" icon={Smartphone}>
                  {results.devices.map((d) => (
                    <Link
                      key={d.id}
                      href={`/inventario/${d.id}`}
                      onClick={closeAndReset}
                      className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted"
                    >
                      <span>{d.model}</span>
                      <span className="font-mono text-xs text-muted-foreground">{d.imei}</span>
                    </Link>
                  ))}
                </ResultGroup>
              ) : null}

              {results.clients.length > 0 ? (
                <ResultGroup title="Clientes" icon={User}>
                  {results.clients.map((c) => (
                    <Link
                      key={c.id}
                      href="/clientes"
                      onClick={closeAndReset}
                      className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted"
                    >
                      <span>{c.name}</span>
                      {c.phone ? (
                        <span className="text-xs text-muted-foreground">{c.phone}</span>
                      ) : null}
                    </Link>
                  ))}
                </ResultGroup>
              ) : null}

              {results.suppliers.length > 0 ? (
                <ResultGroup title="Proveedores" icon={Truck}>
                  {results.suppliers.map((s) => (
                    <Link
                      key={s.id}
                      href="/proveedores"
                      onClick={closeAndReset}
                      className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted"
                    >
                      <span>{s.name}</span>
                    </Link>
                  ))}
                </ResultGroup>
              ) : null}

              {results.reservations.length > 0 ? (
                <ResultGroup title="Reservas" icon={CalendarCheck}>
                  {results.reservations.map((r) => (
                    <Link
                      key={r.id}
                      href={`/inventario/${r.deviceId}`}
                      onClick={closeAndReset}
                      className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted"
                    >
                      <span>{r.deviceModel}</span>
                      <span className="text-xs text-muted-foreground">{r.clientName}</span>
                    </Link>
                  ))}
                </ResultGroup>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ResultGroup({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </p>
      <div className="grid">{children}</div>
    </div>
  );
}
