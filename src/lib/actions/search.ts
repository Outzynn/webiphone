"use server";

import { createClient } from "@/lib/supabase/server";
import type { DeviceStatus } from "@/lib/database.types";

export interface GlobalSearchResults {
  devices: { id: string; model: string; imei: string; status: DeviceStatus }[];
  clients: { id: string; name: string; phone: string | null }[];
  suppliers: { id: string; name: string }[];
  reservations: {
    id: string;
    deviceId: string;
    clientName: string | null;
    deviceModel: string | null;
  }[];
}

const EMPTY: GlobalSearchResults = {
  devices: [],
  clients: [],
  suppliers: [],
  reservations: [],
};

export async function globalSearch(query: string): Promise<GlobalSearchResults> {
  const q = query.trim();
  if (q.length < 2) return EMPTY;

  const supabase = await createClient();

  const [{ data: devices }, { data: clients }, { data: suppliers }] = await Promise.all([
    supabase
      .from("devices")
      .select("id, model, imei, status")
      .or(`model.ilike.%${q}%,imei.ilike.%${q}%`)
      .limit(5),
    supabase.from("clients").select("id, name, phone").ilike("name", `%${q}%`).limit(5),
    supabase.from("suppliers").select("id, name").ilike("name", `%${q}%`).limit(5),
  ]);

  let reservations: GlobalSearchResults["reservations"] = [];
  if (clients && clients.length > 0) {
    const { data: matched } = await supabase
      .from("reservations")
      .select("id, device_id, devices(model), clients(name)")
      .in(
        "client_id",
        clients.map((c) => c.id),
      )
      .eq("status", "activa")
      .limit(5);

    reservations = (matched ?? []).map((r) => ({
      id: r.id,
      deviceId: r.device_id,
      clientName: r.clients?.name ?? null,
      deviceModel: r.devices?.model ?? null,
    }));
  }

  return {
    devices: devices ?? [],
    clients: clients ?? [],
    suppliers: suppliers ?? [],
    reservations,
  };
}
