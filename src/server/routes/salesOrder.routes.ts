import { Router } from 'express';
import { SalesOrderController } from '../controllers/salesOrder.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { rbacMiddleware } from '../middleware/rbac.js';
import { SYSTEM_PERMISSIONS } from '../../shared/constants.js';

export const salesOrderRouter = Router();

salesOrderRouter.use(authMiddleware);

salesOrderRouter.get('/', rbacMiddleware([SYSTEM_PERMISSIONS.PRODUCTS_READ]), SalesOrderController.listOrders);
salesOrderRouter.post('/', rbacMiddleware([SYSTEM_PERMISSIONS.PRODUCTS_WRITE]), SalesOrderController.createOrder);
salesOrderRouter.post('/:id/ship', rbacMiddleware([SYSTEM_PERMISSIONS.PRODUCTS_WRITE]), SalesOrderController.dispatchShipment);
