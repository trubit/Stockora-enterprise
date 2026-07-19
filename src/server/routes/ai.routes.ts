import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { AIService } from '../services/ai/ai.service.js';
import { ForecastingEngine } from '../services/ai/forecasting.js';
import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { ValidationError } from '../errors/AppError.js';

export const aiRouter = Router();

// Secure all endpoints under auth protection
aiRouter.use(authMiddleware);

// POST /api/v1/ai/assistant
aiRouter.post('/assistant', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return next(new ValidationError('Prompt text is required.'));
  }

  try {
    const aiService = AIService.getInstance();
    const systemInstruction = `
      You are Stockora assistant. Help cashiers and managers run their business operations.
      Respond concisely and professionally in markdown format. Enforce Zero Trust metrics.
    `;
    const reply = await aiService.executePrompt(prompt, systemInstruction);
    res.json({ reply });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/ai/forecasting
aiRouter.get('/forecasting', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const statsReport = await ForecastingEngine.generateReport();
    const aiForecastText = await ForecastingEngine.getAIForecasts();

    res.json({
      report: statsReport,
      aiForecast: aiForecastText,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/ai/metrics
aiRouter.get('/metrics', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const aiService = AIService.getInstance();
    const summary = await aiService.getUsageSummary();
    res.json(summary);
  } catch (err) {
    next(err);
  }
});
