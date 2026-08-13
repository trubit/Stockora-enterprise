import { CopilotService } from './copilot.service.js';
import { InventoryForecast } from '../models/InventoryForecast.js';
import { StockoutRisk } from '../models/StockoutRisk.js';
import { ReorderRecommendation } from '../models/ReorderRecommendation.js';
import { SupplierScore } from '../models/SupplierScore.js';
import { KnowledgeDocument } from '../models/KnowledgeDocument.js';
import { logger } from '../logger.js';

export class InventoryCopilotService {
  /**
   * Responds to natural language queries regarding inventory intelligence
   */
  public static async queryInventoryCopilot(sessionId: string, userQuery: string): Promise<string> {
    // 1. Gather context data based on query intent
    let contextSummary = '';

    if (/reorder|replenish|purchase/i.test(userQuery)) {
      const recs = await ReorderRecommendation.find({ status: 'RECOMMENDED' }).limit(5);
      if (recs.length > 0) {
        contextSummary += `Top Reorder Recommendations:\n${recs
          .map(
            (r) =>
              `- SKU ${r.productSku}: Current Stock ${r.currentStock}, ROP ${r.reorderPoint}, Rec Qty ${r.recommendedQuantity}`
          )
          .join('\n')}\n`;
      }
    }

    if (/stockout|risk|run out/i.test(userQuery)) {
      const risks = await StockoutRisk.find({ riskLevel: { $in: ['HIGH', 'CRITICAL'] } }).limit(5);
      if (risks.length > 0) {
        contextSummary += `Critical Stockout Risks:\n${risks
          .map(
            (r) =>
              `- SKU ${r.productSku}: Current ${r.currentStock}, Days until stockout ${r.daysUntilStockout}`
          )
          .join('\n')}\n`;
      }
    }

    if (/supplier|vendor|score|lead time/i.test(userQuery)) {
      const scores = await SupplierScore.find().sort({ overallScore: -1 }).limit(3);
      if (scores.length > 0) {
        contextSummary += `Supplier Scorecards:\n${scores
          .map(
            (s) =>
              `- ${s.supplierName}: Score ${s.overallScore}%, Lead Time ${s.avgLeadTimeDays} days, Risk Tier ${s.riskTier}`
          )
          .join('\n')}\n`;
      }
    }

    // Inject context into KnowledgeDocument temporarily for Copilot RAG lookup if needed
    if (contextSummary) {
      await KnowledgeDocument.findOneAndUpdate(
        { title: 'System Dynamic Inventory Intelligence Snapshot' },
        {
          title: 'System Dynamic Inventory Intelligence Snapshot',
          content: contextSummary,
          category: 'INVENTORY_INTELLIGENCE',
        },
        { upsert: true }
      );
    }

    // Execute chat with CopilotService
    const reply = await CopilotService.executeChat(sessionId, userQuery);
    logger.info(`[Inventory Copilot] Processed prompt: "${userQuery}"`);
    return reply;
  }
}
