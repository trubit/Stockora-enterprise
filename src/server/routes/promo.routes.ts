import { Router } from 'express';
import { PromoController } from '../controllers/promo.controller.js';
import { authenticate } from '../middleware/auth.js';
import { rbacMiddleware } from '../middleware/rbac.js';

const router = Router();

// --- Promotions & Coupons ---
router.get('/', authenticate, PromoController.listPromotions);
router.post('/', authenticate, rbacMiddleware(['promotions:write']), PromoController.createPromotion);
router.patch('/:id/toggle', authenticate, rbacMiddleware(['promotions:write']), PromoController.togglePromotion);
router.post('/validate', authenticate, PromoController.validatePromotion);

// --- Gift Cards ---
router.get('/gift-cards', authenticate, PromoController.listGiftCards);
router.post('/gift-cards', authenticate, rbacMiddleware(['giftcards:write']), PromoController.createGiftCard);
router.post('/gift-cards/topup', authenticate, rbacMiddleware(['giftcards:write']), PromoController.topUpGiftCard);
router.post('/gift-cards/redeem', authenticate, PromoController.redeemGiftCard);
router.get('/gift-cards/:code/balance', authenticate, PromoController.checkGiftCardBalance);
router.patch('/gift-cards/:code/deactivate', authenticate, rbacMiddleware(['giftcards:write']), PromoController.deactivateGiftCard);

// --- Loyalty ---
router.post('/loyalty', authenticate, PromoController.manageLoyalty);
router.get('/loyalty/leaderboard', authenticate, PromoController.getLoyaltyLeaderboard);
router.get('/loyalty/customer/:customerId', authenticate, PromoController.getCustomerLoyaltyHistory);

export { router as promoRouter };
