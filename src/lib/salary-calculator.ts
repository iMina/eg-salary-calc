// Egyptian Salary Calculator - TypeScript implementation
// Based on the 2026 Egyptian employment tax model

let currentUsdToEgpRate = 50.0;

export function getUsdToEgpRate(): number {
  return currentUsdToEgpRate;
}

export function setUsdToEgpRate(rate: number): void {
  if (rate > 0) {
    currentUsdToEgpRate = rate;
  }
}

export function convertCurrency(
  amount: number,
  fromCurrency: "EGP" | "USD",
  toCurrency: "EGP" | "USD",
  exchangeRate?: number
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rate = exchangeRate ?? getUsdToEgpRate();

  if (fromCurrency === "USD" && toCurrency === "EGP") {
    return amount * rate;
  }

  if (fromCurrency === "EGP" && toCurrency === "USD") {
    return amount / rate;
  }

  throw new Error(`Unsupported currency conversion: ${fromCurrency} to ${toCurrency}`);
}

export const BRACKETS_2026 = [
  { upper: 40_000, rate: 0.0 },
  { upper: 55_000, rate: 0.1 },
  { upper: 70_000, rate: 0.15 },
  { upper: 200_000, rate: 0.2 },
  { upper: 400_000, rate: 0.225 },
  { upper: 1_200_000, rate: 0.25 },
  { upper: Infinity, rate: 0.275 },
] as const;

export const SI_RATE_EMP = 0.11;
// TODO: Verify against the latest Social Insurance Authority circular for 2026 — updated annually.
export const SI_MIN_BASE_MONTHLY_2026 = 2_700.0;
// TODO: Verify against the latest Social Insurance Authority circular for 2026 — updated annually.
export const SI_MAX_BASE_MONTHLY_2026 = 16_700.0;
export const PERSONAL_ALLOWANCE_ANNUAL_2026_RESIDENT = 20_000.0;

export function clamp(value: number, lower: number, upper: number): number {
  return Math.max(lower, Math.min(upper, value));
}

export function annualIncomeTax(annualTaxable: number): number {
  let tax = 0.0;
  let lower = 0.0;
  let remaining = annualTaxable;

  for (const bracket of BRACKETS_2026) {
    const bandSize = Math.min(remaining, bracket.upper - lower);

    if (bandSize > 0) {
      tax += bandSize * bracket.rate;
      remaining -= bandSize;
      lower = bracket.upper;
    }

    if (remaining <= 0) {
      break;
    }
  }

  return Math.max(tax, 0.0);
}

export interface PayrollResult {
  monthlyGross: number;
  monthlyEmployeeSi: number;
  monthlyIncomeTax: number;
  monthlyTakeHome: number;
  annualTaxableIncome: number;
  annualIncomeTax: number;
  monthlyGrossUsd?: number;
  monthlyEmployeeSiUsd?: number;
  monthlyIncomeTaxUsd?: number;
  monthlyTakeHomeUsd?: number;
  annualTaxableIncomeUsd?: number;
  annualIncomeTaxUsd?: number;
}

export function netFromGross2026(
  monthlyBaseSalary: number,
  currency: "EGP" | "USD" = "EGP",
  exchangeRate?: number,
  resident = true
): PayrollResult {
  const rate = exchangeRate ?? getUsdToEgpRate();
  const monthlyGrossEgp =
    currency === "USD" ? convertCurrency(monthlyBaseSalary, "USD", "EGP", rate) : monthlyBaseSalary;

  const siBaseMonthly = clamp(monthlyGrossEgp, SI_MIN_BASE_MONTHLY_2026, SI_MAX_BASE_MONTHLY_2026);
  const employeeSiMonthly = SI_RATE_EMP * siBaseMonthly;

  const annualGross = monthlyGrossEgp * 12.0;
  const annualSi = employeeSiMonthly * 12.0;
  const personalAllowance = resident ? PERSONAL_ALLOWANCE_ANNUAL_2026_RESIDENT : 0.0;
  const annualTaxable = Math.max(annualGross - annualSi - personalAllowance, 0.0);
  const incomeTaxAnnual = annualIncomeTax(annualTaxable);
  const incomeTaxMonthly = incomeTaxAnnual / 12.0;
  const takeHomeMonthly = monthlyGrossEgp - employeeSiMonthly - incomeTaxMonthly;

  const monthlyGrossUsd = currency === "USD" ? monthlyBaseSalary : monthlyGrossEgp / rate;
  const monthlyEmployeeSiUsd = employeeSiMonthly / rate;
  const monthlyIncomeTaxUsd = incomeTaxMonthly / rate;
  const monthlyTakeHomeUsd = takeHomeMonthly / rate;
  const annualTaxableIncomeUsd = annualTaxable / rate;
  const annualIncomeTaxUsd = incomeTaxAnnual / rate;

  return {
    monthlyGross: Math.round(monthlyGrossEgp * 100) / 100,
    monthlyEmployeeSi: Math.round(employeeSiMonthly * 100) / 100,
    monthlyIncomeTax: Math.round(incomeTaxMonthly * 100) / 100,
    monthlyTakeHome: Math.round(takeHomeMonthly * 100) / 100,
    annualTaxableIncome: Math.round(annualTaxable * 100) / 100,
    annualIncomeTax: Math.round(incomeTaxAnnual * 100) / 100,
    monthlyGrossUsd: Math.round(monthlyGrossUsd * 100) / 100,
    monthlyEmployeeSiUsd: Math.round(monthlyEmployeeSiUsd * 100) / 100,
    monthlyIncomeTaxUsd: Math.round(monthlyIncomeTaxUsd * 100) / 100,
    monthlyTakeHomeUsd: Math.round(monthlyTakeHomeUsd * 100) / 100,
    annualTaxableIncomeUsd: Math.round(annualTaxableIncomeUsd * 100) / 100,
    annualIncomeTaxUsd: Math.round(annualIncomeTaxUsd * 100) / 100,
  };
}

export function grossFromNet2026(
  targetMonthlyNet: number,
  currency: "EGP" | "USD" = "EGP",
  exchangeRate?: number,
  tolerance = 0.01,
  maxIterations = 200
): PayrollResult {
  const rate = exchangeRate ?? getUsdToEgpRate();
  const targetEgp =
    currency === "USD" ? convertCurrency(targetMonthlyNet, "USD", "EGP", rate) : targetMonthlyNet;

  const netAtZeroGross = netFromGross2026(0.0, "EGP", rate).monthlyTakeHome;
  if (targetEgp <= netAtZeroGross) {
    return netFromGross2026(0.0, "EGP", rate);
  }

  let lower = 0.0;
  let upper = Math.max(targetEgp + 20_000.0, 20_000.0);

  while (netFromGross2026(upper, "EGP", rate).monthlyTakeHome < targetEgp && upper < 100_000_000.0) {
    upper *= 2.0;
  }

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const midpoint = 0.5 * (lower + upper);
    const netAtMidpoint = netFromGross2026(midpoint, "EGP", rate).monthlyTakeHome;

    if (Math.abs(netAtMidpoint - targetEgp) <= tolerance) {
      return netFromGross2026(midpoint, "EGP", rate);
    }

    if (netAtMidpoint < targetEgp) {
      lower = midpoint;
    } else {
      upper = midpoint;
    }
  }

  return netFromGross2026(0.5 * (lower + upper), "EGP", rate);
}

export function formatCurrency(amount: number, currency: "EGP" | "USD"): string {
  return `${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

