import mongoose, { Schema } from 'mongoose';
import { logger } from '../../logger.js';
import { ResilientExecutor } from '../../utils/resiliency/index.js';
import {
  type AIProvider,
  OpenAIProvider,
  ClaudeProvider,
  GeminiProvider,
  OllamaProvider,
  MockAIProvider,
} from './providers.js';

// ---- AI Usage Log Schema & Mongoose Model ------------------------------------

export interface IAIUsageLog {
  providerName: string;
  prompt: string;
  response: string;
  promptTokens: number;
  completionTokens: number;
  estimatedCost: number;
  createdAt: Date;
}

const AIUsageLogSchema = new Schema<IAIUsageLog>({
  providerName: { type: String, required: true },
  prompt: { type: String, required: true },
  response: { type: String, required: true },
  promptTokens: { type: Number, required: true },
  completionTokens: { type: Number, required: true },
  estimatedCost: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Reuse or register compilation model safely
export const AIUsageLog =
  mongoose.models.AIUsageLog || mongoose.model<IAIUsageLog>('AIUsageLog', AIUsageLogSchema);

// ---- Central AI Service -----------------------------------------------------

export class AIService {
  private static instance: AIService | null = null;
  private provider: AIProvider;

  private constructor() {
    this.provider = this.initializeProvider();
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private initializeProvider(): AIProvider {
    const configProvider = (process.env.AI_PROVIDER || 'MOCK').toUpperCase();

    switch (configProvider) {
      case 'OPENAI': {
        const key = process.env.OPENAI_API_KEY;
        if (!key || key === 'your_openai_api_key') {
          logger.warn('[AI Service] OpenAI API Key missing. Falling back to Mock AI Provider.');
          return new MockAIProvider();
        }
        return new OpenAIProvider(key, process.env.OPENAI_MODEL || 'gpt-4o-mini');
      }
      case 'CLAUDE': {
        const key = process.env.CLAUDE_API_KEY;
        if (!key) {
          logger.warn('[AI Service] Claude API Key missing. Falling back to Mock AI Provider.');
          return new MockAIProvider();
        }
        return new ClaudeProvider(key, process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022');
      }
      case 'GEMINI': {
        const key = process.env.GEMINI_API_KEY;
        if (!key) {
          logger.warn('[AI Service] Gemini API Key missing. Falling back to Mock AI Provider.');
          return new MockAIProvider();
        }
        return new GeminiProvider(key, process.env.GEMINI_MODEL || 'gemini-1.5-flash');
      }
      case 'OLLAMA': {
        const host = process.env.OLLAMA_HOST || 'http://localhost:11434';
        const model = process.env.OLLAMA_MODEL || 'llama3';
        return new OllamaProvider(host, model);
      }
      case 'MOCK':
      default:
        logger.info('[AI Service] Utilizing local Heuristics Mock AI Provider.');
        return new MockAIProvider();
    }
  }

  /**
   * Resilient execute prompt.
   * Wraps the provider generateText call inside the central resiliency engine.
   */
  public async executePrompt(prompt: string, systemInstruction = ''): Promise<string> {
    try {
      // Clean query input to avoid prompt injection vulnerabilities
      const sanitizedPrompt = this.sanitizeInput(prompt);

      // Integrate every external communication with the resiliency framework from Phase 17
      const result = await ResilientExecutor.execute(
        {
          name: `AI-${this.provider.name.replace(/\s+/g, '-')}`,
          retryCount: 2,
          timeoutMs: 15000, // 15-second timeout policy
          backoffType: 'EXPONENTIAL',
          jitterType: 'FULL',
          useCircuitBreaker: true,
          circuitFailureThreshold: 3,
          isIdempotent: true, // querying prompts is idempotent
        },
        async () => {
          return await this.provider.generateText(sanitizedPrompt, systemInstruction);
        }
      );

      const cost = this.calculateEstimatedCost(
        this.provider.name,
        result.promptTokens,
        result.completionTokens
      );

      // Track usage asynchronously to avoid blocking the API response
      AIUsageLog.create({
        providerName: this.provider.name,
        prompt: sanitizedPrompt,
        response: result.text,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        estimatedCost: cost,
      }).catch((logErr) => {
        logger.error('[AI Service] Failed to save usage log:', logErr);
      });

      return result.text;
    } catch (err) {
      logger.error('[AI Service] Prompt execution failed:', err);
      throw err;
    }
  }

  private sanitizeInput(input: string): string {
    // Basic sanitization to guard against simple prompt injection delimiters
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // XSS tag guard
      .replace(/[\r\n\t]+/g, ' ') // normalize whitespaces
      .trim();
  }

  private calculateEstimatedCost(providerName: string, promptTokens: number, completionTokens: number): number {
    if (providerName.includes('OpenAI')) {
      // gpt-4o-mini: $0.15 / 1M prompt tokens, $0.60 / 1M completion tokens
      return (promptTokens * 0.15 + completionTokens * 0.6) / 1000000;
    }
    if (providerName.includes('Claude')) {
      // claude-3-5-sonnet: $3.00 / 1M, $15.00 / 1M
      return (promptTokens * 3.0 + completionTokens * 15.0) / 1000000;
    }
    if (providerName.includes('Gemini')) {
      // gemini-1.5-flash: $0.075 / 1M, $0.30 / 1M
      return (promptTokens * 0.075 + completionTokens * 0.3) / 1000000;
    }
    return 0; // Ollama / Mock AI providers have no cost
  }

  /**
   * Return usage summary for observability endpoints
   */
  public async getUsageSummary(): Promise<{
    providerName: string;
    totalRequests: number;
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalEstimatedCost: number;
  }> {
    try {
      const stats = await AIUsageLog.aggregate([
        {
          $group: {
            _id: '$providerName',
            totalRequests: { $sum: 1 },
            totalPromptTokens: { $sum: '$promptTokens' },
            totalCompletionTokens: { $sum: '$completionTokens' },
            totalEstimatedCost: { $sum: '$estimatedCost' },
          },
        },
      ]);

      if (stats.length === 0) {
        return {
          providerName: this.provider.name,
          totalRequests: 0,
          totalPromptTokens: 0,
          totalCompletionTokens: 0,
          totalEstimatedCost: 0,
        };
      }

      // Return active provider stats or sum
      return {
        providerName: this.provider.name,
        totalRequests: stats.reduce((sum, item) => sum + item.totalRequests, 0),
        totalPromptTokens: stats.reduce((sum, item) => sum + item.totalPromptTokens, 0),
        totalCompletionTokens: stats.reduce((sum, item) => sum + item.totalCompletionTokens, 0),
        totalEstimatedCost: stats.reduce((sum, item) => sum + item.totalEstimatedCost, 0),
      };
    } catch (err) {
      logger.error('[AI Service] Failed to retrieve usage summary:', err);
      return {
        providerName: this.provider.name,
        totalRequests: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalEstimatedCost: 0,
      };
    }
  }

  public getActiveProviderName(): string {
    return this.provider.name;
  }
}
