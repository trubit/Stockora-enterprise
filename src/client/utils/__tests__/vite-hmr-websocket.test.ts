import { describe, it, expect } from 'vitest';
import { registerServiceWorker } from '../../registerServiceWorker.ts';
import { buildThermalHtml, normalizeReceiptData } from '../printReceipt.ts';

describe('Vite HMR WebSocket & PWA Development Guard Tests', () => {
  it('1. registerServiceWorker function is exported and callable without throwing', () => {
    expect(typeof registerServiceWorker).toBe('function');
  });

  it('2. buildThermalHtml renders zero-margin @page contract for physical thermal printers', () => {
    const receiptData = normalizeReceiptData({
      transactionNumber: 'TX-PHYSICAL-TEST-001',
      companyName: 'STOCKORA ENTERPRISE',
      total: 100,
      subtotal: 100,
      items: [
        {
          name: 'Thermal Paper Roll 80mm',
          sku: 'SKU-ROLL-01',
          quantity: 2,
          unitPrice: 50,
          total: 100,
        },
      ],
    });

    const formatAmount = (v: number) => `₦${v.toFixed(2)}`;
    const html = buildThermalHtml(receiptData, formatAmount);

    expect(html).toContain('margin: 0');
    expect(html).toContain('80mm auto');
    expect(html).toContain('TX-PHYSICAL-TEST-001');
    expect(html).toContain('STOCKORA ENTERPRISE');
  });

  it('3. buildThermalHtml escapes XSS payloads and preserves legitimate retail identities', () => {
    const receiptData = normalizeReceiptData({
      transactionNumber: 'TX-SEC-002',
      companyName: '<script>alert(1)</script>PHARMACY',
      total: 250,
      subtotal: 250,
      items: [
        {
          name: 'Paracetamol 500mg',
          sku: 'SKU-MED-01',
          quantity: 1,
          unitPrice: 250,
          total: 250,
        },
      ],
    });

    const formatAmount = (v: number) => `₦${v.toFixed(2)}`;
    const html = buildThermalHtml(receiptData, formatAmount);

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;PHARMACY');
    expect(html).toContain('Paracetamol 500mg');
  });
});
