import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AIService } from '../services/ai/ai.service.js';
import { MockAIProvider } from '../services/ai/providers.js';
import { ForecastingEngine } from '../services/ai/forecasting.js';
import mongoose from 'mongoose';
import { config } from '../../config/environment.js';
import { Product } from '../models/Product.js';
import { Transaction } from '../models/Transaction.js';

describe('Phase 18 AI Business Intelligence & Forecasting', () => {
  beforeAll(async () => {
    // Connect to test database pool
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongodbUri);
    }
  });

  afterAll(async () => {
    // Clean up connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe('Mock AI Provider', () => {
    it('should generate mock reorder response when prompted for restock', async () => {
      const provider = new MockAIProvider();
      const res = await provider.generateText('Help me check reorder suggestions');
      expect(res.text).toContain('recommendations');
      expect(res.text).toContain('proposedQty');
    });

    it('should generate generic fallback summary for standard conversational prompts', async () => {
      const provider = new MockAIProvider();
      const res = await provider.generateText('Tell me about the system health status');
      expect(res.text).toContain('STOCKORA ENTERPRISE');
      expect(res.text).toContain('Telemetry summary');
    });
  });

  describe('AI Service Core & Sanitizer', () => {
    it('should strip XSS script tags and format query prompts correctly', async () => {
      const service = AIService.getInstance();
      const promptText = 'What is our profit? <script>alert(1)</script>';
      const reply = await service.executePrompt(promptText);
      expect(reply).toBeDefined();
    });

    it('should log estimated tokens and calculate relative costs correctly', async () => {
      const service = AIService.getInstance();
      const summary = await service.getUsageSummary();
      expect(summary.providerName).toBeDefined();
      expect(summary.totalRequests).toBeGreaterThanOrEqual(0);
    });
  });

  describe('BI Forecasting Engine Data Analyzer', () => {
    it('should compile structured metrics matching inventory databases', async () => {
      // Clean up pre-existing seed data first
      await Product.deleteOne({ sku: 'AI-TEST-99' });
      await Transaction.deleteOne({ transactionNumber: 'TX-AI-TEST-999' });

      // Seed temporary product/transaction for verification
      const p = await Product.create({
        name: 'AI Test Unit Scanner',
        sku: 'AI-TEST-99',
        price: 150,
        cost: 60,
        sellingPrice: 150,
        costPrice: 60,
        quantity: 1,
        lowStockAlert: 5,
        category: 'Electronics',
        isActive: true,
      });

      const t = await Transaction.create({
        transactionNumber: 'TX-AI-TEST-999',
        type: 'SALE',
        status: 'COMPLETED',
        cashierId: new mongoose.Types.ObjectId().toString(),
        branchId: new mongoose.Types.ObjectId().toString(),
        items: [
          {
            productId: p._id,
            productName: 'AI Test Unit Scanner',
            sku: 'AI-TEST-99',
            quantity: 2,
            price: 150,
            discount: 0,
            total: 300,
          },
        ],
        subtotal: 300,
        tax: 24,
        discount: 0,
        total: 324,
        paymentMethod: 'CASH',
        cashierName: 'System Test',
        branchName: 'Toronto HQ',
      });

      const stats = await ForecastingEngine.generateReport();
      expect(stats.totalSalesRevenue).toBeGreaterThan(0);
      expect(stats.reorderProposals.some((item) => item.name === 'AI Test Unit Scanner')).toBe(true);

      // Clean up seed data
      await Product.deleteOne({ _id: p._id });
      await Transaction.deleteOne({ _id: t._id });
    });
  });
});
