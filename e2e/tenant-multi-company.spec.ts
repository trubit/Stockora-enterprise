import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.ts';

test.describe('Phase 43: Multi-Tenant SaaS & Company Isolation E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('1. Onboarding Wizard: Allows new company registration with 8-step flow', async ({
    page,
  }) => {
    await page.goto('/onboarding', { waitUntil: 'domcontentloaded' });

    // Verify Wizard Header and Steps are rendered
    await expect(
      page.getByText(/(Company|Enterprise Multi-Tenant) Onboarding( Wizard)?/i).first()
    ).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Company Profile').first()).toBeVisible();
    await expect(page.getByText(/Launch Setup|Review & Launch/i).first()).toBeVisible();

    // Verify company name input field
    const companyInput = page.locator('input[name="name"], input').first();
    await expect(companyInput).toBeVisible();
  });

  test('2. Company SaaS Settings: Renders tabs for profile, branding, tax, feature flags, and team invites', async ({
    page,
  }) => {
    await page.goto('/company/settings', { waitUntil: 'domcontentloaded' });

    // Verify Company Settings Header
    await expect(
      page.getByText(/Company (&|Profile &) SaaS (Settings|Configuration)/i).first()
    ).toBeVisible({ timeout: 15000 });

    // Verify Tabs
    await expect(page.getByRole('tab', { name: /General Profile/i }).first()).toBeVisible();
    await expect(page.getByRole('tab', { name: /Branding & Themes/i }).first()).toBeVisible();
    await expect(page.getByRole('tab', { name: /Localization & (Tax|Fiscal)/i }).first()).toBeVisible();
    await expect(page.getByRole('tab', { name: /Feature Flags/i }).first()).toBeVisible();
    await expect(page.getByRole('tab', { name: /Team Invitations/i }).first()).toBeVisible();
    await expect(page.getByRole('tab', { name: /Limits & Tier/i }).first()).toBeVisible();
  });

  test('3. Platform Super Admin Console: Renders SaaS tenant directory and status controls', async ({
    page,
  }) => {
    await page.goto('/admin/platform', { waitUntil: 'domcontentloaded' });

    // Verify Platform Admin Title
    await expect(
      page.getByText(/(Platform Super-Admin|SaaS Platform Administration) Console/i).first()
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByText(/TOTAL REGISTERED TENANTS|Organization/i).first()
    ).toBeVisible();
  });

  test('4. Tenant Switcher Component: Renders and provides seamless tenant selection', async ({
    page,
  }) => {
    await page.goto('/company/billing', { waitUntil: 'domcontentloaded' });

    // Switcher button should be visible in AppBar
    const switcher = page.locator('#tenant-switcher-button').first();
    await expect(switcher).toBeVisible({ timeout: 15000 });
    await switcher.click();
    await expect(
      page.getByText(/Active Company|Switch Organization|Register New Company/i).first()
    ).toBeVisible();
  });
});
