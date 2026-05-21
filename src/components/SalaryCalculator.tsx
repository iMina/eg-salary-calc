"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import {
  Calculator,
  ArrowRightLeft,
  RefreshCcw,
  DollarSign,
  Info,
  Banknote,
  PiggyBank,
  TrendingUp,
  CreditCard,
  Building,
  CalendarDays,
  CalendarRange,
} from "lucide-react";

export type CalculationMode = "gross-to-net" | "net-to-gross";
export type SalaryPeriod = "monthly" | "annual";
export type SalaryCalculatorAppearance = "standalone" | "embedded";

export interface SalaryCalculatorProps {
  exchangeRateEndpoint?: string;
  strings?: SalaryCalculatorStrings;
  className?: string;
  appearance?: SalaryCalculatorAppearance;
}

export function SalaryCalculator({
  exchangeRateEndpoint = DEFAULT_EXCHANGE_RATE_ENDPOINT,
  strings = salaryCalculatorStrings,
  className,
  appearance = "standalone",
}: SalaryCalculatorProps) {
  const [mode, setMode] = useState<CalculationMode>("gross-to-net");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"EGP" | "USD">("USD");
  const [exchangeRate, setExchangeRate] = useState(0);
  const [customRateInput, setCustomRateInput] = useState("");
  const [result, setResult] = useState<PayrollResult | null>(null);
  const [salaryPeriod, setSalaryPeriod] = useState<SalaryPeriod>("monthly");
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

    // Both calculation functions operate on monthly figures; convert annual input to monthly equivalent.
    const effectiveAmount = salaryPeriod === "annual" ? numericAmount / 12 : numericAmount;
    const rateToUse = exchangeRate || fetchedRate?.rate || getUsdToEgpRate();

    try {
      if (mode === "gross-to-net") {
        setResult(netFromGross2026(effectiveAmount, currency, rateToUse));
      } else {
        setResult(grossFromNet2026(effectiveAmount, currency, rateToUse));
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
  }, [mode, amount, currency, exchangeRate, fetchedRate?.rate, salaryPeriod]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5, 
        staggerChildren: 0.1 
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const isEmbedded = appearance === "embedded";
  const shellClass = isEmbedded
    ? `mx-auto w-full max-w-6xl px-4 py-4 md:px-0 md:py-0 ${className || ""}`.trim()
    : `min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 px-4 py-12 sm:px-6 lg:px-8 flex items-center justify-center ${className || ""}`.trim();
  const contentClass = isEmbedded ? "mx-auto w-full max-w-6xl" : "w-full max-w-5xl";
  const panelClass = isEmbedded
    ? "relative flex h-full flex-col rounded-[2.5rem] border border-border/30 bg-card/55 p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)] backdrop-blur-[25px] sm:p-8"
    : "glass-panel relative flex h-full flex-col rounded-2xl p-6 sm:p-8";
  const resultsPanelClass = isEmbedded
    ? "relative flex h-full flex-col overflow-hidden rounded-[2.5rem] border border-border/30 bg-card/60 p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)] backdrop-blur-[25px] sm:p-8"
    : "glass-panel p-6 sm:p-8 rounded-2xl flex-grow flex flex-col relative overflow-hidden";
  const subPanelClass = isEmbedded
    ? "rounded-[2rem] border border-border/30 bg-card/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
    : "bg-background/40 rounded-xl p-5 border border-border/50";
  const infoPanelClass = isEmbedded
    ? "flex gap-4 rounded-[2rem] border border-border/20 bg-card/45 p-5 backdrop-blur-[25px]"
    : "glass-panel p-5 rounded-xl border border-primary/20 bg-primary/5 flex gap-4";
  const eyebrowClass = isEmbedded
    ? "mb-4 text-xs font-sans font-semibold uppercase tracking-[0.3em] text-primary"
    : "mb-4 inline-flex items-center justify-center rounded-full bg-primary/10 p-4 text-primary ring-1 ring-primary/20 shadow-lg shadow-primary/10";
  const titleClass = isEmbedded
    ? "pb-2 pt-1 font-serif text-4xl font-light leading-[1.05] tracking-normal text-foreground lg:text-6xl"
    : "text-4xl md:text-5xl font-extrabold tracking-tight text-gradient pb-2 pt-1 leading-tight";
  const descriptionClass = isEmbedded
    ? "mx-auto max-w-3xl text-xl font-light leading-relaxed text-muted-foreground lg:text-2xl"
    : "text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto";
  const sectionHeadingClass = isEmbedded
    ? "font-serif text-3xl font-light text-foreground"
    : "text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70";
  const labelClass = isEmbedded
    ? "mb-3 flex items-center gap-2 text-[11px] font-sans font-semibold uppercase tracking-[0.22em] text-primary"
    : "text-sm font-semibold text-foreground/80 mb-3 flex items-center gap-2";
  const fieldLabelClass = isEmbedded
    ? "mb-2 flex items-center gap-2 text-[11px] font-sans font-semibold uppercase tracking-[0.22em] text-primary"
    : "text-sm font-semibold text-foreground/80 mb-2 flex items-center gap-2";
  const sectionSubheadingClass = isEmbedded
    ? "mb-4 flex items-center gap-2 text-xs font-sans font-semibold uppercase tracking-[0.25em] text-primary"
    : "mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2";
  const summaryCardClass = isEmbedded
    ? "relative mt-auto overflow-hidden rounded-[2rem] border border-primary/25 bg-card/75 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-[25px]"
    : "mt-4 p-6 rounded-2xl bg-gradient-to-br from-primary shadow-lg shadow-primary/20 relative overflow-hidden border border-primary-foreground/10";
  const takeHomeLabelClass = isEmbedded
    ? "mb-2 text-[11px] font-sans font-semibold uppercase tracking-[0.24em] text-primary"
    : "text-primary-foreground/80 font-medium mb-1 uppercase tracking-wider text-sm flex items-center gap-2";
  const takeHomeMainClass = isEmbedded
    ? "text-4xl font-serif font-light tracking-tight text-foreground sm:text-5xl"
    : "text-4xl sm:text-5xl font-extrabold text-primary-foreground tracking-tight drop-shadow-sm";
  const takeHomeUsdClass = isEmbedded
    ? "self-start rounded-xl border border-primary/20 bg-primary/12 px-4 py-2 text-xl font-semibold text-foreground sm:self-auto"
    : "text-primary-foreground/90 font-semibold text-xl bg-black/10 px-4 py-2 rounded-xl backdrop-blur-sm shadow-inner self-start sm:self-auto";

  return (
    <div className={shellClass}>
      <motion.div
        className={contentClass}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="mb-12 text-center space-y-4">
          {isEmbedded ? (
            <div className="mb-4 inline-flex items-center justify-center text-primary">
              <Calculator size={32} className="drop-shadow-sm" />
            </div>
          ) : (
            <div className={eyebrowClass}>
              <Calculator size={36} className="drop-shadow-sm" />
            </div>
          )}
          <h1 className={titleClass}>
            {strings.title}
          </h1>
          <p className={descriptionClass}>
            {strings.description}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 items-start lg:grid-cols-12 lg:items-stretch">
          <motion.div variants={itemVariants} className="flex h-full w-full flex-col lg:col-span-5 lg:self-stretch">
            <div className={panelClass}>
              {!isEmbedded && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10" />
              )}
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <ArrowRightLeft size={20} />
                </div>
                <h2 className={sectionHeadingClass}>
                  {strings.calculationParameters}
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className={labelClass}>
                    {strings.calculationMode}
                  </label>
                  <div className="grid grid-cols-2 gap-3 p-1 bg-secondary/50 rounded-xl relative z-10">
                    <button
                      type="button"
                      onClick={() => setMode("gross-to-net")}
                      className={`relative flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                        mode === "gross-to-net" ? "text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                      }`}
                    >
                      {mode === "gross-to-net" && (
                        <motion.div 
                          layoutId="mode-bg" 
                          className="absolute inset-0 bg-primary rounded-lg -z-10 shadow-primary/30 shadow-lg" 
                        />
                      )}
                      <Building size={16} />
                      {strings.grossToNet}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("net-to-gross")}
                      className={`relative flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                        mode === "net-to-gross" ? "text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                      }`}
                    >
                      {mode === "net-to-gross" && (
                        <motion.div 
                          layoutId="mode-bg" 
                          className="absolute inset-0 bg-primary rounded-lg -z-10 shadow-primary/30 shadow-lg" 
                        />
                      )}
                      <Banknote size={16} />
                      {strings.netToGross}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    {strings.salaryPeriod}
                  </label>
                  <div className="grid grid-cols-2 gap-3 p-1 bg-secondary/50 rounded-xl relative z-10">
                    <button
                      type="button"
                      onClick={() => { setSalaryPeriod("monthly"); setAmount(""); }}
                      className={`relative flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                        salaryPeriod === "monthly" ? "text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                      }`}
                    >
                      {salaryPeriod === "monthly" && (
                        <motion.div
                          layoutId="period-bg"
                          className="absolute inset-0 bg-primary rounded-lg -z-10 shadow-primary/30 shadow-lg"
                        />
                      )}
                      <CalendarDays size={16} />
                      {strings.monthly}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSalaryPeriod("annual"); setAmount(""); }}
                      className={`relative flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                        salaryPeriod === "annual" ? "text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                      }`}
                    >
                      {salaryPeriod === "annual" && (
                        <motion.div
                          layoutId="period-bg"
                          className="absolute inset-0 bg-primary rounded-lg -z-10 shadow-primary/30 shadow-lg"
                        />
                      )}
                      <CalendarRange size={16} />
                      {strings.annual}
                    </button>
                  </div>
                </div>

                <div className="group">
                  <label className={fieldLabelClass}>
                    {salaryPeriod === "monthly"
                      ? (mode === "gross-to-net" ? strings.monthlyGrossSalary : strings.targetMonthlyNetSalary)
                      : (mode === "gross-to-net" ? strings.annualGrossSalary : strings.targetAnnualNetSalary)}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                      {currency === "USD" ? (
                        <DollarSign size={18} />
                      ) : (
                        <span className="font-sans text-base font-semibold">E£</span>
                      )}
                    </div>
                    <input
                      type="number"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") handleCalculate();
                      }}
                      placeholder={strings.enterAmount}
                      className="w-full bg-background/50 border-2 border-border/50 rounded-xl pl-10 pr-4 py-3.5 text-lg font-medium shadow-sm transition-all focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className={`${isEmbedded ? "mb-3 block text-[11px] font-sans font-semibold uppercase tracking-[0.22em] text-primary" : "text-sm font-semibold text-foreground/80 mb-3 block"}`}>{strings.currency}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrency("EGP")}
                      className={`flex items-center justify-center p-4 rounded-xl border-2 transition-all ${
                        currency === "EGP"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/50 bg-background/50 text-muted-foreground hover:border-primary/50 hover:bg-primary/5"
                      }`}
                    >
                      <span className="text-xl font-bold">EGP</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrency("USD")}
                      className={`flex items-center justify-center p-4 rounded-xl border-2 transition-all ${
                        currency === "USD"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/50 bg-background/50 text-muted-foreground hover:border-primary/50 hover:bg-primary/5"
                      }`}
                    >
                      <span className="text-xl font-bold">USD</span>
                    </button>
                  </div>
                </div>

                <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <label className={isEmbedded ? "flex items-center gap-2 text-[11px] font-sans font-semibold uppercase tracking-[0.22em] text-primary" : "text-sm font-semibold flex items-center gap-2"}>
                      <TrendingUp size={16} className="text-primary" />
                      {strings.exchangeRate}
                    </label>
                    <button
                      type="button"
                      onClick={() => void refreshRate()}
                      disabled={isLoadingRate}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-background shadow-sm rounded-md text-xs font-medium text-foreground hover:text-primary transition-colors disabled:opacity-50 border border-border/50"
                    >
                      <RefreshCcw size={12} className={isLoadingRate ? "animate-spin text-primary" : ""} />
                      {strings.refresh}
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={customRateInput}
                      placeholder={fetchedRate ? `${fetchedRate.rate}` : "Ex. rate..."}
                      onChange={(event) => {
                        const val = event.target.value;
                        setCustomRateInput(val);
                        const num = parseFloat(val);
                        if (!Number.isNaN(num) && num > 0) setExchangeRate(num);
                        else if (val === "" || val === "-") setExchangeRate(0);
                      }}
                      className="w-full bg-background border border-border/50 rounded-lg px-4 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
                      step="0.01"
                      min="0.01"
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        isLoadingRate
                          ? "bg-amber-400 animate-pulse"
                          : fetchedRate?.isLive
                            ? "bg-emerald-500"
                            : "bg-muted-foreground"
                      }`}
                    />
                    {isLoadingRate
                      ? strings.fetchingRate
                      : fetchedRate
                        ? fetchedRate.isLive
                          ? `${strings.liveRateFetched} ${fetchedRate.rate}`
                          : `${strings.usingFallbackRate} ${fetchedRate.rate}`
                        : strings.clickRefresh}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="flex h-full w-full flex-col lg:col-span-7 lg:self-stretch">
            <div className={resultsPanelClass}>
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
              <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -z-10" />

              <h2 className={`${sectionHeadingClass} mb-6 flex items-center gap-3`}>
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <CreditCard size={20} />
                </div>
                {strings.results}
              </h2>

              <AnimatePresence mode="wait">
                {result ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col h-full justify-between gap-6"
                  >
                    <div className="space-y-6">
                      <div className={subPanelClass}>
                        <h3 className={sectionSubheadingClass}>
                          <Banknote size={16} />
                          {strings.monthlyBreakdown}
                        </h3>
                        <div className="space-y-4">
                          <ResultRow 
                            label={strings.grossSalary} 
                            usd={result.monthlyGrossUsd} 
                            egp={result.monthlyGross} 
                          />
                          <ResultRow 
                            label={strings.employeeSi} 
                            usd={result.monthlyEmployeeSiUsd} 
                            egp={result.monthlyEmployeeSi} 
                          />
                          <ResultRow 
                            label={strings.incomeTax} 
                            usd={result.monthlyIncomeTaxUsd} 
                            egp={result.monthlyIncomeTax} 
                          />
                        </div>
                      </div>

                      <div className={subPanelClass}>
                        <h3 className={sectionSubheadingClass}>
                          <PiggyBank size={16} />
                          {strings.annualSummary}
                        </h3>
                        <div className="space-y-4">
                          <ResultRow 
                            label={strings.taxableIncome} 
                            usd={result.annualTaxableIncomeUsd} 
                            egp={result.annualTaxableIncome} 
                          />
                          <ResultRow 
                            label={"Annual " + strings.incomeTax} 
                            usd={result.annualIncomeTaxUsd} 
                            egp={result.annualIncomeTax} 
                          />
                        </div>
                      </div>
                    </div>

                    <div className={summaryCardClass}>
                      {!isEmbedded && (
                        <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                      )}
                      <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                          <p className={takeHomeLabelClass}>
                            {salaryPeriod === "annual" ? `${strings.monthly} ${strings.takeHomePay}` : strings.takeHomePay}
                          </p>
                          <div className={takeHomeMainClass}>
                            {formatCurrency(result.monthlyTakeHome, "EGP")}
                          </div>
                        </div>
                        <div className={takeHomeUsdClass}>
                          {formatCurrency(result.monthlyTakeHomeUsd || 0, "USD")}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-grow flex flex-col items-center justify-center py-16 text-center"
                  >
                    <div className="w-24 h-24 mb-6 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground border-8 border-background shadow-inner">
                      <Calculator size={40} className="opacity-50" />
                    </div>
                    <h3 className={isEmbedded ? "mb-2 font-serif text-2xl font-light text-foreground" : "text-xl font-bold mb-2"}>{strings.enterDetails}</h3>
                    <p className="text-muted-foreground max-w-sm">
                      Input your salary information in the panel to instantly visualize accurate calculations for 2026.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

        </div>

        <motion.div variants={itemVariants} className="mt-8 w-full">
          <div className={infoPanelClass}>
            <Info className="text-primary shrink-0 mt-0.5" size={20} />
            <div className="grid gap-2 text-sm text-foreground/80 lg:grid-cols-4 lg:gap-6">
              <p className={isEmbedded ? "font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-primary lg:col-span-4" : "font-semibold text-primary lg:col-span-4"}>{strings.aboutCalculator}</p>
              <p>• {strings.basedOn2026}</p>
              <p>• {strings.supportsCurrency}</p>
              <p>• {strings.includesAllowance}</p>
              <p>• {strings.siCalculation}</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function ResultRow({ label, usd, egp }: { label: string, usd?: number, egp: number }) {
  return (
    <div className="flex items-center justify-between text-sm sm:text-base border-b border-border/30 pb-3 last:border-0 last:pb-0">
      <div className="font-medium text-muted-foreground w-1/3">{label}</div>
      <div className="font-semibold tabular-nums text-foreground/80 w-1/3 text-right">
        {formatCurrency(usd || 0, "USD")}
      </div>
      <div className="font-semibold tabular-nums w-1/3 text-right">
        {formatCurrency(egp, "EGP")}
      </div>
    </div>
  );
}
