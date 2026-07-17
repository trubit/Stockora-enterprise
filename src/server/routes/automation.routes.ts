import { Router } from 'express';
import { AutomationController } from '../controllers/automation.controller.js';
import { authenticate } from '../middleware/auth.js';
import { rbacMiddleware } from '../middleware/rbac.js';

const router = Router();

router.post('/trigger', authenticate, rbacMiddleware(['automation:write']), AutomationController.triggerJob);
router.get('/metrics', authenticate, AutomationController.listQueueMetrics);
router.get('/cron-jobs', authenticate, AutomationController.listCronJobs);
router.post('/queue/:name/pause', authenticate, rbacMiddleware(['automation:write']), AutomationController.pauseQueue);
router.post('/queue/:name/resume', authenticate, rbacMiddleware(['automation:write']), AutomationController.resumeQueue);

export { router as automationRouter };
