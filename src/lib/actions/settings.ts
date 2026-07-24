"use server";

import { revalidatePath } from "next/cache";
import { updateSetting } from "@/lib/settings";

function str(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

export async function updateAppSettings(formData: FormData) {
  const exchangeRateSource = str(formData, "exchange_rate_source") ?? "blue";
  const manualRate = str(formData, "manual_exchange_rate");
  const labelWidth = Number(str(formData, "label_width_mm") ?? 40);
  const labelHeight = Number(str(formData, "label_height_mm") ?? 30);
  const baseCurrency = str(formData, "base_currency") ?? "USD";

  await Promise.all([
    updateSetting("exchange_rate_source", exchangeRateSource),
    updateSetting("manual_exchange_rate", manualRate ? Number(manualRate) : null),
    updateSetting("label_size_mm", { width: labelWidth, height: labelHeight }),
    updateSetting("base_currency", baseCurrency),
  ]);

  revalidatePath("/configuracion");
  revalidatePath("/");
  revalidatePath("/etiquetas");
}
