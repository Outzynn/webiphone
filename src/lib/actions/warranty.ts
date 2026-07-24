"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { WarrantyStatus } from "@/lib/database.types";

function str(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

export async function createWarrantyClaim(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("warranty_claims").insert({
    device_id: str(formData, "device_id")!,
    client_id: str(formData, "client_id"),
    claim_date: str(formData, "claim_date") ?? undefined,
    description: str(formData, "description")!,
    status: "abierto",
  });
  if (error) throw error;

  revalidatePath("/garantias");
}

export async function updateWarrantyClaim(claimId: string, formData: FormData) {
  const supabase = await createClient();
  const status = str(formData, "status") as WarrantyStatus;

  const { error } = await supabase
    .from("warranty_claims")
    .update({
      status,
      resolution_notes: str(formData, "resolution_notes"),
      resolved_date:
        status === "resuelto"
          ? (str(formData, "resolved_date") ?? new Date().toISOString().slice(0, 10))
          : null,
    })
    .eq("id", claimId);
  if (error) throw error;

  revalidatePath("/garantias");
}

export async function deleteWarrantyClaim(claimId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("warranty_claims").delete().eq("id", claimId);
  if (error) throw error;

  revalidatePath("/garantias");
}
