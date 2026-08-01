# Tasks: Phase 10 - Finance, Reporting & Business Dashboard

- [x] Implement financial reporting analytics controller (`src/server/controllers/finance.controller.ts` & `src/server/routes/finance.routes.ts`)
  - [x] P&L statements (Revenue, COGS, Gross Profit)
  - [x] Balance Sheet (Assets: inventory valuation, Cash; Liabilities: AP vendor bills; Equity)
  - [x] Cash Flow (Operating inflow sales vs paid outflows)
  - [x] Sales tax collected metrics (8% tax sum)
  - [x] Best sellers ranking and payment methods breakdown
- [x] Mount finance router under `/api/v1` in `src/server/routes/api.ts`
- [x] **Phase 1: Environment & Config Updates**
  - [x] Add `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`, `PAYSTACK_WEBHOOK_SECRET`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET` configuration mappings to `src/config/environment.ts`

- [/] **Phase 2: Payment Service (`payment.service.ts`)**
  - [/] Implement robust `PaymentService` class utilizing `ResilientExecutor.execute`
  - [/] Implement Paystack integration: `initializePaystack`, `verifyPaystack`, and `refundPaystack`
  - [/] Implement Stripe integration: `initializeStripe`, `verifyStripe`, and `refundStripe`
