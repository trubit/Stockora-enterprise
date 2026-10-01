import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Product } from '../src/server/models/Product.js';
import { Transaction } from '../src/server/models/Transaction.js';
import { Tenant } from '../src/server/models/Tenant.js';
import { User } from '../src/server/models/User.js';
import { Customer } from '../src/server/models/Customer.js';
import { StockMovement } from '../src/server/models/StockMovement.js';
import { StockAdjustment } from '../src/server/models/StockAdjustment.js';
import { AuditLog } from '../src/server/models/AuditLog.js';

interface ExplainResult {
  executionStats?: {
    executionTimeMillis: number;
    totalDocsExamined: number;
    totalKeysExamined: number;
    nReturned: number;
    executionStages: {
      stage: string;
      inputStage?: {
        stage: string;
        indexName?: string;
      };
    };
  };
  queryPlanner?: {
    winningPlan: {
      stage: string;
      inputStage?: {
        stage: string;
        indexName?: string;
      };
    };
  };
}

async function runDiagnostics() {
  console.log('===============================================================');
  console.log('📊 STOCKORA ENTERPRISE PRO — DATABASE & QUERY PERFORMANCE AUDIT');
  console.log('===============================================================');

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stockora';
  console.log(`Connecting to: ${uri}...`);
  const t0 = Date.now();
  await mongoose.connect(uri);
  const connectMs = Date.now() - t0;
  console.log(`✅ Connected in ${connectMs}ms. Connection state: ${mongoose.connection.readyState}\n`);

  // 1. Discover tenants
  const tenants = await Tenant.find({ status: { $ne: 'DELETED' } }).limit(5).lean();
  console.log(`Found ${tenants.length} tenants.`);
  if (tenants.length === 0) {
    console.log('No tenants found. Seeding minimal audit data if needed.');
  }

  const primaryTenant = tenants[0];
  const tenantId = primaryTenant?._id?.toString() || '660000000000000000000001';
  console.log(`Using Tenant: "${primaryTenant?.name || 'Default'}" (ID: ${tenantId})\n`);

  // 2. Audit Collections & Document Counts
  console.log('--- Collection Document Counts ---');
  const counts = {
    products: await Product.countDocuments(),
    transactions: await Transaction.countDocuments(),
    customers: await Customer.countDocuments(),
    stockMovements: await StockMovement.countDocuments(),
    stockAdjustments: await StockAdjustment.countDocuments(),
    auditLogs: await AuditLog.countDocuments(),
    users: await User.countDocuments(),
    tenants: await Tenant.countDocuments(),
  };
  console.table(counts);

  // 3. Inspect Existing Indexes
  console.log('\n--- Existing Indexes per Model ---');
  const collectionsToAudit = [
    { name: 'Product', model: Product },
    { name: 'Transaction', model: Transaction },
    { name: 'Customer', model: Customer },
    { name: 'StockMovement', model: StockMovement },
    { name: 'StockAdjustment', model: StockAdjustment },
    { name: 'AuditLog', model: AuditLog },
    { name: 'User', model: User },
    { name: 'Tenant', model: Tenant },
  ];

  for (const item of collectionsToAudit) {
    const indexes = await item.model.collection.indexes();
    console.log(`\n[${item.name}] Indexes (${indexes.length}):`);
    indexes.forEach((idx: any) => {
      const keys = Object.entries(idx.key).map(([k, v]) => `${k}:${v}`).join(', ');
      console.log(`  - ${idx.name}: { ${keys} } ${idx.unique ? '(UNIQUE)' : ''}`);
    });
  }

  // 4. Query Explain Plans for Critical Query Paths
  console.log('\n===============================================================');
  console.log('🔍 EXPLAIN PLANS FOR FREQUENTLY EXECUTED QUERIES');
  console.log('===============================================================');

  // Query A: Products list (Unbounded find by tenant)
  console.log('\n[A] Product.find({ tenantId })');
  try {
    const explainA: any = await (Product.find({ tenantId }) as any).explain('executionStats');
    const statsA = explainA.executionStats;
    const stageA = statsA.executionStages.stage === 'COLLSCAN' ? 'COLLSCAN' : statsA.executionStages.inputStage?.stage || statsA.executionStages.stage;
    const indexA = statsA.executionStages.inputStage?.indexName || 'NONE';
    console.log(`  Stage: ${stageA} | Index: ${indexA}`);
    console.log(`  Time: ${statsA.executionTimeMillis}ms | DocsExamined: ${statsA.totalDocsExamined} | KeysExamined: ${statsA.totalKeysExamined} | Returned: ${statsA.nReturned}`);
  } catch (err: any) {
    console.log(`  Error: ${err.message}`);
  }

  // Query B: Products search ($regex with $or across 4 fields)
  console.log('\n[B] Product.find({ tenantId, $or: [name, sku, category, barcode regex] })');
  try {
    const regex = new RegExp('test', 'i');
    const explainB: any = await (Product.find({
      tenantId,
      $or: [{ name: regex }, { sku: regex }, { category: regex }, { barcode: regex }],
    }) as any).explain('executionStats');
    const statsB = explainB.executionStats;
    const stageB = statsB.executionStages.stage === 'COLLSCAN' ? 'COLLSCAN' : statsB.executionStages.inputStage?.stage || statsB.executionStages.stage;
    const indexB = statsB.executionStages.inputStage?.indexName || 'NONE';
    console.log(`  Stage: ${stageB} | Index: ${indexB}`);
    console.log(`  Time: ${statsB.executionTimeMillis}ms | DocsExamined: ${statsB.totalDocsExamined} | KeysExamined: ${statsB.totalKeysExamined} | Returned: ${statsB.nReturned}`);
  } catch (err: any) {
    console.log(`  Error: ${err.message}`);
  }

  // Query C: Transactions list (sorted by createdAt desc, limit 100)
  console.log('\n[C] Transaction.find({ tenantId }).sort({ createdAt: -1 }).limit(100)');
  try {
    const explainC: any = await (Transaction.find({ tenantId }).sort({ createdAt: -1 }).limit(100) as any).explain('executionStats');
    const statsC = explainC.executionStats;
    const stageC = statsC.executionStages.stage === 'COLLSCAN' ? 'COLLSCAN' : statsC.executionStages.inputStage?.stage || statsC.executionStages.stage;
    const indexC = statsC.executionStages.inputStage?.indexName || 'NONE';
    console.log(`  Stage: ${stageC} | Index: ${indexC}`);
    console.log(`  Time: ${statsC.executionTimeMillis}ms | DocsExamined: ${statsC.totalDocsExamined} | KeysExamined: ${statsC.totalKeysExamined} | Returned: ${statsC.nReturned}`);
  } catch (err: any) {
    console.log(`  Error: ${err.message}`);
  }

  // Query D: StockMovements list
  console.log('\n[D] StockMovement.find({ tenantId }).sort({ createdAt: -1 }).limit(100)');
  try {
    const explainD: any = await (StockMovement.find({ tenantId }).sort({ createdAt: -1 }).limit(100) as any).explain('executionStats');
    const statsD = explainD.executionStats;
    const stageD = statsD.executionStages.stage === 'COLLSCAN' ? 'COLLSCAN' : statsD.executionStages.inputStage?.stage || statsD.executionStages.stage;
    const indexD = statsD.executionStages.inputStage?.indexName || 'NONE';
    console.log(`  Stage: ${stageD} | Index: ${indexD}`);
    console.log(`  Time: ${statsD.executionTimeMillis}ms | DocsExamined: ${statsD.totalDocsExamined} | KeysExamined: ${statsD.totalKeysExamined} | Returned: ${statsD.nReturned}`);
  } catch (err: any) {
    console.log(`  Error: ${err.message}`);
  }

  // Query E: AuditLog find with sorting
  console.log('\n[E] AuditLog.find({ ... }).sort({ createdAt: -1 }).limit(100)');
  try {
    const explainE: any = await (AuditLog.find({}).sort({ createdAt: -1 }).limit(100) as any).explain('executionStats');
    const statsE = explainE.executionStats;
    const stageE = statsE.executionStages.stage === 'COLLSCAN' ? 'COLLSCAN' : statsE.executionStages.inputStage?.stage || statsE.executionStages.stage;
    const indexE = statsE.executionStages.inputStage?.indexName || 'NONE';
    console.log(`  Stage: ${stageE} | Index: ${indexE}`);
    console.log(`  Time: ${statsE.executionTimeMillis}ms | DocsExamined: ${statsE.totalDocsExamined} | KeysExamined: ${statsE.totalKeysExamined} | Returned: ${statsE.nReturned}`);
  } catch (err: any) {
    console.log(`  Error: ${err.message}`);
  }

  // 5. Payload Size Measurement
  console.log('\n===============================================================');
  console.log('📦 RESPONSE PAYLOAD SIZE AUDIT');
  console.log('===============================================================');

  const productsAll = await Product.find({ tenantId }).lean();
  const rawProductJson = JSON.stringify(productsAll);
  console.log(`All Products JSON Payload: ${(rawProductJson.length / 1024).toFixed(2)} KB (${productsAll.length} items)`);

  const txsAll = await Transaction.find({ tenantId }).sort({ createdAt: -1 }).limit(100).lean();
  const rawTxJson = JSON.stringify(txsAll);
  console.log(`Latest 100 Transactions JSON Payload: ${(rawTxJson.length / 1024).toFixed(2)} KB (${txsAll.length} items)`);

  // 6. Concurrency / Pool Responsiveness Benchmark
  console.log('\n===============================================================');
  console.log('⚡ CONCURRENCY & CONNECTION POOL BENCHMARK (50 concurrent queries)');
  console.log('===============================================================');

  const concurrentQueries = 50;
  const startConc = Date.now();
  const promises = Array.from({ length: concurrentQueries }, (_, i) => {
    return Product.find({ tenantId }).limit(10).lean();
  });
  await Promise.all(promises);
  const totalConcTime = Date.now() - startConc;
  console.log(`Executed ${concurrentQueries} concurrent product queries in ${totalConcTime}ms (avg ${(totalConcTime / concurrentQueries).toFixed(2)}ms per query)`);

  await mongoose.disconnect();
  console.log('\n✅ Diagnostics Complete.');
}

runDiagnostics().catch(console.error);
