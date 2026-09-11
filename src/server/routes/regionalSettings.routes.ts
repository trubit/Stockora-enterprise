import { Router } from 'express';
import { RegionalSettingsController } from '../controllers/regionalSettings.controller.js';
import { authenticate } from '../middleware/auth.js';
import { resolveTenantContext } from '../middleware/tenant.middleware.js';

export const regionalSettingsRouter = Router();

// Public metadata lists (authenticated)
regionalSettingsRouter.get('/currencies', authenticate, RegionalSettingsController.listCurrencies);
regionalSettingsRouter.get('/countries', authenticate, RegionalSettingsController.listCountries);
regionalSettingsRouter.get('/timezones', authenticate, RegionalSettingsController.listTimezones);
regionalSettingsRouter.get('/languages', authenticate, RegionalSettingsController.listLanguages);

// Tenant-scoped regional settings
regionalSettingsRouter.get(
  '/regional-settings',
  authenticate,
  resolveTenantContext,
  RegionalSettingsController.getSettings
);
regionalSettingsRouter.patch(
  '/regional-settings',
  authenticate,
  resolveTenantContext,
  RegionalSettingsController.updateSettings
);

// Multi-currency exchange rate & conversion endpoints
regionalSettingsRouter.get(
  '/exchange-rates',
  authenticate,
  resolveTenantContext,
  RegionalSettingsController.getExchangeRates
);
regionalSettingsRouter.post(
  '/exchange-rates/convert',
  authenticate,
  resolveTenantContext,
  RegionalSettingsController.convertCurrency
);
regionalSettingsRouter.post(
  '/exchange-rates/custom',
  authenticate,
  resolveTenantContext,
  RegionalSettingsController.setCustomExchangeRate
);

// Server-side tax calculation
regionalSettingsRouter.post(
  '/taxes/calculate',
  authenticate,
  resolveTenantContext,
  RegionalSettingsController.calculateTax
);
