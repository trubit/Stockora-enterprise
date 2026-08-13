import { describe, expect, it } from 'vitest';
import { executeWithFallback, resolveAIProviderConfig } from './ai.service.js';
import { MockAIProvider } from './providers.js';

describe('resolveAIProviderConfig', () => {
  it('uses the generic AI_SERVICE_API_KEY and provider alias from AI_MODEL_NAME', () => {
    const config = resolveAIProviderConfig({
      AI_SERVICE_API_KEY: 'test-key',
      AI_MODEL_NAME: 'GEMINI',
    });

    expect(config.provider).toBe('GEMINI');
    expect(config.apiKey).toBe('test-key');
    expect(config.model).toBe('gemini-1.5-flash');
  });

  it('prefers provider-specific overrides when present', () => {
    const config = resolveAIProviderConfig({
      AI_SERVICE_API_KEY: 'generic-key',
      AI_PROVIDER: 'OPENAI',
      OPENAI_API_KEY: 'openai-key',
      OPENAI_MODEL: 'gpt-4o',
    });

    expect(config.provider).toBe('OPENAI');
    expect(config.apiKey).toBe('openai-key');
    expect(config.model).toBe('gpt-4o');
  });

  it('falls back to the mock provider when the primary provider fails', async () => {
    const primaryProvider = {
      name: 'Primary Provider',
      generateText: async () => {
        throw new Error('simulated failure');
      },
    };

    const result = await executeWithFallback(
      primaryProvider,
      'Which products are running low on stock?',
      'system',
      new MockAIProvider()
    );

    expect(result.text).toMatch(
      /I can help|running low|The following products are running low|low-stock|low stock|Inventory Analysis|Executive Inventory Briefing|Stockout Risk/i
    );
  });
});
