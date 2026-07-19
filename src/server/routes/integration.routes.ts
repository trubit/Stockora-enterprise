import { Router } from 'express';
import { IntegrationController } from '../controllers/integration.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/sync', authenticate, IntegrationController.triggerSync);
router.post('/stripe-webhook', IntegrationController.stripeWebhook);
router.post('/paystack-webhook', IntegrationController.paystackWebhook);

export { router as integrationRouter };
