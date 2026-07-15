# Tasks: Phase 10 - Finance, Reporting & Business Dashboard

- [x] Implement financial reporting analytics controller (`src/server/controllers/finance.controller.ts` & `src/server/routes/finance.routes.ts`)
  - [x] P&L statements (Revenue, COGS, Gross Profit)
  - [x] Balance Sheet (Assets: inventory valuation, Cash; Liabilities: AP vendor bills; Equity)
  - [x] Cash Flow (Operating inflow sales vs paid outflows)
  - [x] Sales tax collected metrics (8% tax sum)
  - [x] Best sellers ranking and payment methods breakdown
- [x] Mount finance router under `/api/v1` in `src/server/routes/api.ts`
- [x] Create frontend `FinancialReports.tsx` page view (`src/client/pages/admin/FinancialReports.tsx`) displaying real-time aggregated metrics
- [x] Register client route mapping in `src/client/App.tsx` and sidebar link in `Layout.tsx`
- [x] Write Vitest integration tests verifying P&L arithmetic, Balance Sheet formulas, cash flows, and collected tax reports
- [x] Run full project verification (eslint, tsc type-check, production build)
