import { AIService } from './ai/ai.service.js';
import { AICopilotMessage } from '../models/AICopilotMessage.js';
import { KnowledgeDocument } from '../models/KnowledgeDocument.js';
import { ResilientExecutor } from '../utils/resiliency/index.js';
import { logger } from '../logger.js';

export class CopilotService {
  /**
   * Interact with the AI Copilot using RAG context injection
   */
  public static async executeChat(sessionId: string, userPrompt: string): Promise<string> {
    // 1. Core keyword search to implement provider-agnostic baseline RAG
    const keywords = userPrompt.split(/\s+/).filter((w) => w.length > 4);
    const regexQueries = keywords.map((k) => new RegExp(k, 'i'));

    let contextText = '';
    if (regexQueries.length > 0) {
      const docs = await KnowledgeDocument.find({
        $or: [{ title: { $in: regexQueries } }, { content: { $in: regexQueries } }],
      }).limit(3);

      if (docs.length > 0) {
        contextText = docs.map((d) => `[Doc: ${d.title}] ${d.content}`).join('\n');
      }
    }

    const systemInstruction = contextText
      ? `You are Stockora Enterprise AI Copilot. Answer using this business intelligence context:\n${contextText}`
      : 'You are Stockora Enterprise AI Copilot. Assist the employee with operational business inventory and sales advice.';

    // Estimate input token cost (standard rule of thumb: ~4 characters per token)
    const inputTokens = Math.round(userPrompt.length / 4);

    // Save User message
    await AICopilotMessage.create({
      sessionId,
      role: 'user',
      content: userPrompt,
      tokens: inputTokens,
      cost: Number((inputTokens * 0.000001).toFixed(6)),
    });

    let aiReply = '';
    try {
      // Outbound inference call wrapped in exponential backoff resiliency limits
      aiReply = await ResilientExecutor.execute({ name: `copilot-chat:${sessionId}` }, async () => {
        const aiService = AIService.getInstance();
        return await aiService.executePrompt(userPrompt, systemInstruction);
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error(`[Copilot Service] Inference failed: ${errMsg}`);
      aiReply =
        'I apologize, but I encountered a connection issue communicating with our AI inference node. Please try again.';
    }

    // Save Assistant reply
    const outputTokens = Math.round(aiReply.length / 4);
    await AICopilotMessage.create({
      sessionId,
      role: 'assistant',
      content: aiReply,
      tokens: outputTokens,
      cost: Number((outputTokens * 0.000002).toFixed(6)),
    });

    return aiReply;
  }

  /**
   * Fetch chat logs history matching active session ID
   */
  public static async getHistory(sessionId: string): Promise<any[]> {
    return AICopilotMessage.find({ sessionId }).sort({ createdAt: 1 });
  }
}
