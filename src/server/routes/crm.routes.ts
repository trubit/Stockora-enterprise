import { Router } from 'express';
import { CRMController } from '../controllers/crm.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { rbacMiddleware } from '../middleware/rbac.js';
import { SYSTEM_PERMISSIONS } from '../../shared/constants.js';

export const crmRouter = Router();

crmRouter.use(authMiddleware);

crmRouter.get(
  '/dashboard',
  rbacMiddleware([SYSTEM_PERMISSIONS.CUSTOMERS_READ]),
  CRMController.getDashboardData
);

crmRouter.get(
  '/customers/:id/360',
  rbacMiddleware([SYSTEM_PERMISSIONS.CUSTOMERS_READ]),
  CRMController.getCustomer360
);

crmRouter.post(
  '/customers/:id/recalculate',
  rbacMiddleware([SYSTEM_PERMISSIONS.CUSTOMERS_WRITE]),
  CRMController.recalculateMetrics
);

crmRouter.get(
  '/segments',
  rbacMiddleware([SYSTEM_PERMISSIONS.CUSTOMERS_READ]),
  CRMController.getSegments
);

crmRouter.post(
  '/segments',
  rbacMiddleware([SYSTEM_PERMISSIONS.CUSTOMERS_WRITE]),
  CRMController.createSegment
);

crmRouter.get(
  '/campaigns',
  rbacMiddleware([SYSTEM_PERMISSIONS.PROMOTIONS_READ]),
  CRMController.getCampaigns
);

crmRouter.post(
  '/campaigns',
  rbacMiddleware([SYSTEM_PERMISSIONS.PROMOTIONS_WRITE]),
  CRMController.createCampaign
);

crmRouter.post(
  '/campaigns/:id/dispatch',
  rbacMiddleware([SYSTEM_PERMISSIONS.PROMOTIONS_WRITE]),
  CRMController.dispatchCampaign
);

crmRouter.get(
  '/coupons',
  rbacMiddleware([SYSTEM_PERMISSIONS.PROMOTIONS_READ]),
  CRMController.getCoupons
);

crmRouter.post(
  '/coupons',
  rbacMiddleware([SYSTEM_PERMISSIONS.PROMOTIONS_WRITE]),
  CRMController.createCoupon
);

crmRouter.post(
  '/coupons/validate',
  rbacMiddleware([SYSTEM_PERMISSIONS.TRANSACTIONS_WRITE]),
  CRMController.validateCoupon
);

crmRouter.post(
  '/loyalty/earn',
  rbacMiddleware([SYSTEM_PERMISSIONS.CUSTOMERS_WRITE]),
  CRMController.earnLoyaltyPoints
);

crmRouter.post(
  '/loyalty/redeem',
  rbacMiddleware([SYSTEM_PERMISSIONS.CUSTOMERS_WRITE]),
  CRMController.redeemLoyaltyPoints
);

crmRouter.post(
  '/copilot/query',
  rbacMiddleware([SYSTEM_PERMISSIONS.CUSTOMERS_READ]),
  CRMController.copilotQuery
);
