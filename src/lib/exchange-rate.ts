export type ExchangeRateSource = "blue" | "oficial" | "manual";

interface DolarApiResponse {
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

/** Trae la cotización venta (ARS por USD) desde dolarapi.com, cacheada 1 hora. */
export async function fetchExchangeRate(
  source: Exclude<ExchangeRateSource, "manual">,
): Promise<{ rate: number; updatedAt: string }> {
  const res = await fetch(`https://dolarapi.com/v1/dolares/${source}`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`No se pudo obtener la cotización (${source}): ${res.status}`);
  }

  const data: DolarApiResponse = await res.json();
  return { rate: data.venta, updatedAt: data.fechaActualizacion };
}
