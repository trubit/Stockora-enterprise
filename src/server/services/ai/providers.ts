import { logger } from '../../logger.js';

export interface AIProvider {
  name: string;
  generateText(prompt: string, systemInstruction?: string): Promise<{
    text: string;
    promptTokens: number;
    completionTokens: number;
  }>;
}

// ---- OpenAI Provider --------------------------------------------------------

export class OpenAIProvider implements AIProvider {
  public readonly name = 'OpenAI';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = 'gpt-4o-mini') {
    this.apiKey = apiKey;
    this.model = model;
  }

  public async generateText(prompt: string, systemInstruction = ''): Promise<{
    text: string;
    promptTokens: number;
    completionTokens: number;
  }> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
            { role: 'user', content: prompt },
          ],
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API failed with status ${response.status}: ${errorText}`);
      }

      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      const data = (await response.json()) as any;
      const text = data.choices?.[0]?.message?.content || '';
      const promptTokens = data.usage?.prompt_tokens || 0;
      const completionTokens = data.usage?.completion_tokens || 0;

      return { text, promptTokens, completionTokens };
    } catch (err) {
      logger.error('[AI] OpenAI Provider error:', err);
      throw err;
    }
  }
}

// ---- Anthropic Claude Provider ----------------------------------------------

export class ClaudeProvider implements AIProvider {
  public readonly name = 'Anthropic Claude';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = 'claude-3-5-sonnet-20241022') {
    this.apiKey = apiKey;
    this.model = model;
  }

  public async generateText(prompt: string, systemInstruction = ''): Promise<{
    text: string;
    promptTokens: number;
    completionTokens: number;
  }> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1500,
          system: systemInstruction || undefined,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API failed with status ${response.status}: ${errorText}`);
      }

      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      const data = (await response.json()) as any;
      const text = data.content?.[0]?.text || '';
      const promptTokens = data.usage?.input_tokens || 0;
      const completionTokens = data.usage?.output_tokens || 0;

      return { text, promptTokens, completionTokens };
    } catch (err) {
      logger.error('[AI] Anthropic Provider error:', err);
      throw err;
    }
  }
}

// ---- Google Gemini Provider -------------------------------------------------

export class GeminiProvider implements AIProvider {
  public readonly name = 'Google Gemini';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = 'gemini-1.5-flash') {
    this.apiKey = apiKey;
    this.model = model;
  }

  public async generateText(prompt: string, systemInstruction = ''): Promise<{
    text: string;
    promptTokens: number;
    completionTokens: number;
  }> {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
              ],
            },
          ],
          systemInstruction: systemInstruction
            ? { parts: [{ text: systemInstruction }] }
            : undefined,
          generationConfig: {
            temperature: 0.2,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API failed with status ${response.status}: ${errorText}`);
      }

      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      const data = (await response.json()) as any;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Estimate tokens as Gemini v1beta REST doesn't always return usage metadata in some scopes
      const promptTokens = Math.round(prompt.length / 4);
      const completionTokens = Math.round(text.length / 4);

      return { text, promptTokens, completionTokens };
    } catch (err) {
      logger.error('[AI] Gemini Provider error:', err);
      throw err;
    }
  }
}

// ---- Ollama (Local) Provider ------------------------------------------------

export class OllamaProvider implements AIProvider {
  public readonly name = 'Ollama';
  private host: string;
  private model: string;

  constructor(host = 'http://localhost:11434', model = 'llama3') {
    this.host = host;
    this.model = model;
  }

  public async generateText(prompt: string, systemInstruction = ''): Promise<{
    text: string;
    promptTokens: number;
    completionTokens: number;
  }> {
    try {
      const fullPrompt = systemInstruction ? `${systemInstruction}\n\nUser: ${prompt}` : prompt;
      const response = await fetch(`${this.host}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: fullPrompt,
          stream: false,
          options: {
            temperature: 0.2,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama host failed with status ${response.status}: ${errorText}`);
      }

      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      const data = (await response.json()) as any;
      const text = data.response || '';

      // Estimate tokens
      const promptTokens = Math.round(fullPrompt.length / 4);
      const completionTokens = Math.round(text.length / 4);

      return { text, promptTokens, completionTokens };
    } catch (err) {
      logger.error('[AI] Ollama Provider error:', err);
      throw err;
    }
  }
}

// ---- Mock AI Provider (Local Heuristic Fallback) ----------------------------

export class MockAIProvider implements AIProvider {
  public readonly name = 'Mock AI Fallback';

  public async generateText(prompt: string, _systemInstruction = ''): Promise<{
    text: string;
    promptTokens: number;
    completionTokens: number;
  }> {
    logger.info(`[AI] Mock AI Provider invoked with prompt length: ${prompt.length}. SysInst: ${_systemInstruction.length}`);
    const normalized = prompt.toLowerCase();

    let reply: string;

    if (normalized.includes('reorder') || normalized.includes('restock')) {
      reply = JSON.stringify({
        recommendations: [
          { productId: 'mock-p1', name: 'Smart Barcode Scanner', sku: 'SCAN-WL-01', proposedQty: 15, reason: 'Rapid depletion (fast-moving), current stock = 2 units.' },
          { productId: 'mock-p2', name: 'Thermal Receipt Rolls', sku: 'THERM-57-50', proposedQty: 100, reason: 'High velocity consumable item, current stock = 5 rolls.' },
        ],
        reorderValue: 1250.00,
        summary: 'Identified 2 critical replenishment items due to sales velocity exceeding seasonal thresholds.',
      }, null, 2);
    } else if (normalized.includes('forecast') || normalized.includes('seasonal')) {
      reply = JSON.stringify({
        salesForecast: [
          { period: 'August 2026', estimatedRevenue: 45000.00, confidence: 0.92, factor: 'Back-to-school warehouse demands' },
          { period: 'September 2026', estimatedRevenue: 48000.00, confidence: 0.88, factor: 'Quarter-end distribution velocity' },
        ],
        insights: 'Historical sales logs suggest an upward surge of 8.4% starting late August in distribution products.',
      }, null, 2);
    } else if (normalized.includes('slow-moving') || normalized.includes('fast-moving')) {
      reply = JSON.stringify({
        fastMoving: [
          { name: 'Smart Barcode Scanner', quantitySold: 42, profitContribution: 1890.00 },
        ],
        slowMoving: [
          { name: 'Vintage Brass Handheld Bell', inventoryAgeDays: 145, quantityOnHand: 8 },
        ],
        summary: 'Recommend marketing clearance coupons for bell stock, while increasing safety buffer bounds for scanners.',
      }, null, 2);
    } else {
      reply = `[STOCKORA ENTERPRISE INTELLIGENCE SYSTEM]
This is an automated intelligence summary report responding to your query:
"${prompt.slice(0, 100)}..."

Telemetry summary:
- Cluster State: Healthy
- Active Nodes: Node-Toronto-1
- Sync Buffer: 0 pending txns
- Database metrics: 43 test assertions validated successfully.`;
    }

    return {
      text: reply,
      promptTokens: Math.round(prompt.length / 4),
      completionTokens: Math.round(reply.length / 4),
    };
  }
}
