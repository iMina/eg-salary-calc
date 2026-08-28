import assert from "node:assert/strict";
import test from "node:test";

import * as salaryCalculator from "../src/lib/salary-calculator.ts";
import type { PayrollResult } from "../src/lib/salary-calculator.ts";

const { annualIncomeTax, grossFromNet2026, netFromGross2026 } = salaryCalculator;

test("opens with EGP as the default currency", () => {
  const defaultCurrency = (
    salaryCalculator as typeof salaryCalculator & {
      DEFAULT_CURRENCY?: string;
    }
  ).DEFAULT_CURRENCY;

  assert.equal(defaultCurrency, "EGP");
});

test("withdraws lower tax bands for annual taxable income between EGP 900k and EGP 1.2m", () => {
  assert.equal(annualIncomeTax(1_157_956), 279_487.5);
});

test("applies each 2026 income-based tax regime", () => {
  const cases = [
    { taxable: 500_000, tax: 99_750 },
    { taxable: 650_000, tax: 141_250 },
    { taxable: 750_000, tax: 169_000 },
    { taxable: 850_000, tax: 197_500 },
    { taxable: 1_000_000, tax: 240_000 },
    { taxable: 1_300_000, tax: 327_500 },
  ];

  for (const { taxable, tax } of cases) {
    assert.equal(annualIncomeTax(taxable), tax, `taxable income ${taxable}`);
  }
});

test("rounds annual taxable income down to the nearest EGP 10 before calculating tax", () => {
  assert.equal(annualIncomeTax(600_009), 124_750);
  assert.equal(annualIncomeTax(600_010), 128_752.5);
});

test("deducts the Martyrs Fund contribution from EGP 100k monthly gross", () => {
  const result = netFromGross2026(100_000);

  assert.equal(result.monthlyEmployeeSi, 1_837);
  assert.equal(result.monthlyIncomeTax, 23_290.63);
  assert.equal(result.monthlyMartyrsFund, 50);
  assert.equal(result.monthlyTakeHome, 74_822.38);
});

test("uses an edited employee SI deduction in tax and take-home calculations", () => {
  const result = netFromGross2026(100_000, "EGP", undefined, true, 1_000);

  assert.equal(result.monthlyEmployeeSi, 1_000);
  assert.equal(result.annualTaxableIncome, 1_168_000);
  assert.equal(result.monthlyIncomeTax, 23_500);
  assert.equal(result.monthlyMartyrsFund, 50);
  assert.equal(result.monthlyTakeHome, 75_450);
});

test("uses the edited employee SI deduction when solving net to gross", () => {
  const result = grossFromNet2026(75_450, "EGP", undefined, 0.01, 200, 1_000);

  assert.ok(Math.abs(result.monthlyGross - 100_000) <= 0.25);
  assert.equal(result.monthlyEmployeeSi, 1_000);
  assert.equal(result.monthlyTakeHome, 75_450);
});

test("highlights take-home in gross-to-net mode and gross in net-to-gross mode", () => {
  const getPrimaryResult = (
    salaryCalculator as typeof salaryCalculator & {
      getPrimaryResult?: (mode: string, result: PayrollResult) => unknown;
    }
  ).getPrimaryResult;
  const result = {
    monthlyGross: 100_000,
    monthlyTakeHome: 74_822.38,
  } as PayrollResult;

  assert.equal(typeof getPrimaryResult, "function");
  assert.deepEqual(getPrimaryResult("gross-to-net", result), {
    kind: "take-home",
    monthlyEgp: 74_822.38,
  });
  assert.deepEqual(getPrimaryResult("net-to-gross", result), {
    kind: "gross",
    monthlyEgp: 100_000,
  });
});
