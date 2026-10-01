import { describe, it, expect } from 'vitest';
import {
  normalizeReceiptData,
  validateReceiptData,
  buildThermalBodyHtml,
  buildA4BodyHtml,
  buildThermalHtml,
  buildA4Html,
  type ReceiptPrintData,
} from './printReceipt.ts';

describe('Authoritative POS Receipt Printing Engine & Data Contract Tests', () => {
  const validSaleData = {
    transactionNumber: 'TX-998822',
    date: '2026-09-30T10:15:00.000Z',
    companyName: 'Apex Supermarket Ltd',
    companyLegalName: 'Apex Retail Enterprises Limited',
    companyLogoUrl: 'https://cdn.apex.example.com/logo.png',
    companyAddress: '100 Marina Road, Lagos Island, Lagos',
    companyPhone: '+234 801 111 2222',
    companyEmail: 'sales@apexmarket.example.com',
    companyTaxId: 'TIN-APEX-998877',
    receiptHeader: 'Welcome to Apex Supermarket - Quality Everyday',
    receiptFooter: 'Thank you for shopping at Apex! Returns within 7 days.',
    branchName: 'Marina Flagship',
    cashierName: 'Jane Cashier',
    customerName: 'Adebayo Johnson',
    paymentMethod: 'CASH',
    amountTendered: 100,
    changeDue: 15,
    items: [
      {
        productName: 'Organic Whole Milk 1L',
        sku: 'MILK-ORG-001',
        quantity: 2,
        price: 15,
        total: 30,
        priceTier: 'RETAIL',
      },
      {
        name: 'Whole Grain Bread 500g',
        sku: 'BREAD-WG-002',
        qty: 1,
        unitPrice: 20,
        total: 20,
        priceTier: 'RETAIL',
      },
    ],
    subtotal: 50,
    tax: 3.75,
    discount: 0,
    total: 53.75,
    currency: 'USD',
  };

  describe('1. Data Contract Normalization (normalizeReceiptData)', () => {
    it('should correctly normalize all properties from various POS transaction shapes', () => {
      const normalized = normalizeReceiptData(validSaleData);

      expect(normalized.transactionNumber).toBe('TX-998822');
      expect(normalized.companyName).toBe('Apex Supermarket Ltd');
      expect(normalized.companyLegalName).toBe('Apex Retail Enterprises Limited');
      expect(normalized.companyAddress).toBe('100 Marina Road, Lagos Island, Lagos');
      expect(normalized.companyPhone).toBe('+234 801 111 2222');
      expect(normalized.companyEmail).toBe('sales@apexmarket.example.com');
      expect(normalized.companyTaxId).toBe('TIN-APEX-998877');
      expect(normalized.cashierName).toBe('Jane Cashier');
      expect(normalized.customerName).toBe('Adebayo Johnson');
      expect(normalized.paymentMethod).toBe('CASH');
      expect(normalized.amountTendered).toBe(100);
      expect(normalized.changeDue).toBe(15);
      expect(normalized.currency).toBe('USD');

      // Check item normalization (supports both productName/name and quantity/qty)
      expect(normalized.items).toHaveLength(2);
      expect(normalized.items[0]).toEqual({
        name: 'Organic Whole Milk 1L',
        sku: 'MILK-ORG-001',
        quantity: 2,
        unitPrice: 15,
        total: 30,
        priceTier: 'RETAIL',
      });
      expect(normalized.items[1]).toEqual({
        name: 'Whole Grain Bread 500g',
        sku: 'BREAD-WG-002',
        quantity: 1,
        unitPrice: 20,
        total: 20,
        priceTier: 'RETAIL',
      });

      expect(normalized.subtotal).toBe(50);
      expect(normalized.tax).toBe(3.75);
      expect(normalized.total).toBe(53.75);
    });

    it('should strip dummy US/USA country suffixes from addresses', () => {
      const rawWithUSA = {
        ...validSaleData,
        companyAddress: 'Victoria Island, Lagos, US',
      };
      const normalized = normalizeReceiptData(rawWithUSA);
      expect(normalized.companyAddress).toBe('Victoria Island, Lagos');
    });

    it('should handle missing optional fields safely without producing [object Object] or null strings', () => {
      const minimalSale = {
        transactionNumber: 'TX-MINIMAL',
        companyName: 'Boutique Store',
        items: [{ name: 'Item A', quantity: 1, price: 10, total: 10 }],
        subtotal: 10,
        total: 10,
      };
      const normalized = normalizeReceiptData(minimalSale);
      expect(normalized.companyLegalName).toBeUndefined();
      expect(normalized.companyAddress).toBe('');
      expect(normalized.customerName).toBeUndefined();
      expect(normalized.paymentMethod).toBe('CASH');
    });
  });

  describe('2. Pre-Print Validation (validateReceiptData)', () => {
    it('should pass validation for a complete, legitimate transaction', () => {
      const normalized = normalizeReceiptData(validSaleData);
      const result = validateReceiptData(normalized);
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should REJECT print when transaction number is missing', () => {
      const badData: ReceiptPrintData = {
        ...normalizeReceiptData(validSaleData),
        transactionNumber: '',
      };
      const result = validateReceiptData(badData);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('Transaction number is missing');
    });

    it('should REJECT print when items array is empty (prevents blank paper printouts)', () => {
      const badData: ReceiptPrintData = {
        ...normalizeReceiptData(validSaleData),
        items: [],
      };
      const result = validateReceiptData(badData);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('Receipt contains no product line items');
    });

    it('should REJECT print when line item has 0 or negative quantity', () => {
      const badData: ReceiptPrintData = {
        ...normalizeReceiptData(validSaleData),
        items: [{ name: 'Test Product', quantity: 0, unitPrice: 10, total: 0 }],
      };
      const result = validateReceiptData(badData);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('invalid quantity');
    });

    it('should REJECT print when company identity is missing', () => {
      const badData: ReceiptPrintData = {
        ...normalizeReceiptData(validSaleData),
        companyName: '',
      };
      const result = validateReceiptData(badData);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('company identity is missing');
    });

    it('should REJECT print when total is negative or NaN', () => {
      const badData: ReceiptPrintData = {
        ...normalizeReceiptData(validSaleData),
        total: NaN,
      };
      const result = validateReceiptData(badData);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('Receipt grand total is invalid');
    });
  });

  describe('3. Multi-Tenant Identity Isolation', () => {
    it('should strictly isolate company identity between Tenant A and Tenant B', () => {
      const tenantAData = normalizeReceiptData({
        transactionNumber: 'TX-TENANT-A-100',
        companyName: 'Apex Supermarket Ltd',
        companyLegalName: 'Apex Retail Enterprises Limited',
        companyTaxId: 'TIN-APEX-111',
        items: [{ name: 'Milk', quantity: 1, price: 5, total: 5 }],
        subtotal: 5,
        total: 5,
      });

      const tenantBData = normalizeReceiptData({
        transactionNumber: 'TX-TENANT-B-200',
        companyName: 'Beacon Pharmacy & Health',
        companyLegalName: 'Beacon Healthcare Global PLC',
        companyTaxId: 'TIN-BEACON-222',
        items: [{ name: 'Vitamin C', quantity: 1, price: 12, total: 12 }],
        subtotal: 12,
        total: 12,
      });

      // Tenant A receipt must never contain Tenant B data
      expect(tenantAData.companyName).toBe('Apex Supermarket Ltd');
      expect(tenantAData.companyName).not.toContain('Beacon Pharmacy');
      expect(tenantAData.companyTaxId).toBe('TIN-APEX-111');
      expect(tenantAData.companyTaxId).not.toBe('TIN-BEACON-222');

      // Tenant B receipt must never contain Tenant A data
      expect(tenantBData.companyName).toBe('Beacon Pharmacy & Health');
      expect(tenantBData.companyName).not.toContain('Apex Supermarket');
      expect(tenantBData.companyTaxId).toBe('TIN-BEACON-222');
      expect(tenantBData.companyTaxId).not.toBe('TIN-APEX-111');
    });
  });

  describe('4. Format Handling (Thermal 80mm vs 58mm vs A4)', () => {
    it('should default to THERMAL_80 format and allow switching to THERMAL_58 and A4', () => {
      const defaultReceipt = normalizeReceiptData(validSaleData);
      expect(defaultReceipt.format).toBe('THERMAL_80');

      const thermal58Receipt = normalizeReceiptData({ ...validSaleData, format: 'THERMAL_58' });
      expect(thermal58Receipt.format).toBe('THERMAL_58');

      const thermal80Receipt = normalizeReceiptData({ ...validSaleData, format: 'THERMAL_80' });
      expect(thermal80Receipt.format).toBe('THERMAL_80');

      const a4Receipt = normalizeReceiptData({ ...validSaleData, format: 'A4' });
      expect(a4Receipt.format).toBe('A4');
    });

    it('should generate distinct page sizes and geometry for 58mm, 80mm, and A4', () => {
      const formatAmount = (v: number) => `$${v.toFixed(2)}`;
      const normalized = normalizeReceiptData(validSaleData);

      // 58mm verification
      const html58 = buildThermalHtml(normalized, formatAmount, 'THERMAL_58');
      expect(html58).toContain('size: 58mm auto;');
      expect(html58).toContain('max-width: 54mm;');
      expect(html58).toContain('break-inside: avoid;');

      // 80mm verification
      const html80 = buildThermalHtml(normalized, formatAmount, 'THERMAL_80');
      expect(html80).toContain('size: 80mm auto;');
      expect(html80).toContain('max-width: 80mm;');
      expect(html80).toContain('break-inside: avoid;');

      // A4 verification
      const htmlA4 = buildA4Html(normalized, formatAmount);
      expect(htmlA4).toContain('size: A4 portrait;');
      expect(htmlA4).toContain('max-width: 190mm;');
      expect(htmlA4).toContain('break-inside: avoid;');
    });
  });

  describe('5. Security Constraints & XSS Sanitization', () => {
    it('should neutralize XSS payloads in all string fields across thermal and A4 formats', () => {
      const xssData = normalizeReceiptData({
        ...validSaleData,
        companyName: '<script>alert("pwned-company")</script>Secure Pharmacy',
        companyLegalName: '<img src=x onerror=alert(1)>Legal Name',
        receiptHeader: '<b onmouseover=evil()>Welcome</b>',
        receiptFooter: '"><script>document.cookie</script>',
        items: [
          {
            name: '<svg onload=alert("item")>Painkillers',
            sku: 'SKU"><script>alert(1)</script>',
            quantity: 1,
            price: 10,
            total: 10,
          },
        ],
      });

      const formatAmount = (v: number) => `$${v.toFixed(2)}`;

      const thermalHtml = buildThermalBodyHtml(xssData, formatAmount);
      // Raw dangerous HTML tags must NOT be present unescaped
      expect(thermalHtml).not.toContain('<script>alert("pwned-company")</script>');
      expect(thermalHtml).not.toContain('<img src=x onerror=alert(1)>');
      expect(thermalHtml).not.toContain('<svg onload=alert("item")>');
      // Escaped safe entities must be present
      expect(thermalHtml).toContain(
        '&lt;script&gt;alert(&quot;pwned-company&quot;)&lt;/script&gt;'
      );
      expect(thermalHtml).toContain('&lt;img src=x onerror=alert(1)&gt;');
      expect(thermalHtml).toContain('&lt;svg onload=alert(&quot;item&quot;)&gt;');

      const a4Html = buildA4BodyHtml(xssData, formatAmount);
      expect(a4Html).not.toContain('<script>alert("pwned-company")</script>');
      expect(a4Html).not.toContain('<img src=x onerror=alert(1)>');
      expect(a4Html).not.toContain('<svg onload=alert("item")>');
      expect(a4Html).toContain('&lt;script&gt;alert(&quot;pwned-company&quot;)&lt;/script&gt;');
      expect(a4Html).toContain('&lt;img src=x onerror=alert(1)&gt;');
      expect(a4Html).toContain('&lt;svg onload=alert(&quot;item&quot;)&gt;');
    });
  });
});
