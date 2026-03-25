"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_EXCHANGE_RATE_ENDPOINT,
  DEFAULT_USD_TO_EGP_RATE,
  type ExchangeRateSnapshot,
  fetchUsdToEgpRate,
} from "../lib/exchange-rate";
import {
  formatCurrency,
  getUsdToEgpRate,
  grossFromNet2026,
  netFromGross2026,
  setUsdToEgpRate,
  type PayrollResult,
} from "../lib/salary-calculator";
import {
  salaryCalculatorStrings,
  type SalaryCalculatorStrings,
} from "../lib/strings";

export type CalculationMode = "gross-to-net" | "net-to-gross";

export interface SalaryCalculatorProps {
  exchangeRateEndpoint?: string;
  strings?: SalaryCalculatorStrings;
  className?: string;
}

export function SalaryCalculator({
  exchangeRateEndpoint = DEFAULT_EXCHANGE_RATE_ENDPOINT,
  strings = salaryCalculatorStrings,
  className,
}: SalaryCalculatorProps) {
  const [mode, setMode] = useState<CalculationMode>("gross-to-net");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"EGP" | "USD">("USD");
  const [exchangeRate, setExchangeRate] = useState(0);
  const [customRateInput, setCustomRateInput] = useState("");
  const [result, setResult] = useState<PayrollResult | null>(null);
  const [isLoadingRate, setIsLoadingRate] = useState(true);
  const [fetchedRate, setFetchedRate] = useState<ExchangeRateSnapshot | null>(null);

  async function refreshRate() {
    setIsLoadingRate(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const liveRate = await fetchUsdToEgpRate(exchangeRateEndpoint, controller.signal);
      setUsdToEgpRate(liveRate.rate);
      setFetchedRate(liveRate);
    } catch {
      setFetchedRate({
        rate: DEFAULT_USD_TO_EGP_RATE,
        source: "default",
        isLive: false,
      });
    } finally {
      clearTimeout(timeout);
      setIsLoadingRate(false);
    }
  }

  function performCalculation() {
    const numericAmount = parseFloat(amount);

    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      setResult(null);
      return;
    }

    const rateToUse = exchangeRate || fetchedRate?.rate || getUsdToEgpRate();

    try {
      if (mode === "gross-to-net") {
        setResult(netFromGross2026(numericAmount, currency, rateToUse));
      } else {
        setResult(grossFromNet2026(numericAmount, currency, rateToUse));
      }
    } catch {
      setResult(null);
    }
  }

  function handleCalculate() {
    const numericAmount = parseFloat(amount);

    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      alert(strings.invalidAmount);
      return;
    }

    performCalculation();
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void refreshRate();
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exchangeRateEndpoint]);

  useEffect(() => {
    performCalculation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, amount, currency, exchangeRate, fetchedRate?.rate]);

  return (
    <div className={className ?? "container mx-auto px-4 py-8"}>
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground">{strings.title}</h1>
          <p className="text-xl text-muted-foreground">{strings.description}</p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-6 text-2xl font-semibold text-foreground">
              {strings.calculationParameters}
            </h2>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-foreground">
                {strings.calculationMode}
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setMode("gross-to-net")}
                  className={`rounded-md px-4 py-2 transition-colors ${
                    mode === "gross-to-net"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {strings.grossToNet}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("net-to-gross")}
                  className={`rounded-md px-4 py-2 transition-colors ${
                    mode === "net-to-gross"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {strings.netToGross}
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-foreground">
                {mode === "gross-to-net" ? strings.monthlyGrossSalary : strings.targetMonthlyNetSalary}
              </label>
              <input
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleCalculate();
                  }
                }}
                placeholder={strings.enterAmount}
                className="w-full rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                step="0.01"
                min="0"
              />
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-foreground">{strings.currency}</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCurrency("EGP")}
                  className={`rounded-md px-4 py-2 transition-colors ${
                    currency === "EGP"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {strings.egp}
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency("USD")}
                  className={`rounded-md px-4 py-2 transition-colors ${
                    currency === "USD"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {strings.usd}
                </button>
              </div>
            </div>

            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium text-foreground">
                  {strings.exchangeRate}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    void refreshRate();
                  }}
                  disabled={isLoadingRate}
                  className="rounded bg-secondary px-2 py-1 text-xs text-secondary-foreground hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoadingRate ? "⟳" : "↻"} {strings.refresh}
                </button>
              </div>
              <input
                type="number"
                value={customRateInput}
                placeholder={fetchedRate ? `${fetchedRate.rate}` : "Enter USD to EGP exchange rate"}
                onChange={(event) => {
                  const inputValue = event.target.value;
                  const parsedValue = parseFloat(inputValue);

                  setCustomRateInput(inputValue);

                  if (!Number.isNaN(parsedValue) && parsedValue > 0) {
                    setExchangeRate(parsedValue);
                  } else if (inputValue === "" || inputValue === "-") {
                    setExchangeRate(0);
                  }
                }}
                className="w-full rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                step="0.01"
                min="0.01"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {isLoadingRate
                  ? strings.fetchingRate
                  : fetchedRate
                    ? fetchedRate.isLive
                      ? `${strings.liveRateFetched} ${fetchedRate.rate}`
                      : `${strings.usingFallbackRate} ${fetchedRate.rate}`
                    : strings.clickRefresh}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCalculate}
              className="w-full rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {strings.calculate}
            </button>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-6 text-2xl font-semibold text-foreground">{strings.results}</h2>

            {result ? (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 text-lg font-medium text-foreground">{strings.monthlyBreakdown}</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="font-medium text-muted-foreground">{strings.grossSalary}</div>
                    <div className="text-right font-medium">
                      {formatCurrency(result.monthlyGrossUsd || 0, "USD")}
                    </div>
                    <div className="text-right font-medium">{formatCurrency(result.monthlyGross, "EGP")}</div>

                    <div className="font-medium text-muted-foreground">{strings.employeeSi}</div>
                    <div className="text-right font-medium">
                      {formatCurrency(result.monthlyEmployeeSiUsd || 0, "USD")}
                    </div>
                    <div className="text-right font-medium">
                      {formatCurrency(result.monthlyEmployeeSi, "EGP")}
                    </div>

                    <div className="font-medium text-muted-foreground">{strings.incomeTax}</div>
                    <div className="text-right font-medium">
                      {formatCurrency(result.monthlyIncomeTaxUsd || 0, "USD")}
                    </div>
                    <div className="text-right font-medium">
                      {formatCurrency(result.monthlyIncomeTax, "EGP")}
                    </div>

                    <div className="border-t border-border pt-2 font-medium text-muted-foreground">
                      {strings.takeHomePay}
                    </div>
                    <div className="border-t border-border pt-2 text-right font-bold text-primary">
                      {formatCurrency(result.monthlyTakeHomeUsd || 0, "USD")}
                    </div>
                    <div className="border-t border-border pt-2 text-right font-bold text-primary">
                      {formatCurrency(result.monthlyTakeHome, "EGP")}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-lg font-medium text-foreground">{strings.annualSummary}</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="font-medium text-muted-foreground">{strings.taxableIncome}</div>
                    <div className="text-right font-medium">
                      {formatCurrency(result.annualTaxableIncomeUsd || 0, "USD")}
                    </div>
                    <div className="text-right font-medium">
                      {formatCurrency(result.annualTaxableIncome, "EGP")}
                    </div>

                    <div className="font-medium text-muted-foreground">{strings.incomeTax}</div>
                    <div className="text-right font-medium">
                      {formatCurrency(result.annualIncomeTaxUsd || 0, "USD")}
                    </div>
                    <div className="text-right font-medium">
                      {formatCurrency(result.annualIncomeTax, "EGP")}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>{strings.enterDetails}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-border bg-muted/50 p-6">
          <h3 className="mb-3 text-lg font-medium text-foreground">{strings.aboutCalculator}</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• {strings.basedOn2026}</p>
            <p>• {strings.supportsCurrency}</p>
            <p>• {strings.includesAllowance}</p>
            <p>• {strings.siCalculation}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

