import { Router } from 'express';
import { CopilotController } from '../controllers/copilot.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { rbacMiddleware } from '../middleware/rbac.js';
import { SYSTEM_PERMISSIONS } from '../../shared/constants.js';

export const copilotRouter = Router();

copilotRouter.use(authMiddleware);

copilotRouter.post('/chat', CopilotController.chat);
copilotRouter.get('/history/:sessionId', CopilotController.getHistory);

copilotRouter.get('/templates', CopilotController.getTemplates);

copilotRouter.post(
  '/templates',
  rbacMiddleware([SYSTEM_PERMISSIONS.REPORTS_WRITE]),
  CopilotController.saveTemplate
);

copilotRouter.post(
  '/knowledge',
  rbacMiddleware([SYSTEM_PERMISSIONS.REPORTS_WRITE]),
  CopilotController.saveKnowledge
);
