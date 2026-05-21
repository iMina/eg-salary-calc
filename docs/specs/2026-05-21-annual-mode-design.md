# Annual Mode — Design Spec

**Date:** 2026-05-21  
**Status:** Approved

## Summary

Two changes to the Egypt Salary Calculator:
1. **Fact-check / SI cap note** — tax brackets, personal allowance, and SI employee rate are valid for 2026. SI min/max contribution bases (2,700 / 16,700 EGP/month) cannot be independently verified from code; a TODO comment will be added to the constants.
2. **Annual input mode** — a new Monthly / Annual toggle lets the user enter their salary as an annual figure. The calculation engine is unchanged; the annual amount is divided by 12 before being passed to the existing functions.

## Fact-check

| Constant | Value | Status |
|---|---|---|
| Tax brackets | 0/10/15/20/22.5/25/27.5% | Valid (Law No. 30/2023, unchanged through Aug 2025) |
| Personal allowance | 20,000 EGP/year | Valid |
| Employee SI rate | 11% | Valid |
| SI min base | 2,700 EGP/month | **Unverified for 2026** — add TODO |
| SI max base | 16,700 EGP/month | **Unverified for 2026** — add TODO |

## Annual Mode Design

### State

Add `salaryPeriod: "monthly" | "annual"` to `SalaryCalculator` component state, defaulting to `"monthly"`.

### UI — new toggle

A 2-button segmented control (Monthly | Annual) placed directly below the Calculation Mode selector, following the same visual pattern. Uses the same `layoutId` animation approach already used for the mode toggle.

### Calculation bridge

In `performCalculation`, before calling `netFromGross2026` or `grossFromNet2026`:

```
const effectiveAmount = salaryPeriod === "annual" ? numericAmount / 12 : numericAmount;
```

Pass `effectiveAmount` instead of `numericAmount`. No changes to the calculation functions themselves.

### Labels

When `salaryPeriod === "annual"`:
- Gross→Net field label: "Annual Gross Salary"
- Net→Gross field label: "Target Annual Net Salary"

When `salaryPeriod === "monthly"` (unchanged):
- "Monthly Gross Salary"
- "Target Monthly Net Salary"

Add four new strings to `strings.ts`:
- `annualGrossSalary`
- `targetAnnualNetSalary`
- `salaryPeriod` (toggle label)
- `monthly` / `annual` (toggle button labels)

### Results panel

No changes — the results panel already shows both monthly and annual figures.

## Files to change

1. `src/lib/salary-calculator.ts` — add TODO comments on SI constants
2. `src/lib/strings.ts` — add new label strings
3. `src/components/SalaryCalculator.tsx` — add `salaryPeriod` state, toggle UI, and divide-by-12 bridge

## Out of scope

- No changes to the calculation engine functions
- No changes to the results display
- No changes to the currency or exchange rate logic
