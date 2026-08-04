import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { KnowledgeDocument } from '../models/KnowledgeDocument.js';
import { PromptTemplate } from '../models/PromptTemplate.js';
import { AICopilotMessage } from '../models/AICopilotMessage.js';
import { CopilotService } from '../services/copilot.service.js';

describe('Phase 28 AI Copilot & Knowledge integration tests', () => {
  const sessionId = 'test-session-123';

  beforeAll(async () => {
    await mongoose.connect('mongodb://127.0.0.1:27017/stockora_test_copilot');
    await Promise.all([
      KnowledgeDocument.deleteMany({}),
      PromptTemplate.deleteMany({}),
      AICopilotMessage.deleteMany({}),
    ]);
  });

  afterAll(async () => {
    await Promise.all([
      KnowledgeDocument.deleteMany({}),
      PromptTemplate.deleteMany({}),
      AICopilotMessage.deleteMany({}),
    ]);
    await mongoose.connection.close();
  });

  it('should save knowledge base documents and inject them in prompt context (RAG)', async () => {
    // 1. Seed RAG knowledge SOP doc
    await KnowledgeDocument.create({
      title: 'Milk Expiry SOP Policy',
      content: 'Standard Milk return policy specifies returnable within 2 days from order date.',
      category: 'POLICY',
      metadata: {},
    });

    // 2. Execute chat prompt referencing seeded topic
    const reply = await CopilotService.executeChat(
      sessionId,
      'What is the Milk Expiry SOP Policy details?'
    );

    expect(reply).toBeDefined();

    // 3. Confirm both user and assistant logs are saved in DB session
    const logs = await AICopilotMessage.find({ sessionId }).sort({ createdAt: 1 });
    expect(logs.length).toBe(2);
    expect(logs[0].role).toBe('user');
    expect(logs[0].content).toContain('SOP Policy');
    expect(logs[1].role).toBe('assistant');
  });

  it('should save and load prompt library macro configurations', async () => {
    const template = await PromptTemplate.create({
      name: 'restock-evaluation',
      category: 'INSIGHTS',
      templateText: 'Evaluate reorder points for product payload.',
      variables: ['payload'],
    });

    expect(template).toBeDefined();
    expect(template.name).toBe('restock-evaluation');

    const loaded = await PromptTemplate.findOne({ name: 'restock-evaluation' });
    expect(loaded?.category).toBe('INSIGHTS');
  });
});
