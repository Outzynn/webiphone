import { createClient } from "@/lib/supabase/server";
import { fetchExchangeRate, type ExchangeRateSource } from "@/lib/exchange-rate";
import type { CurrencyCode } from "@/lib/database.types";

export interface AppSettings {
  exchangeRateSource: ExchangeRateSource;
  manualExchangeRate: number | null;
  labelSizeMm: { width: number; height: number };
  baseCurrency: CurrencyCode;
}

const DEFAULTS: AppSettings = {
  exchangeRateSource: "blue",
  manualExchangeRate: null,
  labelSizeMm: { width: 40, height: 30 },
  baseCurrency: "USD",
};

export async function getSettings(): Promise<AppSettings> {
  const supabase = await createClient();
  const { data } = await supabase.from("app_settings").select("key, value");

  const map = new Map((data ?? []).map((row) => [row.key, row.value]));

  return {
    exchangeRateSource:
      (map.get("exchange_rate_source") as ExchangeRateSource) ??
      DEFAULTS.exchangeRateSource,
    manualExchangeRate:
      (map.get("manual_exchange_rate") as number | null) ??
      DEFAULTS.manualExchangeRate,
    labelSizeMm:
      (map.get("label_size_mm") as AppSettings["labelSizeMm"]) ??
      DEFAULTS.labelSizeMm,
    baseCurrency:
      (map.get("base_currency") as CurrencyCode) ?? DEFAULTS.baseCurrency,
  };
}

export async function updateSetting(key: string, value: unknown) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("app_settings")
    .update({ value: value as never })
    .eq("key", key);
  if (error) throw error;
}

/** Resuelve la cotización ARS/USD actual según la fuente configurada. */
export async function resolveCurrentExchangeRate(
  settings: AppSettings,
): Promise<number> {
  if (settings.exchangeRateSource === "manual") {
    return settings.manualExchangeRate ?? 0;
  }
  const { rate } = await fetchExchangeRate(settings.exchangeRateSource);
  return rate;
}
