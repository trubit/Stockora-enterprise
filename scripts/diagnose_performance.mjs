import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

async function runDiagnostics() {
  console.log('===============================================================');
  console.log('📊 STOCKORA ENTERPRISE PRO — DATABASE & QUERY PERFORMANCE AUDIT');
  console.log('===============================================================');

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stockora';
  console.log(`Connecting to: ${uri}...`);
  const t0 = Date.now();
  await mongoose.connect(uri, {
    maxPoolSize: 50,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
  });
  const connectMs = Date.now() - t0;
  console.log(`✅ Connected in ${connectMs}ms. Connection state: ${mongoose.connection.readyState}\n`);

  const db = mongoose.connection.db;

  // 1. Discover tenants
  const tenants = await db.collection('tenants').find({ status: { $ne: 'DELETED' } }).limit(5).toArray();
  console.log(`Found ${tenants.length} tenants.`);
  const primaryTenant = tenants[0];
  const tenantId = primaryTenant?._id ? primaryTenant._id.toString() : '660000000000000000000001';
  console.log(`Using Tenant: "${primaryTenant?.name || 'Default'}" (ID: ${tenantId})\n`);

  // 2. Audit Document Counts across primary business collections
  const collections = [
    'products',
    'transactions',
    'customers',
    'stockmovements',
    'stockadjustments',
    'auditlogs',
    'users',
    'tenants',
    'branches',
    'sessions',
  ];

  console.log('--- Collection Document Counts ---');
  for (const collName of collections) {
    try {
      const count = await db.collection(collName).countDocuments();
      console.log(`  ${collName.padEnd(20)}: ${count} documents`);
    } catch (err) {
      console.log(`  ${collName.padEnd(20)}: [Not created yet]`);
    }
  }

  // 3. Inspect Existing Indexes
  console.log('\n--- Existing Indexes per Collection ---');
  for (const collName of collections) {
    try {
      const indexes = await db.collection(collName).indexes();
      console.log(`\n[${collName}] (${indexes.length} indexes):`);
      indexes.forEach((idx) => {
        const keys = Object.entries(idx.key).map(([k, v]) => `${k}:${v}`).join(', ');
        console.log(`  - ${idx.name}: { ${keys} } ${idx.unique ? '(UNIQUE)' : ''}`);
      });
    } catch (err) {
      console.log(`\n[${collName}]: collection does not exist.`);
    }
  }

  // 4. Query Explain Plans for Critical Paths
  console.log('\n===============================================================');
  console.log('🔍 EXPLAIN PLANS FOR FREQUENTLY EXECUTED QUERIES');
  console.log('===============================================================');

  // Query A: Products list by tenant
  console.log('\n[A] db.products.find({ tenantId })');
  try {
    const explainA = await db.collection('products').find({ tenantId }).explain('executionStats');
    const statsA = explainA.executionStats;
    const stageA = statsA.executionStages.stage === 'COLLSCAN' ? 'COLLSCAN' : statsA.executionStages.inputStage?.stage || statsA.executionStages.stage;
    const indexA = statsA.executionStages.inputStage?.indexName || statsA.executionStages.indexName || 'NONE';
    console.log(`  Stage: ${stageA} | Index: ${indexA}`);
    console.log(`  Time: ${statsA.executionTimeMillis}ms | DocsExamined: ${statsA.totalDocsExamined} | KeysExamined: ${statsA.totalKeysExamined} | Returned: ${statsA.nReturned}`);
  } catch (err) {
    console.log(`  Error: ${err.message}`);
  }

  // Query B: Products search ($regex unanchored)
  console.log('\n[B] db.products.find({ tenantId, $or: [name, sku, category, barcode regex] })');
  try {
    const regex = new RegExp('test', 'i');
    const explainB = await db.collection('products').find({
      tenantId,
      $or: [{ name: regex }, { sku: regex }, { category: regex }, { barcode: regex }],
    }).explain('executionStats');
    const statsB = explainB.executionStats;
    const stageB = statsB.executionStages.stage === 'COLLSCAN' ? 'COLLSCAN' : statsB.executionStages.inputStage?.stage || statsB.executionStages.stage;
    const indexB = statsB.executionStages.inputStage?.indexName || statsB.executionStages.indexName || 'NONE';
    console.log(`  Stage: ${stageB} | Index: ${indexB}`);
    console.log(`  Time: ${statsB.executionTimeMillis}ms | DocsExamined: ${statsB.totalDocsExamined} | KeysExamined: ${statsB.totalKeysExamined} | Returned: ${statsB.nReturned}`);
  } catch (err) {
    console.log(`  Error: ${err.message}`);
  }

  // Query C: Transactions list
  console.log('\n[C] db.transactions.find({ tenantId }).sort({ createdAt: -1 }).limit(100)');
  try {
    const explainC = await db.collection('transactions').find({ tenantId }).sort({ createdAt: -1 }).limit(100).explain('executionStats');
    const statsC = explainC.executionStats;
    const stageC = statsC.executionStages.stage === 'COLLSCAN' ? 'COLLSCAN' : statsC.executionStages.inputStage?.stage || statsC.executionStages.stage;
    const indexC = statsC.executionStages.inputStage?.indexName || statsC.executionStages.indexName || 'NONE';
    console.log(`  Stage: ${stageC} | Index: ${indexC}`);
    console.log(`  Time: ${statsC.executionTimeMillis}ms | DocsExamined: ${statsC.totalDocsExamined} | KeysExamined: ${statsC.totalKeysExamined} | Returned: ${statsC.nReturned}`);
  } catch (err) {
    console.log(`  Error: ${err.message}`);
  }

  // Query D: AuditLog find with sorting
  console.log('\n[D] db.auditlogs.find({}).sort({ createdAt: -1 }).limit(100)');
  try {
    const explainD = await db.collection('auditlogs').find({}).sort({ createdAt: -1 }).limit(100).explain('executionStats');
    const statsD = explainD.executionStats;
    const stageD = statsD.executionStages.stage === 'COLLSCAN' ? 'COLLSCAN' : statsD.executionStages.inputStage?.stage || statsD.executionStages.stage;
    const indexD = statsD.executionStages.inputStage?.indexName || statsD.executionStages.indexName || 'NONE';
    console.log(`  Stage: ${stageD} | Index: ${indexD}`);
    console.log(`  Time: ${statsD.executionTimeMillis}ms | DocsExamined: ${statsD.totalDocsExamined} | KeysExamined: ${statsD.totalKeysExamined} | Returned: ${statsD.nReturned}`);
  } catch (err) {
    console.log(`  Error: ${err.message}`);
  }

  // 5. Measure Payload Sizes
  console.log('\n===============================================================');
  console.log('📦 RESPONSE PAYLOAD SIZES');
  console.log('===============================================================');
  try {
    const prods = await db.collection('products').find({ tenantId }).toArray();
    console.log(`All Products JSON Payload: ${(JSON.stringify(prods).length / 1024).toFixed(2)} KB (${prods.length} items)`);
    const txs = await db.collection('transactions').find({ tenantId }).sort({ createdAt: -1 }).limit(100).toArray();
    console.log(`Latest 100 Transactions JSON Payload: ${(JSON.stringify(txs).length / 1024).toFixed(2)} KB (${txs.length} items)`);
  } catch (err) {
    console.log(`Payload measurement note: ${err.message}`);
  }

  // 6. Concurrency / Connection Pool Benchmark
  console.log('\n===============================================================');
  console.log('⚡ CONCURRENCY & CONNECTION POOL BENCHMARK (50 concurrent queries)');
  console.log('===============================================================');
  const tStart = Date.now();
  const promises = Array.from({ length: 50 }, () => {
    return db.collection('products').find({ tenantId }).limit(10).toArray();
  });
  await Promise.all(promises);
  const duration = Date.now() - tStart;
  console.log(`Executed 50 concurrent queries in ${duration}ms (avg ${(duration / 50).toFixed(2)}ms per query)`);

  await mongoose.disconnect();
  console.log('\n✅ Database Diagnostics Finished Cleanly.');
}

runDiagnostics().catch(console.error);
