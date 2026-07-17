import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/settings', authenticate, AdminController.getSettings);
router.post('/settings', authenticate, AdminController.updateSettings);
router.get('/audit-logs', authenticate, AdminController.listAuditLogs);

export { router as adminRouter };
