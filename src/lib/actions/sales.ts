"use server";

import { addMonths, format } from "date-fns";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSettings, resolveCurrentExchangeRate } from "@/lib/settings";
import type { CurrencyCode, PaymentType } from "@/lib/database.types";

function str(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function num(formData: FormData, key: string) {
  const value = str(formData, key);
  return value === null ? null : Number(value);
}

export async function createSale(formData: FormData) {
  const supabase = await createClient();
  const settings = await getSettings();
  const exchangeRate = await resolveCurrentExchangeRate(settings);

  const deviceId = str(formData, "device_id")!;
  const saleAmount = num(formData, "sale_amount")!;
  const saleCurrency = str(formData, "sale_currency") as CurrencyCode;
  const paymentType = str(formData, "payment_type") as PaymentType;
  const saleDate = str(formData, "sale_date") ?? format(new Date(), "yyyy-MM-dd");

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      device_id: deviceId,
      client_id: str(formData, "client_id"),
      sale_date: saleDate,
      sale_amount: saleAmount,
      sale_currency: saleCurrency,
      exchange_rate_snapshot: exchangeRate,
      payment_type: paymentType,
      notes: str(formData, "notes"),
    })
    .select("id")
    .single();
  if (saleError) throw saleError;

  const { error: deviceError } = await supabase
    .from("devices")
    .update({ status: "sold" })
    .eq("id", deviceId);
  if (deviceError) throw deviceError;

  if (paymentType === "cuotas") {
    const count = num(formData, "installment_count") ?? 1;
    const perInstallment = Math.round((saleAmount / count) * 100) / 100;
    const startDate = new Date(`${saleDate}T00:00:00`);

    const installments = Array.from({ length: count }).map((_, i) => ({
      sale_id: sale.id,
      installment_number: i + 1,
      due_date: format(addMonths(startDate, i + 1), "yyyy-MM-dd"),
      amount: perInstallment,
      currency: saleCurrency,
      paid: false,
    }));

    const { error: installmentsError } = await supabase
      .from("installments")
      .insert(installments);
    if (installmentsError) throw installmentsError;
  }

  revalidatePath("/ventas");
  revalidatePath("/inventario");
  redirect(`/ventas/${sale.id}`);
}

export async function markInstallmentPaid(
  installmentId: string,
  saleId: string,
  paid: boolean,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("installments")
    .update({ paid, paid_date: paid ? format(new Date(), "yyyy-MM-dd") : null })
    .eq("id", installmentId);
  if (error) throw error;

  revalidatePath(`/ventas/${saleId}`);
}

export async function deleteSale(saleId: string, deviceId: string) {
  const supabase = await createClient();

  const { error: deleteError } = await supabase.from("sales").delete().eq("id", saleId);
  if (deleteError) throw deleteError;

  const { error: deviceError } = await supabase
    .from("devices")
    .update({ status: "in_stock" })
    .eq("id", deviceId);
  if (deviceError) throw deviceError;

  revalidatePath("/ventas");
  revalidatePath("/inventario");
  redirect("/ventas");
}
