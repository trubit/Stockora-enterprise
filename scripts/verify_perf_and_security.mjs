import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stockora';

async function main() {
  console.log(' Connecting to MongoDB:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  const db = mongoose.connection.db;

  console.log('\n=== 1. VERIFYING INDEXES ===');
  const collections = ['products', 'stockmovements', 'auditlogs', 'transactions'];
  for (const colName of collections) {
    try {
      const indexes = await db.collection(colName).indexes();
      console.log(`\nIndexes for collection [${colName}]:`);
      for (const idx of indexes) {
        console.log(` - ${idx.name}: ${JSON.stringify(idx.key)}`);
      }
    } catch (e) {
      console.log(` Collection [${colName}] not found or error: ${e.message}`);
    }
  }

  console.log('\n=== 2. MULTI-TENANT ISOLATION BENCHMARK & VERIFICATION ===');
  const tenantA = 'tenant_perf_test_alpha';
  const tenantB = 'tenant_perf_test_beta';

  const ProductCol = db.collection('products');
  const AuditLogCol = db.collection('auditlogs');
  const TransactionCol = db.collection('transactions');

  // Clean previous test artifacts
  await ProductCol.deleteMany({ tenantId: { $in: [tenantA, tenantB] } });
  await AuditLogCol.deleteMany({ tenantId: { $in: [tenantA, tenantB] } });
  await TransactionCol.deleteMany({ tenantId: { $in: [tenantA, tenantB] } });

  // Seed 50 products for Tenant A and 50 for Tenant B
  const seedProductsA = [];
  const seedProductsB = [];
  for (let i = 1; i <= 50; i++) {
    seedProductsA.push({
      tenantId: tenantA,
      sku: `SKU-A-${i.toString().padStart(4, '0')}`,
      barcode: `BAR-A-${i.toString().padStart(6, '0')}`,
      name: `Tenant A Product ${i}`,
      category: i % 2 === 0 ? 'Electronics' : 'Groceries',
      costPrice: 10 + i,
      sellingPrice: 20 + i,
      price: 20 + i,
      cost: 10 + i,
      quantity: 100,
      lowStockAlert: 10,
      status: 'ACTIVE',
      isActive: true,
      currency: 'USD',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    seedProductsB.push({
      tenantId: tenantB,
      sku: `SKU-B-${i.toString().padStart(4, '0')}`,
      barcode: `BAR-B-${i.toString().padStart(6, '0')}`,
      name: `Tenant B Secret Product ${i}`,
      category: i % 2 === 0 ? 'Hardware' : 'Apparel',
      costPrice: 50 + i,
      sellingPrice: 100 + i,
      price: 100 + i,
      cost: 50 + i,
      quantity: 50,
      lowStockAlert: 5,
      status: 'ACTIVE',
      isActive: true,
      currency: 'EUR',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  await ProductCol.insertMany(seedProductsA);
  await ProductCol.insertMany(seedProductsB);
  console.log(` Seeded 50 products for Tenant A and 50 products for Tenant B.`);

  // Verify Tenant A queries NEVER return Tenant B's data
  const tenantAProducts = await ProductCol.find({ tenantId: tenantA }).toArray();
  const hasLeakInA = tenantAProducts.some(p => p.tenantId !== tenantA || p.name.includes('Tenant B'));
  if (hasLeakInA) {
    console.error(' FAILED: Tenant A query leaked Tenant B records!');
    process.exit(1);
  } else {
    console.log(` PASSED: Tenant A queries returned exactly ${tenantAProducts.length} items (0 cross-tenant leaks).`);
  }

  const tenantBProducts = await ProductCol.find({ tenantId: tenantB }).toArray();
  const hasLeakInB = tenantBProducts.some(p => p.tenantId !== tenantB || p.name.includes('Tenant A'));
  if (hasLeakInB) {
    console.error(' FAILED: Tenant B query leaked Tenant A records!');
    process.exit(1);
  } else {
    console.log(` PASSED: Tenant B queries returned exactly ${tenantBProducts.length} items (0 cross-tenant leaks).`);
  }

  console.log('\n=== 3. CONCURRENT MULTI-TENANT QUERY BENCHMARK ===');
  const concurrentRounds = 100;
  const startConcurrent = Date.now();
  const promises = [];

  for (let i = 0; i < concurrentRounds; i++) {
    const isTenantA = i % 2 === 0;
    const targetTenant = isTenantA ? tenantA : tenantB;
    const targetSku = isTenantA ? `SKU-A-0025` : `SKU-B-0025`;

    promises.push(
      ProductCol.findOne({ tenantId: targetTenant, sku: targetSku }).then(res => {
        if (!res || res.tenantId !== targetTenant) {
          throw new Error(`Data isolation broken under concurrency! Tenant ${targetTenant} got ${res?.tenantId}`);
        }
        return res;
      })
    );
  }

  const results = await Promise.all(promises);
  const concurrentDuration = Date.now() - startConcurrent;
  console.log(` Executed ${concurrentRounds} concurrent queries across alternating tenants in ${concurrentDuration}ms (~${(concurrentDuration / concurrentRounds).toFixed(2)}ms per query).`);
  console.log(` All ${results.length} concurrent queries preserved strict multi-tenant isolation.`);

  console.log('\n=== 4. SEARCH PERFORMANCE COMPARISON ===');
  // 1. Exact indexed search (Optimized path)
  const startExact = Date.now();
  for (let i = 0; i < 50; i++) {
    await ProductCol.find({ tenantId: tenantA, $or: [{ sku: 'SKU-A-0010' }, { barcode: 'BAR-A-000010' }] }).limit(50).toArray();
  }
  const exactDuration = Date.now() - startExact;
  console.log(` 50 indexed exact lookups completed in: ${exactDuration}ms (~${(exactDuration / 50).toFixed(2)}ms avg).`);

  // 2. Escaped Regex search
  const startRegex = Date.now();
  const regex = new RegExp('Product 1', 'i');
  for (let i = 0; i < 50; i++) {
    await ProductCol.find({
      tenantId: tenantA,
      $or: [{ name: regex }, { sku: regex }, { category: regex }, { barcode: regex }]
    }).limit(50).toArray();
  }
  const regexDuration = Date.now() - startRegex;
  console.log(` 50 bounded regex lookups completed in: ${regexDuration}ms (~${(regexDuration / 50).toFixed(2)}ms avg).`);

  // Cleanup test data
  await ProductCol.deleteMany({ tenantId: { $in: [tenantA, tenantB] } });
  console.log('\n Test data cleaned up.');

  await mongoose.disconnect();
  console.log(' Benchmark and multi-tenant security verification COMPLETED successfully!');
}

main().catch(err => {
  console.error('Error during verification:', err);
  process.exit(1);
});
