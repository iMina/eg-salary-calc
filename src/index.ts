export { SalaryCalculator } from "./components/SalaryCalculator";
export type { SalaryCalculatorProps, CalculationMode } from "./components/SalaryCalculator";
export {
  BRACKETS_2026,
  PERSONAL_ALLOWANCE_ANNUAL_2026_RESIDENT,
  SI_MAX_BASE_MONTHLY_2026,
  SI_MIN_BASE_MONTHLY_2026,
  SI_RATE_EMP,
  annualIncomeTax,
  clamp,
  convertCurrency,
  formatCurrency,
  getUsdToEgpRate,
  grossFromNet2026,
  netFromGross2026,
  setUsdToEgpRate,
} from "./lib/salary-calculator";
export type { PayrollResult } from "./lib/salary-calculator";
export { DEFAULT_EXCHANGE_RATE_ENDPOINT, fetchUsdToEgpRate } from "./lib/exchange-rate";
export { salaryCalculatorStrings } from "./lib/strings";
export type { SalaryCalculatorStrings } from "./lib/strings";

