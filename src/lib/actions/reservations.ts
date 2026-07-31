"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CurrencyCode } from "@/lib/database.types";

function str(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function num(formData: FormData, key: string) {
  const value = str(formData, key);
  return value === null ? null : Number(value);
}

export async function createReservation(formData: FormData) {
  const supabase = await createClient();
  const deviceId = str(formData, "device_id")!;

  const { error: reservationError } = await supabase.from("reservations").insert({
    device_id: deviceId,
    client_id: str(formData, "client_id"),
    reservation_date: str(formData, "reservation_date") ?? undefined,
    deposit_amount: num(formData, "deposit_amount")!,
    deposit_currency: str(formData, "deposit_currency") as CurrencyCode,
    notes: str(formData, "notes"),
  });
  if (reservationError) throw reservationError;

  const { error: deviceError } = await supabase
    .from("devices")
    .update({ status: "reserved" })
    .eq("id", deviceId);
  if (deviceError) throw deviceError;

  revalidatePath("/reservas");
  revalidatePath("/inventario");
  revalidatePath("/");
  redirect("/reservas");
}

export async function cancelReservation(reservationId: string, deviceId: string) {
  const supabase = await createClient();

  const { error: reservationError } = await supabase
    .from("reservations")
    .update({ status: "cancelada" })
    .eq("id", reservationId);
  if (reservationError) throw reservationError;

  const { error: deviceError } = await supabase
    .from("devices")
    .update({ status: "in_stock" })
    .eq("id", deviceId);
  if (deviceError) throw deviceError;

  revalidatePath("/reservas");
  revalidatePath("/inventario");
  revalidatePath("/");
}
