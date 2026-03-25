export interface ExchangeRateSnapshot {
  rate: number;
  source: string;
  isLive: boolean;
}

interface ExchangeRateResponse {
  source?: string;
  rates?: Array<{
    currencyID?: string;
    sellRate?: number;
  }>;
}

export const DEFAULT_EXCHANGE_RATE_ENDPOINT = "/api/currency-rates";
export const DEFAULT_USD_TO_EGP_RATE = 50.0;

export async function fetchUsdToEgpRate(
  endpoint = DEFAULT_EXCHANGE_RATE_ENDPOINT,
  signal?: AbortSignal
): Promise<ExchangeRateSnapshot> {
  const response = await fetch(endpoint, {
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Exchange rate request failed with status ${response.status}`);
  }

  const data = (await response.json()) as ExchangeRateResponse;
  const byCurrencyId = new Map<string, { sellRate?: number }>(
    (data.rates ?? []).map((rate) => [rate.currencyID ?? "", rate])
  );
  const usdRate = byCurrencyId.get("USD")?.sellRate ?? data.rates?.[0]?.sellRate;

  if (typeof usdRate !== "number" || usdRate <= 0) {
    throw new Error("Exchange rate response did not include a valid USD rate");
  }

  return {
    rate: usdRate,
    source: data.source ?? "unknown",
    isLive: data.source === "cib" || data.source === "google-finance",
  };
}
