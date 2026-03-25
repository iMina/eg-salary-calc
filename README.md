# eg-salary-calc

Standalone Egyptian salary calculator built with Next.js.

## What is included

- A reusable `SalaryCalculator` React component
- Egyptian payroll calculation utilities for 2026 resident taxation
- A Next.js API route for live USD/EGP exchange rates with fallbacks
- A standalone app entrypoint so the calculator can be deployed on its own

## Local development

```bash
pnpm install
pnpm dev
```

## Reuse from another Next.js app

When this repository is added as a git submodule, import the component from `src/index.ts` and optionally re-export the API route:

```ts
import { SalaryCalculator } from "@eg-salary-calc";
```

```ts
export { GET, dynamic, revalidate } from "@eg-salary-calc/app/api/currency-rates/route";
```
