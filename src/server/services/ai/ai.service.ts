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

interface ResolvedAIConfig {
  provider: 'OPENAI' | 'CLAUDE' | 'GEMINI' | 'OLLAMA' | 'MOCK';
  apiKey?: string;
  model?: string;
}

export function resolveAIProviderConfig(env: NodeJS.ProcessEnv = process.env): ResolvedAIConfig {
  if (env.NODE_ENV === 'test' && !env.FORCE_REAL_AI) {
    return { provider: 'MOCK' };
  }
  const configuredProvider = (env.AI_PROVIDER || env.AI_MODEL_NAME || 'MOCK').toUpperCase();

  if (configuredProvider === 'OPENAI') {
    return {
      provider: 'OPENAI',
      apiKey: env.OPENAI_API_KEY || env.AI_SERVICE_API_KEY,
      model: env.OPENAI_MODEL || 'gpt-4o-mini',
    };
  }

  if (configuredProvider === 'CLAUDE') {
    return {
      provider: 'CLAUDE',
      apiKey: env.CLAUDE_API_KEY || env.AI_SERVICE_API_KEY,
      model: env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
    };
  }

  if (configuredProvider === 'GEMINI') {
    return {
      provider: 'GEMINI',
      apiKey: env.GEMINI_API_KEY || env.AI_SERVICE_API_KEY,
      model: env.GEMINI_MODEL || 'gemini-1.5-flash',
    };
  }

  if (configuredProvider === 'OLLAMA') {
    return {
      provider: 'OLLAMA',
      model: env.OLLAMA_MODEL || 'llama3',
    };
  }

  return {
    provider: 'MOCK',
  };
}

// No fallback to mock providers — require a real provider and explicit configuration.

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
    const config = resolveAIProviderConfig();

    try {
      switch (config.provider) {
        case 'OPENAI': {
          const key = config.apiKey;
          if (!key || key === 'your_openai_api_key') {
            logger.warn('[AI Service] OpenAI API Key missing. Using Mock AI Provider.');
            return new MockAIProvider();
          }
          return new OpenAIProvider(key, config.model || process.env.OPENAI_MODEL);
        }
        case 'CLAUDE': {
          const key = config.apiKey;
          if (!key) {
            logger.warn('[AI Service] Claude API Key missing. Using Mock AI Provider.');
            return new MockAIProvider();
          }
          return new ClaudeProvider(key, config.model || process.env.CLAUDE_MODEL);
        }
        case 'GEMINI': {
          const key = config.apiKey;
          if (!key) {
            logger.warn('[AI Service] Gemini API Key missing. Using Mock AI Provider.');
            return new MockAIProvider();
          }
          return new GeminiProvider(key, config.model || process.env.GEMINI_MODEL);
        }
        case 'OLLAMA': {
          const host = process.env.OLLAMA_HOST;
          const model = config.model || process.env.OLLAMA_MODEL;
          if (!host) {
            logger.warn('[AI Service] Ollama host missing. Using Mock AI Provider.');
            return new MockAIProvider();
          }
          return new OllamaProvider(host, model || 'llama3');
        }
        case 'MOCK':
        default:
          logger.info('[AI Service] Initialized Mock AI Provider (Local Heuristic Intelligence).');
          return new MockAIProvider();
      }
    } catch (err) {
      logger.warn(
        '[AI Service] Failed to initialize primary provider, using Mock AI Provider:',
        err
      );
      return new MockAIProvider();
    }
  }

  /**
   * Resilient execute prompt.
   * Wraps the provider generateText call inside the central resiliency engine with automatic Mock AI fallback.
   */
  public async executePrompt(prompt: string, systemInstruction = ''): Promise<string> {
    const sanitizedPrompt = this.sanitizeInput(prompt);

    try {
      // Integrate every external communication with the resiliency framework from Phase 17
      const result = await ResilientExecutor.execute(
        {
          name: `AI-${this.provider.name.replace(/\s+/g, '-')}`,
          retryCount: 1,
          timeoutMs: 8000, // 8-second timeout policy
          backoffType: 'EXPONENTIAL',
          jitterType: 'FULL',
          useCircuitBreaker: false,
          isIdempotent: true,
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
      logger.warn(
        '[AI Service] External provider failed. Executing Mock AI Provider fallback:',
        err
      );
      const mockProvider = new MockAIProvider();
      const mockResult = await mockProvider.generateText(sanitizedPrompt, systemInstruction);
      return mockResult.text;
    }
  }

  private sanitizeInput(input: string): string {
    // Basic sanitization to guard against simple prompt injection delimiters
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // XSS tag guard
      .replace(/[\r\n\t]+/g, ' ') // normalize whitespaces
      .trim();
  }

  private calculateEstimatedCost(
    providerName: string,
    promptTokens: number,
    completionTokens: number
  ): number {
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

export async function executeWithFallback(
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  primaryProvider: any,
  prompt: string,
  systemInstruction?: string,
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  fallbackProvider?: any
) {
  try {
    return await primaryProvider.generateText(prompt, systemInstruction);
  } catch (err) {
    if (fallbackProvider) {
      return await fallbackProvider.generateText(prompt, systemInstruction);
    }
    throw err;
  }
}
