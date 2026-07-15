import { Router } from 'express';
import { QuoteController } from '../controllers/quote.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { rbacMiddleware } from '../middleware/rbac.js';
import { SYSTEM_PERMISSIONS } from '../../shared/constants.js';

export const quoteRouter = Router();

quoteRouter.use(authMiddleware);

quoteRouter.get('/', rbacMiddleware([SYSTEM_PERMISSIONS.PRODUCTS_READ]), QuoteController.listQuotes);
quoteRouter.post('/', rbacMiddleware([SYSTEM_PERMISSIONS.PRODUCTS_WRITE]), QuoteController.createQuote);
quoteRouter.put('/:id/accept', rbacMiddleware([SYSTEM_PERMISSIONS.PRODUCTS_WRITE]), QuoteController.acceptQuote);
