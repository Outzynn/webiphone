import type { CurrencyCode } from "@/lib/database.types";

export function formatCurrency(amount: number, currency: CurrencyCode) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Convierte un monto a la moneda base usando la cotización (ARS por USD) vigente en la operación. */
export function toBaseCurrency(
  amount: number,
  currency: CurrencyCode,
  exchangeRate: number,
  baseCurrency: CurrencyCode,
): number {
  if (currency === baseCurrency) return amount;
  if (currency === "ARS" && baseCurrency === "USD") return amount / exchangeRate;
  if (currency === "USD" && baseCurrency === "ARS") return amount * exchangeRate;
  return amount;
}
