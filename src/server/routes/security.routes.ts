import { Router } from 'express';
import { SecurityController } from '../controllers/security.controller.js';
import { authenticate } from '../middleware/auth.js';
import { rbacMiddleware } from '../middleware/rbac.js';
import { sessionGuard } from '../middleware/sessionGuard.js';

const router = Router();

router.use(authenticate);
router.use(sessionGuard);

router.get('/sessions', SecurityController.listActiveSessions);
router.post('/sessions/:id/revoke', SecurityController.revokeSession);
router.get('/password-policy', SecurityController.getPasswordPolicy);
router.get('/gdpr/:userId', SecurityController.exportGDPRData);

// Admin-only operations
router.post('/users/:id/force-logout', rbacMiddleware(['security:write']), SecurityController.forceLogoutUser);
router.get('/health', rbacMiddleware(['security:read']), SecurityController.getHealthReport);

export { router as securityRouter };
