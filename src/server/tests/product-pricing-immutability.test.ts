import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { Product, type IProduct } from '../models/Product.js';
import { POSService } from '../services/pos.service.js';
import { ExchangeRateService } from '../services/exchangeRate.service.js';

describe('Product Pricing Immutability & Multi-Currency Dynamic Conversion (Retail & Wholesale)', () => {
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
    const pureCalc = POSService.calculateCart(items, 0, 0);
    expect(pureCalc.subtotal).toBe(1600);
    expect(pureCalc.grandTotal).toBe(1600);

    const taxedCalc = POSService.calculateCart(items, 0.075, 0);
    expect(taxedCalc.subtotal).toBe(1600);
    expect(taxedCalc.taxTotal).toBe(120);
    expect(taxedCalc.grandTotal).toBe(1720);
  });

  it('4. Converts NGN 300 to USD accurately based on authoritative exchange rates', async () => {
    const resultNgnToUsd = await ExchangeRateService.convertCurrency({
      amount: 300,
      fromCurrency: 'NGN',
      toCurrency: 'USD',
    });
    expect(resultNgnToUsd.fromCurrency).toBe('NGN');
    expect(resultNgnToUsd.toCurrency).toBe('USD');
    expect(resultNgnToUsd.originalAmount).toBe(300);
    expect(resultNgnToUsd.convertedAmount).toBeGreaterThan(0.1);
    expect(resultNgnToUsd.convertedAmount).toBeLessThan(1.0);

    const resultUsdToNgn = await ExchangeRateService.convertCurrency({
      amount: 300,
      fromCurrency: 'USD',
      toCurrency: 'NGN',
    });
    expect(resultUsdToNgn.fromCurrency).toBe('USD');
    expect(resultUsdToNgn.toCurrency).toBe('NGN');
    expect(resultUsdToNgn.originalAmount).toBe(300);
    expect(resultUsdToNgn.convertedAmount).toBeGreaterThan(300000);

    const roundTrip = await ExchangeRateService.convertCurrency({
      amount: resultNgnToUsd.convertedAmount,
      fromCurrency: 'USD',
      toCurrency: 'NGN',
    });
    expect(roundTrip.convertedAmount).toBeGreaterThan(280);
    expect(roundTrip.convertedAmount).toBeLessThan(320);
  });

  it('5. Maintains base price in Nigerian Naira (NGN 300) while supporting dynamic currency conversion', async () => {
    const ngnProduct = await Product.create({
      tenantId,
      sku: 'SKU-NGN-300',
      name: 'Nigerian Merchant Local Item',
      category: 'Provisions',
      costPrice: 200,
      sellingPrice: 300,
      price: 300,
      retailPrice: 300,
      wholesalePrice: 250,
      quantity: 500,
      currency: 'NGN',
    });

    const stored = (await Product.findById(ngnProduct._id).lean()) as
      (IProduct & { _id: unknown }) | null;
    expect(stored?.sellingPrice).toBe(300);
    expect(stored?.retailPrice).toBe(300);
    expect(stored?.wholesalePrice).toBe(250);
    expect(stored?.currency).toBe('NGN');

    const converted = await ExchangeRateService.convertCurrency({
      amount: stored!.sellingPrice,
      fromCurrency: stored!.currency || 'NGN',
      toCurrency: 'USD',
    });
    expect(converted.convertedAmount).toBeGreaterThan(0);
    expect(converted.convertedAmount).toBeLessThan(1.0);

    const afterCheck = (await Product.findById(ngnProduct._id).lean()) as
      (IProduct & { _id: unknown }) | null;
    expect(afterCheck?.sellingPrice).toBe(300);
  });

  it('6. Exhaustive Multi-Currency Conversion Matrix (NGN, USD, EUR, GBP, CAD, AUD)', async () => {
    const pairs = [
      { from: 'NGN', to: 'USD' },
      { from: 'NGN', to: 'EUR' },
      { from: 'NGN', to: 'GBP' },
      { from: 'USD', to: 'NGN' },
      { from: 'USD', to: 'EUR' },
      { from: 'USD', to: 'GBP' },
      { from: 'EUR', to: 'USD' },
      { from: 'EUR', to: 'NGN' },
      { from: 'GBP', to: 'USD' },
      { from: 'GBP', to: 'NGN' },
      { from: 'CAD', to: 'USD' },
      { from: 'AUD', to: 'USD' },
    ];

    for (const { from, to } of pairs) {
      const res = await ExchangeRateService.convertCurrency({
        amount: 300,
        fromCurrency: from,
        toCurrency: to,
      });
      expect(res.fromCurrency).toBe(from);
      expect(res.toCurrency).toBe(to);
      expect(res.originalAmount).toBe(300);
      expect(res.convertedAmount).toBeGreaterThan(0);
      expect(res.exchangeRate).toBeGreaterThan(0);
      expect(res.rateTimestamp).toBeInstanceOf(Date);
    }
  });

  it('7. Exact 300 NGN Multi-Currency Workflow & Price Immutability', async () => {
    const p = await Product.create({
      tenantId,
      sku: 'SKU-EXACT-300-FLOW',
      name: 'Exact 300 Naira Product',
      category: 'Provisions',
      costPrice: 200,
      sellingPrice: 300,
      price: 300,
      retailPrice: 300,
      wholesalePrice: 250,
      quantity: 100,
      currency: 'NGN',
    });

    expect(p.price).toBe(300);
    expect(p.currency).toBe('NGN');

    const toUsd = await ExchangeRateService.convertCurrency({
      amount: p.price,
      fromCurrency: p.currency,
      toCurrency: 'USD',
    });
    expect(toUsd.convertedAmount).toBeGreaterThan(0);
    expect(toUsd.convertedAmount).toBeLessThan(1.0);

    const toGbp = await ExchangeRateService.convertCurrency({
      amount: p.price,
      fromCurrency: p.currency,
      toCurrency: 'GBP',
    });
    expect(toGbp.convertedAmount).toBeGreaterThan(0);
    expect(toGbp.convertedAmount).toBeLessThan(1.0);

    const toEur = await ExchangeRateService.convertCurrency({
      amount: p.price,
      fromCurrency: p.currency,
      toCurrency: 'EUR',
    });
    expect(toEur.convertedAmount).toBeGreaterThan(0);
    expect(toEur.convertedAmount).toBeLessThan(1.0);

    const toNgn = await ExchangeRateService.convertCurrency({
      amount: p.price,
      fromCurrency: p.currency,
      toCurrency: 'NGN',
    });
    expect(toNgn.convertedAmount).toBe(300);

    const dbDoc = (await Product.findById(p._id).lean()) as (IProduct & { _id: unknown }) | null;
    expect(dbDoc?.price).toBe(300);
    expect(dbDoc?.currency).toBe('NGN');
  });

  it('8. Explicit Product Price Edit from 300 NGN to 500 NGN Updates Authoritative Baseline', async () => {
    const product = await Product.create({
      tenantId,
      sku: 'SKU-EDIT-500-FLOW',
      name: 'Editable Item',
      category: 'General',
      costPrice: 200,
      sellingPrice: 300,
      price: 300,
      retailPrice: 300,
      wholesalePrice: 250,
      currency: 'NGN',
      quantity: 50,
    });

    product.sellingPrice = 500;
    product.price = 500;
    product.retailPrice = 500;
    product.wholesalePrice = 420;
    await product.save();

    const updated = (await Product.findById(product._id).lean()) as
      (IProduct & { _id: unknown }) | null;
    expect(updated?.price).toBe(500);
    expect(updated?.sellingPrice).toBe(500);
    expect(updated?.wholesalePrice).toBe(420);
    expect(updated?.currency).toBe('NGN');

    const usdConverted = await ExchangeRateService.convertCurrency({
      amount: updated!.price,
      fromCurrency: updated!.currency,
      toCurrency: 'USD',
    });
    expect(usdConverted.originalAmount).toBe(500);
    expect(usdConverted.convertedAmount).toBeGreaterThan(0.2);
  });

  it('9. Retail (300 NGN) and Wholesale (250 NGN) convert independently with zero mutual pollution', async () => {
    const product = await Product.create({
      tenantId,
      sku: 'SKU-INDEPENDENT-PRICING',
      name: 'Retail Wholesale Item',
      category: 'General',
      costPrice: 200,
      sellingPrice: 300,
      price: 300,
      retailPrice: 300,
      wholesalePrice: 250,
      currency: 'NGN',
      quantity: 50,
    });

    const retailInUsd = await ExchangeRateService.convertCurrency({
      amount: product.retailPrice!,
      fromCurrency: product.currency,
      toCurrency: 'USD',
    });

    const wholesaleInUsd = await ExchangeRateService.convertCurrency({
      amount: product.wholesalePrice!,
      fromCurrency: product.currency,
      toCurrency: 'USD',
    });

    expect(retailInUsd.originalAmount).toBe(300);
    expect(wholesaleInUsd.originalAmount).toBe(250);
    expect(retailInUsd.convertedAmount).toBeGreaterThan(wholesaleInUsd.convertedAmount);
  });
});
