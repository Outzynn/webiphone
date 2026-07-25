"use server";

import { randomUUID } from "crypto";
import { addDays, addMonths, format } from "date-fns";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSettings, resolveCurrentExchangeRate } from "@/lib/settings";
import { toBaseCurrency } from "@/lib/currency";
import type {
  CurrencyCode,
  DeviceCondition,
  PaymentType,
} from "@/lib/database.types";

type InstallmentFrequency = "semanal" | "quincenal" | "mensual";

function str(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function num(formData: FormData, key: string) {
  const value = str(formData, key);
  return value === null ? null : Number(value);
}

function dueDateFor(startDate: Date, frequency: InstallmentFrequency, index: number) {
  if (frequency === "semanal") return addDays(startDate, index * 7);
  if (frequency === "quincenal") return addDays(startDate, index * 14);
  return addMonths(startDate, index);
}

export async function createSale(formData: FormData) {
  const supabase = await createClient();
  const settings = await getSettings();
  const exchangeRate = await resolveCurrentExchangeRate(settings);

  const deviceId = str(formData, "device_id")!;
  const clientId = str(formData, "client_id");
  const saleAmount = num(formData, "sale_amount")!;
  const saleCurrency = str(formData, "sale_currency") as CurrencyCode;
  const paymentType = str(formData, "payment_type") as PaymentType;
  const saleDate = str(formData, "sale_date") ?? format(new Date(), "yyyy-MM-dd");

  const hasTradeIn = str(formData, "has_trade_in") === "on";
  let tradeInDeviceId: string | null = null;
  let tradeInValueAmount: number | null = null;
  let tradeInValueCurrency: CurrencyCode | null = null;

  if (hasTradeIn) {
    tradeInValueAmount = num(formData, "trade_in_value_amount")!;
    tradeInValueCurrency = str(formData, "trade_in_value_currency") as CurrencyCode;
    tradeInDeviceId = randomUUID();

    const { error: tradeInDeviceError } = await supabase.from("devices").insert({
      id: tradeInDeviceId,
      model: str(formData, "trade_in_model")!,
      storage_gb: num(formData, "trade_in_storage_gb"),
      color: str(formData, "trade_in_color"),
      condition: (str(formData, "trade_in_condition") ?? "usado") as DeviceCondition,
      grade: str(formData, "trade_in_grade") as never,
      battery_health_pct: num(formData, "trade_in_battery_health_pct"),
      imei: str(formData, "trade_in_imei")!,
      serial_number: str(formData, "trade_in_serial_number"),
      status: "in_stock",
      notes: "Recibido como parte de pago (plan canje).",
    });
    if (tradeInDeviceError) throw tradeInDeviceError;

    const { error: tradeInPurchaseError } = await supabase.from("purchases").insert({
      device_id: tradeInDeviceId,
      trade_in_client_id: clientId,
      purchase_date: saleDate,
      cost_amount: tradeInValueAmount,
      cost_currency: tradeInValueCurrency,
      exchange_rate_snapshot: exchangeRate,
      notes: "Tomado en parte de pago de una venta (plan canje).",
    });
    if (tradeInPurchaseError) throw tradeInPurchaseError;
  }

  const netAmount = hasTradeIn
    ? saleAmount -
      toBaseCurrency(tradeInValueAmount!, tradeInValueCurrency!, exchangeRate, saleCurrency)
    : saleAmount;

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      device_id: deviceId,
      client_id: clientId,
      sale_date: saleDate,
      sale_amount: saleAmount,
      sale_currency: saleCurrency,
      exchange_rate_snapshot: exchangeRate,
      payment_type: paymentType,
      trade_in_device_id: tradeInDeviceId,
      trade_in_value_amount: tradeInValueAmount,
      trade_in_value_currency: tradeInValueCurrency,
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
    const frequency = (str(formData, "installment_frequency") ?? "mensual") as InstallmentFrequency;
    const firstDueDate = str(formData, "installment_first_due_date") ?? saleDate;
    const perInstallment = Math.round((netAmount / count) * 100) / 100;
    const startDate = new Date(`${firstDueDate}T00:00:00`);

    const installments = Array.from({ length: count }).map((_, i) => ({
      sale_id: sale.id,
      installment_number: i + 1,
      due_date: format(dueDateFor(startDate, frequency, i), "yyyy-MM-dd"),
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
  revalidatePath("/cuotas");
  revalidatePath("/");
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
  revalidatePath("/cuotas");
  revalidatePath("/");
}

export async function updateInstallment(installmentId: string, formData: FormData) {
  const supabase = await createClient();

  const { data: current, error: fetchError } = await supabase
    .from("installments")
    .select("sale_id")
    .eq("id", installmentId)
    .single();
  if (fetchError) throw fetchError;

  const dueDate = str(formData, "due_date");
  const amount = num(formData, "amount");

  const { error } = await supabase
    .from("installments")
    .update({
      ...(dueDate ? { due_date: dueDate } : {}),
      ...(amount !== null ? { amount } : {}),
    })
    .eq("id", installmentId);
  if (error) throw error;

  revalidatePath(`/ventas/${current.sale_id}`);
  revalidatePath("/cuotas");
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
  revalidatePath("/cuotas");
  revalidatePath("/");
  redirect("/ventas");
}
