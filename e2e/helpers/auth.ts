import { Page } from '@playwright/test';

export async function loginAsAdmin(page: Page) {
  try {
    const res = await page.request.post('/api/v1/auth/login', {
      data: {
        email: process.env.PLATFORM_ADMIN_EMAIL || 'trustezika831@gmail.com',
        password: process.env.INITIAL_ADMIN_PASSWORD || 'Password123!',
      },
      timeout: 5000,
    });

    if (res.ok()) {
      const data = await res.json();
      const tenantId = data.user?.tenantId || '6aa00665eb8878bf76d75e49';
      const tenantSlug = data.user?.tenants?.[0]?.tenantSlug || 'truson-hub';

      await page.addInitScript(
        ({ token, refreshToken, user, tenantId, tenantSlug }) => {
          localStorage.setItem('stockora_token', token);
          localStorage.setItem('stockora_refresh_token', refreshToken);
          localStorage.setItem('stockora_user', JSON.stringify(user));
          localStorage.setItem('stockora_active_tenant_id', tenantId);
          localStorage.setItem('stockora_active_tenant_slug', tenantSlug);
        },
        {
          token: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user,
          tenantId,
          tenantSlug,
        }
      );
      return;
    }
  } catch {
    // continue to fallback
  }

  // Fallback UI Login Flow
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  const emailInput = page.locator('input[name="email"], input[type="email"], #email').first();
  const passwordInput = page.locator('input[name="password"], input[type="password"], #password').first();
  const submitButton = page.locator('button[type="submit"], button:has-text("Sign In")').first();

  await emailInput.fill(process.env.PLATFORM_ADMIN_EMAIL || 'trustezika831@gmail.com');
  await passwordInput.fill(process.env.INITIAL_ADMIN_PASSWORD || 'Password123!');
  await submitButton.click();

  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 }).catch(() => {});
}
