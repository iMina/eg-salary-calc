import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Rate = { currencyID: string; buyRate: number; sellRate: number };
type CibResponse = { rates: Rate[] };

const CIB_URL = "https://www.cibeg.com/api/currency/rates";
const DEFAULT_USD_RATE = 50.0;

async function fetchCibRates(): Promise<CibResponse | null> {
  try {
    const response = await fetch(CIB_URL, {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: "https://www.cibeg.com/en/currency-converter",
        Origin: "https://www.cibeg.com",
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return Array.isArray(data?.rates) ? data : null;
  } catch {
    return null;
  }
}

async function fetchGoogleFinanceRate(): Promise<number | null> {
  try {
    const response = await fetch("https://www.google.com/finance/quote/USD-EGP", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const dataLastPriceMatch = html.match(/data-last-price="([\d.]+)"/);

    if (dataLastPriceMatch) {
      return parseFloat(dataLastPriceMatch[1]);
    }

    const classMatch = html.match(/class="YMlKec fxKbKc">([\d.,]+)</);
    if (classMatch) {
      return parseFloat(classMatch[1].replace(/,/g, ""));
    }

    return null;
  } catch {
    return null;
  }
}

export async function GET() {
  const timestamp = new Date().toISOString();
  const cibData = await fetchCibRates();

  if (cibData) {
    return NextResponse.json(
      { ...cibData, source: "cib", timestamp },
      { status: 200 }
    );
  }

  const googleRate = await fetchGoogleFinanceRate();
  if (googleRate) {
    return NextResponse.json(
      {
        rates: [{ currencyID: "USD", buyRate: googleRate, sellRate: googleRate }],
        source: "google-finance",
        timestamp,
      },
      { status: 200 }
    );
  }

  return NextResponse.json(
    {
      rates: [{ currencyID: "USD", buyRate: DEFAULT_USD_RATE, sellRate: DEFAULT_USD_RATE }],
      source: "default",
      timestamp,
    },
    { status: 200 }
  );
}
