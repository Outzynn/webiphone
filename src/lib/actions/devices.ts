"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSettings, resolveCurrentExchangeRate } from "@/lib/settings";
import type { CurrencyCode, DeviceCondition } from "@/lib/database.types";

const PHOTOS_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_PHOTOS_BUCKET ?? "device-photos";

function str(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function num(formData: FormData, key: string) {
  const value = str(formData, key);
  return value === null ? null : Number(value);
}

async function uploadPhotos(deviceId: string, files: File[]) {
  if (files.length === 0) return;
  const supabase = await createClient();

  for (const file of files) {
    if (file.size === 0) continue;
    const path = `${deviceId}/${randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from(PHOTOS_BUCKET)
      .upload(path, file, { contentType: file.type });
    if (uploadError) throw uploadError;

    const { error: insertError } = await supabase
      .from("device_photos")
      .insert({ device_id: deviceId, storage_path: path });
    if (insertError) throw insertError;
  }
}

export async function createDevice(formData: FormData) {
  const supabase = await createClient();
  const settings = await getSettings();
  const exchangeRate = await resolveCurrentExchangeRate(settings);

  const deviceId = randomUUID();

  const { error: deviceError } = await supabase.from("devices").insert({
    id: deviceId,
    model: str(formData, "model")!,
    storage_gb: num(formData, "storage_gb"),
    color: str(formData, "color"),
    condition: str(formData, "condition") as DeviceCondition,
    grade: str(formData, "grade") as never,
    battery_health_pct: num(formData, "battery_health_pct"),
    imei: str(formData, "imei")!,
    serial_number: str(formData, "serial_number"),
    status: "in_stock",
    list_price_amount: num(formData, "list_price_amount"),
    list_price_currency: str(formData, "list_price_currency") as CurrencyCode,
    notes: str(formData, "notes"),
  });
  if (deviceError) throw deviceError;

  const { error: purchaseError } = await supabase.from("purchases").insert({
    device_id: deviceId,
    supplier_id: str(formData, "supplier_id"),
    purchase_date: str(formData, "purchase_date") ?? undefined,
    cost_amount: num(formData, "cost_amount")!,
    cost_currency: str(formData, "cost_currency") as CurrencyCode,
    exchange_rate_snapshot: exchangeRate,
    notes: str(formData, "purchase_notes"),
  });
  if (purchaseError) throw purchaseError;

  const photos = formData.getAll("photos").filter((f): f is File => f instanceof File);
  await uploadPhotos(deviceId, photos);

  revalidatePath("/inventario");
  redirect(`/inventario/${deviceId}`);
}

export async function updateDevice(deviceId: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("devices")
    .update({
      model: str(formData, "model")!,
      storage_gb: num(formData, "storage_gb"),
      color: str(formData, "color"),
      condition: str(formData, "condition") as DeviceCondition,
      grade: str(formData, "grade") as never,
      battery_health_pct: num(formData, "battery_health_pct"),
      imei: str(formData, "imei")!,
      serial_number: str(formData, "serial_number"),
      list_price_amount: num(formData, "list_price_amount"),
      list_price_currency: str(formData, "list_price_currency") as CurrencyCode,
      notes: str(formData, "notes"),
    })
    .eq("id", deviceId);
  if (error) throw error;

  const photos = formData.getAll("photos").filter((f): f is File => f instanceof File);
  await uploadPhotos(deviceId, photos);

  revalidatePath("/inventario");
  revalidatePath(`/inventario/${deviceId}`);
  redirect(`/inventario/${deviceId}`);
}

export async function deleteDevicePhoto(
  deviceId: string,
  photoId: string,
  storagePath: string,
) {
  const supabase = await createClient();
  await supabase.storage.from(PHOTOS_BUCKET).remove([storagePath]);
  const { error } = await supabase
    .from("device_photos")
    .delete()
    .eq("id", photoId);
  if (error) throw error;

  revalidatePath(`/inventario/${deviceId}`);
}

export async function deleteDevice(deviceId: string) {
  const supabase = await createClient();
  const { data: photos } = await supabase
    .from("device_photos")
    .select("storage_path")
    .eq("device_id", deviceId);

  if (photos && photos.length > 0) {
    await supabase.storage
      .from(PHOTOS_BUCKET)
      .remove(photos.map((p) => p.storage_path));
  }

  const { error } = await supabase.from("devices").delete().eq("id", deviceId);
  if (error) throw error;

  revalidatePath("/inventario");
  redirect("/inventario");
}
