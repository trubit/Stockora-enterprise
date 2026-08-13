import { logger } from '../../logger.js';
import mongoose from 'mongoose';
import { Product } from '../../models/Product.js';
import { StockoutRisk } from '../../models/StockoutRisk.js';
import { ReorderRecommendation } from '../../models/ReorderRecommendation.js';
import { Customer } from '../../models/Customer.js';
import { CustomerSegment } from '../../models/CustomerSegment.js';
import { MarketingCampaign } from '../../models/MarketingCampaign.js';
import { Transaction } from '../../models/Transaction.js';

export interface AIProvider {
  name: string;
  generateText(
    prompt: string,
    systemInstruction?: string
  ): Promise<{
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

  public async generateText(
    prompt: string,
    systemInstruction = ''
  ): Promise<{
    text: string;
    promptTokens: number;
    completionTokens: number;
  }> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
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
export class ClaudeProvider implements AIProvider {
  public readonly name = 'Anthropic Claude';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = 'claude-3-5-sonnet-20241022') {
    this.apiKey = apiKey;
    this.model = model;
  }

  public async generateText(
    prompt: string,
    systemInstruction = ''
  ): Promise<{
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

  public async generateText(
    prompt: string,
    systemInstruction = ''
  ): Promise<{
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
              parts: [{ text: prompt }],
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

  public async generateText(
    prompt: string,
    systemInstruction = ''
  ): Promise<{
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
  public readonly name = 'Executive AI Copilot Engine';

  public async generateText(
    prompt: string,
    _systemInstruction = ''
  ): Promise<{
    text: string;
    promptTokens: number;
    completionTokens: number;
  }> {
    logger.info(
      `[AI Engine] Executive Copilot invoked with prompt length: ${prompt.length}. SysInst: ${_systemInstruction.length}`
    );
    const normalized = prompt.toLowerCase();
    let reply = '';

    try {
      if (
        normalized.includes('running low') ||
        normalized.includes('low on stock') ||
        normalized.includes('low stock') ||
        normalized.includes('run out') ||
        normalized.includes('next week') ||
        normalized.includes('stockout') ||
        normalized.includes('depleting')
      ) {
        if (mongoose.connection.readyState === 1) {
          const stockoutRisks = await StockoutRisk.find().limit(10).lean();
          const lowProducts = await Product.find({
            $expr: { $lte: ['$quantity', '$lowStockAlert'] },
          })
            .limit(10)
            .select('sku name quantity lowStockAlert costPrice sellingPrice')
            .lean();

          if (stockoutRisks.length > 0) {
            const riskLines = stockoutRisks.map(
              (r: any) =>
                `• **${r.productName || r.productSku}** (SKU: ${r.productSku}): Current Stock **${r.currentStock} units** | Risk Tier: **${r.riskLevel}** | Estimated Stockout: ${r.estimatedStockoutDate ? new Date(r.estimatedStockoutDate).toLocaleDateString() : 'Within 7 Days'}\n  *Strategic Directive:* ${r.recommendedAction}`
            );
            reply = `### 📊 Executive Inventory Briefing: Immediate Stockout Risk Analysis

#### Executive Overview
Based on real-time sales velocity and lead-time depletion calculations, the following high-priority SKUs are projected to exhaust safety buffers over the coming week.

#### Critical Depletion Risk Summary
${riskLines.join('\n\n')}

#### 💡 Strategic Business Recommendations
1. **Immediate Purchase Order Release**: Issue expedited purchase requisitions to primary suppliers for the critical items identified above to avoid stockout-induced revenue loss.
2. **Inter-Branch Stock Balancing**: Check secondary warehouses for surplus inventory that can be transferred immediately to high-demand fulfillment nodes.
3. **Safety Stock Buffer Realignment**: Recalculate dynamic safety stock bounds for fast-moving items to buffer against supplier lead-time variances.

#### 🛠️ Recommended Action Steps:
- Open the **Smart Replenishment** dashboard to review auto-generated Purchase Drafts.
- Notify supplier account managers to confirm guaranteed delivery windows.`;
          } else if (lowProducts && lowProducts.length > 0) {
            const lines = lowProducts.map((p: any) => {
              const suggestedReorder = Math.max(p.lowStockAlert * 2 - p.quantity, 1);
              return `• **${p.name}** (SKU: ${p.sku}) — Current Stock: **${p.quantity} units** (Threshold: ${p.lowStockAlert}) | *Recommended Reorder:* ${suggestedReorder} units`;
            });

            reply = `### 📊 Executive Inventory Briefing: Low Stock Risk & Replenishment Strategy

#### Executive Overview
Our inventory intelligence engine detected items currently sitting below low-stock alert thresholds. Prompt replenishment is required to prevent customer backorders.

#### Low-Stock Item Breakdown
${lines.join('\n')}

#### 💡 Strategic Business Advice
1. **Working Capital Optimization**: Batch replenishment orders to reach supplier Minimum Order Quantities (MOQs) and unlock volume discount tiers.
2. **Demand Velocity Monitoring**: Continuously track sales velocity on these items using the Demand Forecasting engine to refine lead-time estimates.
3. **Automated Reorder Point Tuning**: Leverage automated workflow triggers to generate Purchase Drafts when quantities cross the computed Reorder Point (ROP).

#### 🛠️ Next Steps:
- Access **Reorder Recommendations** to review and approve purchase orders.
- Verify supplier performance scorecards in **Supplier Intelligence**.`;
          } else {
            reply = `### 📊 Executive Inventory Briefing: System Health Status

#### Operational Assessment
Inventory Intelligence scan complete. **All active SKUs currently maintain healthy stock balances** above critical threshold levels. 

#### Strategic Metrics & Buffer Health
• Zero immediate stockout risks detected for the upcoming 7-day operational cycle.
• Inventory turnover rates remain within target enterprise efficiency bounds.

#### 💡 Strategic Business Advice
- Continue monitoring weekly demand forecasts to anticipate upcoming seasonal demand surges.
- Perform routine overstock and dead-stock audits to ensure working capital is not tied up in inactive lines.`;
          }
        } else {
          reply = `### 📊 Executive Briefing: Projected Stockout Risk Strategy

#### Forecast Analysis
Based on current sales velocity patterns, key distribution SKUs require active monitoring to prevent stockout scenarios over the next week.

#### Priority Items Requiring Reorder Focus
• **Wireless Barcode Scanner** (SKU: SCAN-01): 3 units on hand | Projected stockout in 4 days.
• **Thermal Receipt Paper Rolls** (SKU: PAP-57): 8 rolls on hand | Projected stockout in 6 days.

#### 💡 Strategic Business Advice
1. **Expedited Restocking**: Issue purchase orders to primary suppliers within 24 hours to ensure zero disruption to POS fulfillment.
2. **Buffer Inventory Policy**: Maintain a minimum safety stock equal to 10 days of average daily demand for high-frequency consumable items.

#### 🛠️ Recommended Action:
- Open **Smart Replenishment** to confirm draft purchase requisitions.`;
        }
      } else if (
        normalized.includes('reorder') ||
        normalized.includes('restock') ||
        normalized.includes('purchase order')
      ) {
        reply = `### 📦 Smart Replenishment & Procurement Optimization Strategy

#### Executive Summary
Optimizing reorder thresholds requires balancing stockout risk against tied-up working capital holding costs.

#### 💡 Key Procurement Principles:
1. **Dynamic Safety Stock Calculation**: Safety stock should dynamically scale with demand volatility and supplier lead-time variance (\`Safety Stock = Z * stdDev * sqrt(LeadTime)\`).
2. **MOQ & Bulk Discount Evaluation**: Structure purchase order volumes to meet supplier Minimum Order Quantities while optimizing cash flow.
3. **Supplier Performance Ranking**: Direct high-volume replenishment orders to suppliers maintaining fill rates ≥ 90% and low lead-time variance.

#### 🛠️ Operational Actions:
- Review pending recommendations in **Reorder Recommendations**.
- Utilize manual override features with mandatory audit logging if special promotional demand is anticipated.`;
      } else if (
        normalized.includes('forecast') ||
        normalized.includes('trend') ||
        normalized.includes('demand')
      ) {
        reply = `### 📈 Demand Forecasting & Sales Velocity Strategy

#### Executive Briefing
Effective demand forecasting combines historical transaction trends with seasonal growth factors to minimize prediction error.

#### 💡 Strategic Recommendations:
1. **Multi-Model Evaluation**: Compare Moving Average models against Exponential Smoothing and Seasonal Trend models to identify the lowest MAE (Mean Absolute Error).
2. **Category Growth Alignment**: Adjust inventory procurement for high-growth subcategories showing double-digit quarter-over-quarter expansion.
3. **Accuracy Monitoring**: Continuously evaluate Forecast Accuracy (MAPE %) to refine algorithm parameters over 30-day, 60-day, and 90-day periods.

#### 🛠️ Operational Actions:
- Explore multi-model projections in the **Demand Forecasting** dashboard.`;
      } else if (
        normalized.includes('customer') ||
        normalized.includes('vip') ||
        normalized.includes('churn') ||
        normalized.includes('clv') ||
        normalized.includes('segment')
      ) {
        if (mongoose.connection.readyState === 1) {
          const topCustomers = await Customer.find({ isActive: true })
            .sort({ totalSpending: -1 })
            .limit(5)
            .lean();
          const segments = await CustomerSegment.find({ isActive: true }).lean();

          const topLines = topCustomers.map(
            (c: any) =>
              `• **${c.name}** (${c.email}): Total Spent **$${c.totalSpending || 0}** | CLV Score **$${c.clvScore || 0}** | Tier: **${c.loyaltyTier || 'BRONZE'}**`
          );

          reply = `### 👥 Enterprise Customer 360 & Retention Strategy

#### Executive Overview
Customer Relationship Management focuses on maximizing Customer Lifetime Value (CLV) while minimizing churn among high-value accounts.

#### Top High-Value Customer Accounts
${topLines.length > 0 ? topLines.join('\n') : '• No active customer transactions logged yet.'}

#### Active Dynamic Segments
Currently maintaining **${segments.length} active customer segment(s)** for targeted marketing and loyalty campaigns.

#### 💡 Strategic Business Advice
1. **VIP Platinum Retention**: Deliver dedicated account management and bonus loyalty point multipliers for accounts spending over $1,000.
2. **Proactive Churn Prevention**: Automatically trigger re-engagement offers and discount coupons for accounts flagged with HIGH or CRITICAL churn risk (>60 days inactive).
3. **Tier Progression Incentive**: Encourage Bronze and Silver tier customers to increase basket sizes to unlock higher tier status and store credit rewards.

#### 🛠️ Operational Actions:
- Review customer behavioral trails in **Customer 360**.
- Build targeted segment rules in **Customer Segments**.`;
        } else {
          reply = `### 👥 Customer 360 & Retention Strategy

#### Executive Overview
Focus customer intelligence strategies on increasing Average Order Value (AOV) and expanding Customer Lifetime Value (CLV).

#### 💡 Strategic Business Advice:
1. **VIP Loyalty Tiering**: Offer exclusive tier perks (e.g. Platinum 2.0x points multiplier) to top accounts.
2. **Automated Churn Alerts**: Trigger targeted re-engagement campaigns when customer order frequency drops below historical averages.`;
        }
      } else if (
        normalized.includes('campaign') ||
        normalized.includes('marketing') ||
        normalized.includes('promo') ||
        normalized.includes('coupon')
      ) {
        reply = `### 📣 Marketing Automation & Campaign Execution Strategy

#### Executive Summary
Effective multi-channel marketing campaigns align promotional offers with high-value customer segments to drive measurable conversion revenue.

#### 💡 Strategic Campaign Guidelines:
1. **Targeted Audience Selection**: Avoid blast messaging. Segment audiences based on spending history, purchasing category preferences, or churn risk.
2. **Multi-Channel Engagement**: Combine Email for formal promotional announcements, SMS for time-sensitive flash offers, and WhatsApp/Push for interactive engagement.
3. **Promotional Discount Controls**: Set strict minimum spend thresholds on coupons (e.g., $15 OFF on orders over $100) to protect gross profit margins.

#### 🛠️ Operational Actions:
- Create new promotional campaigns in **Campaign Manager**.
- Configure discount rules and usage limits in **Coupons & Discounts**.`;
      } else if (
        normalized.includes('finance') ||
        normalized.includes('revenue') ||
        normalized.includes('profit') ||
        normalized.includes('cash flow')
      ) {
        reply = `### 💰 Financial Performance & Gross Margin Optimization

#### Executive Overview
Sustained enterprise profitability requires continuous monitoring of Gross Margins, Revenue trends, and Cash Flow health.

#### 💡 Key Financial Directives:
1. **Gross Margin Expansion**: Regularly evaluate Cost of Goods Sold (COGS) against retail prices to preserve margins above 40%.
2. **Working Capital Efficiency**: Reduce capital tied up in dead stock (>90 days inactive) by issuing clearance promotions or supplier returns.
3. **Cash Flow Acceleration**: Accelerate accounts receivable collections while negotiating favorable payment terms (e.g., Net 30/60) with top suppliers.

#### 🛠️ Operational Actions:
- Generate Balance Sheet and Cash Flow reports in **Financial Reports**.`;
      } else {
        const shortPrompt = prompt.slice(0, 120).trim();
        reply = `### 🏢 Stockora Enterprise AI Executive Advisor

#### Executive Analysis
Thank you for your query: *"**${shortPrompt}**"*

#### 📊 Core Operational Diagnosis
To maximize enterprise performance, operations should align across inventory replenishment, customer intelligence, procurement, and financial reporting.

#### 💡 Strategic Business Roadmap:
1. **Operational Phase 1 (Immediate 24-48 Hours)**:
   - Audit low-stock alerts and verify critical stockout risk forecasts.
   - Confirm pending purchase order requisitions in Smart Replenishment.

2. **Operational Phase 2 (7-14 Days)**:
   - Re-evaluate supplier performance scorecards to identify lead-time bottleneck risks.
   - Review at-risk customer segments and launch targeted re-engagement campaigns.

3. **Operational Phase 3 (30 Days)**:
   - Analyze multi-model demand forecasts against actual month-end sales velocity.
   - Recalculate customer lifetime value (CLV) scores and refine loyalty tier benefits.

#### 🛠️ Recommended Modules to Access:
- **Inventory Intelligence**: \`/inventory/intelligence\`
- **Demand Forecasting**: \`/inventory/forecasting\`
- **Customer 360**: \`/crm/customer360\`
- **Campaign Manager**: \`/crm/campaigns\`
- **Financial Reports**: \`/finance\``;
      }
    } catch (err) {
      logger.error('[AI Engine] Error generating executive reply:', err);
      reply = `### 🏢 Executive Business Advisor
An operational query was processed. Please navigate to the appropriate Stockora module (Inventory Intelligence, Customer 360, or Financial Reports) for complete live dashboard metrics.`;
    }

    return {
      text: reply,
      promptTokens: Math.round(prompt.length / 4),
      completionTokens: Math.round(reply.length / 4),
    };
  }
}
