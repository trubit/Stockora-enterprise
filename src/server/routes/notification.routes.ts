import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.js';
import { rbacMiddleware } from '../middleware/rbac.js';

const router = Router();

// --- User notifications ---
router.get('/', authenticate, NotificationController.listNotifications);
router.patch('/:id/read', authenticate, NotificationController.markRead);
router.patch('/mark-all-read', authenticate, NotificationController.markAllRead);
router.delete('/:id', authenticate, NotificationController.deleteNotification);

// --- Broadcast (admin/manager) ---
router.post('/broadcast', authenticate, rbacMiddleware(['notifications:write']), NotificationController.broadcast);

// --- Templates ---
router.get('/templates', authenticate, NotificationController.listTemplates);
router.post('/templates', authenticate, rbacMiddleware(['notifications:write']), NotificationController.createTemplate);
router.put('/templates/:id', authenticate, rbacMiddleware(['notifications:write']), NotificationController.updateTemplate);
router.delete('/templates/:id', authenticate, rbacMiddleware(['notifications:write']), NotificationController.deleteTemplate);
router.post('/templates/send', authenticate, rbacMiddleware(['notifications:write']), NotificationController.sendFromTemplate);

export { router as notificationRouter };
