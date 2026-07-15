import { Router } from 'express';
import { FinanceController } from '../controllers/finance.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { rbacMiddleware } from '../middleware/rbac.js';
import { SYSTEM_PERMISSIONS } from '../../shared/constants.js';

export const financeRouter = Router();

financeRouter.use(authMiddleware);

financeRouter.get('/reports', rbacMiddleware([SYSTEM_PERMISSIONS.PRODUCTS_READ]), FinanceController.getFinancialReport);
