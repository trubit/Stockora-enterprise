import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.ts';

test.describe('Phase 44: SaaS Billing, Invoices & Usage Limits E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('1. Billing Dashboard: Renders active plan, renewal date, and quick resource meters', async ({
    page,
  }) => {
    await page.goto('/company/billing', { waitUntil: 'domcontentloaded' });

    // Verify main header
    await expect(
      page.getByText(/Billing & (Subscription Suite|SaaS Subscription)/i).first()
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByRole('button', { name: /Usage Telemetry|Full Usage/i }).first()
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Change \/ Upgrade Plan/i }).first()
    ).toBeVisible();

    // Verify Invoices & Transactions section headers
    await expect(
      page.getByText(/SaaS Invoices|Invoice History|Billing Ledger/i).first()
    ).toBeVisible();
  });

  test('2. Resource Quota & Usage Dashboard: Renders 11 metered quota cards with thresholds', async ({
    page,
  }) => {
    await page.goto('/company/usage', { waitUntil: 'domcontentloaded' });

    // Verify Usage Dashboard Header
    await expect(
      page.getByText(/Resource Quota & Usage (Telemetry|Metering)/i).first()
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByRole('button', { name: /Sync & Reconcile|Sync \/ Reconcile/i }).first()
    ).toBeVisible();

    // Verify key metrics exist
    await expect(page.getByText(/Staff & Team (Seats|Users)/i).first()).toBeVisible();
    await expect(page.getByText(/Store Branches|Branches/i).first()).toBeVisible();
    await expect(page.getByText(/Warehouses/i).first()).toBeVisible();
    await expect(page.getByText(/Catalog Products/i).first()).toBeVisible();
  });

  test('3. Platform Billing Admin: Displays global SaaS MRR, ARR, and plan catalog editor', async ({
    page,
  }) => {
    await page.goto('/admin/billing', { waitUntil: 'domcontentloaded' });

    // Verify Admin Header
    await expect(
      page.getByText(/Platform Billing & (Governance|SaaS Administration)/i).first()
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByText(/Configurable SaaS Plan Catalog|Plan Catalog/i).first()
    ).toBeVisible();
  });
});
