import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { Product, type IProduct } from '../models/Product.js';
import { POSService } from '../services/pos.service.js';

describe('Product Pricing Immutability & Persistence (Retail & Wholesale)', () => {
  const tenantId = 'tenant_pricing_test_99';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stockora_test_product_pricing'
      );
    }
  });

  afterAll(async () => {
    await Product.deleteMany({ tenantId });
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    await Product.deleteMany({ tenantId });
  });

  it('1. Persists exact fixed price (300) without alteration or addition for Retail and Wholesale', async () => {
    await Product.create({
      tenantId,
      sku: 'SKU-EXACT-300',
      name: 'Deterministic Test Product',
      category: 'Electronics',
      costPrice: 200,
      sellingPrice: 300,
      price: 300,
      retailPrice: 300,
      wholesalePrice: 250,
      quantity: 50,
      status: 'ACTIVE',
      currency: 'USD',
    });

    const retrieved = (await Product.findOne({
      tenantId,
      sku: 'SKU-EXACT-300',
    }).lean()) as (IProduct & { _id: unknown }) | null;

    expect(retrieved).toBeDefined();
    expect(retrieved?.sellingPrice).toBe(300);
    expect(retrieved?.price).toBe(300);
    expect(retrieved?.retailPrice).toBe(300);
    expect(retrieved?.wholesalePrice).toBe(250);
    expect(retrieved?.costPrice).toBe(200);
    expect(retrieved?.cost).toBe(200);
  });

  it('2. Preserves exact price upon update without arithmetic inflation or drift', async () => {
    const product = await Product.create({
      tenantId,
      sku: 'SKU-UPDATE-300',
      name: 'Update Verification Item',
      category: 'General',
      costPrice: 150,
      sellingPrice: 300,
      price: 300,
      retailPrice: 300,
      wholesalePrice: 240,
      quantity: 100,
    });

    // Update with exact values 305 and 260
    product.sellingPrice = 305;
    product.price = 305;
    product.retailPrice = 305;
    product.wholesalePrice = 260;
    await product.save();

    const updated = (await Product.findById(product._id).lean()) as
      (IProduct & { _id: unknown }) | null;

    expect(updated?.sellingPrice).toBe(305);
    expect(updated?.price).toBe(305);
    expect(updated?.retailPrice).toBe(305);
    expect(updated?.wholesalePrice).toBe(260);
  });

  it('3. POS calculation computes exact multiples without hidden unitPrice alteration', () => {
    const items = [
      { unitPrice: 300, quantity: 2, discount: 0 },
      { unitPrice: 250, quantity: 4, discount: 0 },
    ];

    // Tax rate 0% for pure baseline validation
    const pureCalc = POSService.calculateCart(items, 0, 0);
    expect(pureCalc.subtotal).toBe(1600); // 300*2 + 250*4 = 600 + 1000 = 1600
    expect(pureCalc.grandTotal).toBe(1600);

    // Tax rate 7.5% as separate line item
    const taxedCalc = POSService.calculateCart(items, 0.075, 0);
    expect(taxedCalc.subtotal).toBe(1600);
    expect(taxedCalc.taxTotal).toBe(120); // 1600 * 0.075 = 120.00
    expect(taxedCalc.grandTotal).toBe(1720); // 1600 + 120 = 1720.00
  });
});
