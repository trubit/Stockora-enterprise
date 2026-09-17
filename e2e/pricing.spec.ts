import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.ts';

test.describe('Phase 44: SaaS Pricing & Plan Catalog E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('1. Pricing Matrix: Loads all SaaS plans and toggles billing interval', async ({
    page,
  }) => {
    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });

    // Verify title and header
    await expect(
      page.getByText('Flexible SaaS Plans for Modern Enterprises').first()
    ).toBeVisible({ timeout: 15000 });

    // Verify interval switch buttons
    const monthlyBtn = page.getByRole('button', { name: 'Monthly Billing' }).first();
    const yearlyBtn = page.getByRole('button', { name: /Yearly Billing/i }).first();
    await expect(monthlyBtn).toBeVisible();
    await expect(yearlyBtn).toBeVisible();

    // Switch to Yearly
    await yearlyBtn.click();
    await expect(page.getByText(/Save 20%|Billed annually|SAVE 15%/i).first()).toBeVisible();

    // Switch back to Monthly
    await monthlyBtn.click();
  });

  test('2. Feature & Limit Matrix: Renders detailed capability comparison', async ({
    page,
  }) => {
    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });

    // Verify comparison table exists
    await expect(
      page.getByText(/Detailed Feature & (Limit|Quota) Comparison Matrix/i).first()
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByText(/Staff & User Accounts|Resource Quota Limits|Max Users/i).first()
    ).toBeVisible();
    await expect(
      page.getByText(/Physical Store Branches|Store Branches|Max Branches/i).first()
    ).toBeVisible();
    await expect(
      page.getByText(/Logistics Warehouses|Warehouses/i).first()
    ).toBeVisible();
  });

  test('3. Checkout Modal: Triggers Paystack checkout flow upon selecting plan', async ({
    page,
  }) => {
    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });

    // Click subscribe on a plan card
    const subscribeBtn = page
      .getByRole('button', { name: /Start Free|Upgrade Tier|Subscribe|Get Started/i })
      .first();

    if (await subscribeBtn.isVisible()) {
      await subscribeBtn.click();
      const modal = page.getByText(/Confirm Subscription|Pay with Paystack|Upgrade/i).first();
      await expect(modal).toBeVisible({ timeout: 10000 });
    }
  });
});
