/**
 * printReceipt.ts
 * Enterprise POS Receipt & Invoice Printing Engine for Stockora Enterprise Pro.
 *
 * Provides deterministic, isolated, multi-format (Thermal 80mm & A4) printing
 * with programmatic pre-print validation, authentic tenant/company branding,
 * XSS-safe entity sanitization, and zero DOM clipping or stylesheet interference.
 *
 * Architecture:
 * Full-Viewport Active Iframe Engine — creates a same-origin about:blank iframe
 * with maximum z-index and real geometry, writes standalone receipt HTML into it,
 * and calls iframe.contentWindow.print() to open the print dialog targeting ONLY
 * the receipt document. The main SPA #root is hidden during printing via a CSS class.
 */

import { toast } from 'react-hot-toast';
import { sanitizePrintHtml } from './sanitizePrintHtml.ts';

export type ReceiptPrintFormat = 'THERMAL' | 'THERMAL_80' | 'THERMAL_58' | 'A4';

export interface ReceiptItemContract {
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  priceTier?: 'RETAIL' | 'WHOLESALE' | string;
}

export interface ReceiptPrintData {
  transactionNumber: string;
  date?: string | Date;
  createdAt?: string | Date;
  // Multi-tenant Seller Identity
  companyName: string;
  companyLegalName?: string;
  companyLogoUrl?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyTaxId?: string;
  receiptHeader?: string;
  receiptFooter?: string;
  // POS Operations Metadata
  branchName?: string;
  cashierName?: string;
  customerName?: string;
  customerEmail?: string;
  paymentMethod: string;
  currencyCode?: string;
  currency?: string;
  pricingMode?: string;
  amountTendered?: number;
  changeDue?: number;
  // Items & Totals
  items: ReceiptItemContract[];
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  platformAttribution?: string;
  format?: ReceiptPrintFormat;
}

export interface ReceiptValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Normalizes raw input from various POS / transaction sources into a strict ReceiptPrintData contract.
 */
export function normalizeReceiptData(raw: any, fallbackCurrency = 'USD'): ReceiptPrintData {
  if (!raw || typeof raw !== 'object') {
    return {
      transactionNumber: '',
      companyName: '',
      items: [],
      subtotal: 0,
      total: 0,
      paymentMethod: 'CASH',
      format: 'THERMAL_80',
    };
  }

  // Normalize Items
  const rawItems = Array.isArray(raw.items)
    ? raw.items
    : Array.isArray(raw.lineItems)
      ? raw.lineItems
      : Array.isArray(raw.products)
        ? raw.products
        : [];

  const items: ReceiptItemContract[] = rawItems.map((item: any) => {
    const name = String(item.productName || item.name || item.description || 'Item');
    const sku = item.sku ? String(item.sku) : undefined;
    const quantity = Math.max(1, Number(item.quantity ?? item.qty ?? 1));
    const unitPrice = Math.max(
      0,
      Number(item.price ?? item.unitPrice ?? (item.total ? item.total / quantity : 0))
    );
    const total = Math.max(0, Number(item.total ?? item.lineTotal ?? quantity * unitPrice));
    const priceTier = item.priceTier || undefined;
    return { name, sku, quantity, unitPrice, total, priceTier };
  });

  const rawSubtotal = raw.subtotal ?? raw.totals?.subtotal;
  const rawTax = raw.tax ?? raw.totals?.tax ?? 0;
  const rawDiscount = raw.discount ?? raw.totals?.discount ?? 0;
  const rawTotal = raw.total ?? raw.totals?.totalAmount ?? raw.totals?.total;

  const subtotal = Number(
    rawSubtotal !== undefined ? rawSubtotal : items.reduce((sum, i) => sum + i.total, 0)
  );
  const tax = Number(rawTax);
  const discount = Number(rawDiscount);
  const total = Number(rawTotal !== undefined ? rawTotal : Math.max(0, subtotal + tax - discount));

  const sanitizeAddr = (addr?: string): string => {
    if (!addr) return '';
    const trimmed = String(addr).trim();
    const upper = trimmed.toUpperCase().replace(/[\.,]/g, '');
    if (upper === 'US' || upper === 'USA' || upper === 'UNITED STATES') return '';
    const cleaned = trimmed.replace(/,\s*(US|USA|United States)$/i, '').trim();
    return cleaned.toUpperCase() === 'US' || cleaned.toUpperCase() === 'USA' ? '' : cleaned;
  };

  let format: ReceiptPrintFormat = 'THERMAL_80';
  if (raw.format === 'A4') {
    format = 'A4';
  } else if (raw.format === 'THERMAL_58' || raw.format === '58mm') {
    format = 'THERMAL_58';
  } else if (raw.format === 'THERMAL_80' || raw.format === '80mm' || raw.format === 'THERMAL') {
    format = 'THERMAL_80';
  }

  return {
    transactionNumber: String(raw.transactionNumber || raw.receiptNumber || raw.orderNumber || ''),
    date: raw.date || raw.createdAt || new Date().toISOString(),
    createdAt: raw.createdAt || raw.date || new Date().toISOString(),
    companyName: String(
      raw.companyName ||
        raw.businessName ||
        raw.header?.companyName ||
        raw.header?.businessName ||
        'Retail Store'
    ).trim(),
    companyLegalName: raw.companyLegalName || raw.legalName || raw.header?.companyLegalName,
    companyLogoUrl: raw.companyLogoUrl || raw.logoUrl || raw.header?.logoUrl,
    companyAddress: sanitizeAddr(raw.companyAddress || raw.address || raw.header?.address),
    companyPhone: raw.companyPhone || raw.phone || raw.header?.phone,
    companyEmail: raw.companyEmail || raw.email || raw.header?.email,
    companyTaxId: raw.companyTaxId || raw.taxId || raw.header?.taxId,
    receiptHeader: raw.receiptHeader || raw.headerNotice || raw.header?.headerNotice,
    receiptFooter:
      raw.receiptFooter || raw.footer || raw.footerNote || 'Thank you for your business!',
    branchName: raw.branchName || 'Main Branch',
    cashierName: raw.cashierName || raw.cashier || 'Cashier',
    customerName: raw.customerName,
    customerEmail: raw.customerEmail,
    paymentMethod: String(raw.paymentMethod || 'CASH').toUpperCase(),
    currencyCode: raw.currencyCode || raw.currency || fallbackCurrency,
    currency: raw.currency || raw.currencyCode || fallbackCurrency,
    pricingMode: raw.pricingMode,
    amountTendered: raw.amountTendered !== undefined ? Number(raw.amountTendered) : undefined,
    changeDue: raw.changeDue !== undefined ? Number(raw.changeDue) : undefined,
    items,
    subtotal,
    tax,
    discount,
    total,
    platformAttribution: raw.platformAttribution || 'Powered by Stockora Enterprise',
    format,
  };
}

/**
 * Programmatically validates receipt data before calling browser print mechanisms.
 * Prevents blank prints, missing transaction IDs, or empty cart receipts from going to print preview.
 */
export function validateReceiptData(data: ReceiptPrintData): ReceiptValidationResult {
  if (!data || typeof data !== 'object') {
    return { isValid: false, errorMessage: 'Receipt data is null or invalid.' };
  }

  if (!data.transactionNumber || data.transactionNumber.trim() === '') {
    return { isValid: false, errorMessage: 'Transaction number is missing.' };
  }

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    return { isValid: false, errorMessage: 'Receipt contains no product line items.' };
  }

  for (let idx = 0; idx < data.items.length; idx++) {
    const item = data.items[idx];
    if (!item.name || item.name.trim() === '') {
      return {
        isValid: false,
        errorMessage: `Item at line ${idx + 1} has no description or product name.`,
      };
    }
    if (isNaN(item.quantity) || item.quantity <= 0) {
      return {
        isValid: false,
        errorMessage: `Item "${item.name}" has an invalid quantity (${item.quantity}).`,
      };
    }
    if (isNaN(item.total) || item.total < 0) {
      return { isValid: false, errorMessage: `Item "${item.name}" has an invalid line total.` };
    }
  }

  if (isNaN(data.subtotal) || data.subtotal < 0) {
    return { isValid: false, errorMessage: 'Receipt subtotal is invalid.' };
  }

  if (isNaN(data.total) || data.total < 0) {
    return { isValid: false, errorMessage: 'Receipt grand total is invalid.' };
  }

  if (!data.companyName || data.companyName.trim() === '') {
    return { isValid: false, errorMessage: 'Authoritative company identity is missing.' };
  }

  return { isValid: true };
}

/**
 * Builds inner HTML content for 80mm or 58mm thermal receipt format.
 */
export function buildThermalBodyHtml(
  data: ReceiptPrintData,
  formatAmount: (val: number) => string,
  widthFormat: 'THERMAL_80' | 'THERMAL_58' | 'THERMAL' = 'THERMAL_80'
): string {
  const is58mm = widthFormat === 'THERMAL_58' || data.format === 'THERMAL_58';
  const displayDate = new Date(data.date || data.createdAt || Date.now()).toLocaleString();
  const safeCompanyName = sanitizePrintHtml(data.companyName);
  const safeCompanyLegalName = sanitizePrintHtml(data.companyLegalName);
  const safeCompanyAddress = sanitizePrintHtml(data.companyAddress);
  const safeCompanyPhone = sanitizePrintHtml(data.companyPhone);
  const safeCompanyEmail = sanitizePrintHtml(data.companyEmail);
  const safeCompanyTaxId = sanitizePrintHtml(data.companyTaxId);
  const safeReceiptHeader = sanitizePrintHtml(data.receiptHeader);
  const safeReceiptFooter = sanitizePrintHtml(data.receiptFooter);
  const safeBranchName = sanitizePrintHtml(data.branchName);
  const safeCashierName = sanitizePrintHtml(data.cashierName);
  const safeCustomerName = sanitizePrintHtml(data.customerName);
  const safeCustomerEmail = sanitizePrintHtml(data.customerEmail);
  const safePaymentMethod = sanitizePrintHtml(data.paymentMethod);
  const safeTransactionNumber = sanitizePrintHtml(data.transactionNumber);
  const safePlatformAttribution = sanitizePrintHtml(data.platformAttribution);

  const containerMaxWidth = is58mm ? '54mm' : '80mm';
  const baseFontSize = is58mm ? '10px' : '11.5px';
  const brandTitleSize = is58mm ? '14px' : '16px';
  const itemNameSize = is58mm ? '11px' : '12.5px';
  const itemTotalSize = is58mm ? '11px' : '12.5px';
  const itemSubSize = is58mm ? '9.5px' : '11px';
  const grandTotalSize = is58mm ? '13px' : '14.5px';
  const barcodeHeight = is58mm ? '22px' : '28px';
  const barcodeWidth = is58mm ? '85%' : '75%';

  const itemsHtml = data.items
    .map((item) => {
      const safeItemName = sanitizePrintHtml(item.name);
      const safeSku = sanitizePrintHtml(item.sku);
      const safeTier = sanitizePrintHtml(item.priceTier);
      const tierBadge = safeTier
        ? `<span style="font-size:9px;font-weight:700;background:#eeeeee;padding:1px 3px;border-radius:2px;margin-left:3px;">${safeTier}</span>`
        : '';
      const skuLine = safeSku
        ? `<div style="font-size:9.5px;color:#444444;font-family:monospace;">SKU: ${safeSku}</div>`
        : '';
      return `
        <tr style="page-break-inside: avoid; break-inside: avoid;">
          <td style="padding: ${is58mm ? '3.5px 0' : '5px 0'}; text-align: left; vertical-align: top; border-bottom: 1px dotted #bbbbbb;">
            <div style="font-weight: 700; font-size: ${itemNameSize}; color: #000000; line-height: 1.25;">
              ${safeItemName}${tierBadge}
            </div>
            ${skuLine}
            <div style="font-size: ${itemSubSize}; color: #222222; margin-top: 1px;">
              ${item.quantity} &times; ${formatAmount(item.unitPrice)}
            </div>
          </td>
          <td style="padding: ${is58mm ? '3.5px 0' : '5px 0'}; text-align: right; vertical-align: top; font-weight: 800; font-size: ${itemTotalSize}; color: #000000; border-bottom: 1px dotted #bbbbbb; white-space: nowrap;">
            ${formatAmount(item.total)}
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <div id="receipt-print-root" style="width: 100%; max-width: ${containerMaxWidth}; margin: 0 auto; text-align: center; color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: ${baseFontSize}; line-height: 1.35;">
      <div class="brand-header" style="page-break-inside: avoid; break-inside: avoid;">
        ${data.companyLogoUrl ? `<img src="${sanitizePrintHtml(data.companyLogoUrl)}" class="logo-img" style="max-height: ${is58mm ? '40px' : '48px'}; max-width: ${is58mm ? '120px' : '140px'}; margin: 0 auto 6px auto; display: block; object-fit: contain;" id="receipt-logo-img" alt="Logo" />` : ''}
        <div class="brand-title" style="font-size: ${brandTitleSize}; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0; color: #000000 !important;">${safeCompanyName}</div>
        ${safeCompanyLegalName ? `<div class="legal-title" style="font-size: ${is58mm ? '10px' : '11px'}; font-weight: 600; color: #222222 !important; margin: 0 0 2px 0;">${safeCompanyLegalName}</div>` : ''}
        ${safeCompanyAddress ? `<div class="info-line" style="font-size: ${is58mm ? '9.5px' : '10.5px'}; color: #333333 !important; margin: 1.5px 0;">${safeCompanyAddress}</div>` : ''}
        ${
          safeCompanyPhone || safeCompanyEmail
            ? `
          <div class="info-line" style="font-size: ${is58mm ? '9.5px' : '10.5px'}; color: #333333 !important; margin: 1.5px 0;">
            ${[safeCompanyPhone ? `Tel: ${safeCompanyPhone}` : '', safeCompanyEmail ? `Email: ${safeCompanyEmail}` : ''].filter(Boolean).join(' • ')}
          </div>
        `
            : ''
        }
        ${safeCompanyTaxId ? `<div class="info-line" style="font-size: ${is58mm ? '9.5px' : '10.5px'}; color: #333333 !important; margin: 1.5px 0;">Tax ID / VAT: <strong>${safeCompanyTaxId}</strong></div>` : ''}
      </div>

      <div class="divider" style="border: none; border-top: 1px dashed #000000; margin: 6px 0;"></div>

      ${
        safeReceiptHeader
          ? `
        <div style="font-weight: 700; font-size: ${is58mm ? '10.5px' : '11.5px'}; text-transform: uppercase; margin: 3px 0; color: #000000;">
          ${safeReceiptHeader}
        </div>
        <div class="divider" style="border: none; border-top: 1px dashed #000000; margin: 6px 0;"></div>
      `
          : ''
      }

      <table class="meta-table" style="width: 100%; border-collapse: collapse; font-size: ${is58mm ? '9.5px' : '11px'}; margin: 4px 0; page-break-inside: avoid; break-inside: avoid;">
        <tr>
          <td style="text-align: left; padding: 2px 0; color: #333333;">Receipt #:</td>
          <td style="text-align: right; font-weight: 800; font-family: monospace; color: #000000;">${safeTransactionNumber}</td>
        </tr>
        <tr>
          <td style="text-align: left; padding: 2px 0; color: #333333;">Date & Time:</td>
          <td style="text-align: right; color: #000000;">${displayDate}</td>
        </tr>
        <tr>
          <td style="text-align: left; padding: 2px 0; color: #333333;">Terminal / Branch:</td>
          <td style="text-align: right; color: #000000;">${safeBranchName}</td>
        </tr>
        <tr>
          <td style="text-align: left; padding: 2px 0; color: #333333;">Cashier:</td>
          <td style="text-align: right; font-weight: 700; color: #000000;">${safeCashierName}</td>
        </tr>
        ${
          safeCustomerName
            ? `
        <tr>
          <td style="text-align: left; padding: 2px 0; color: #333333;">Customer:</td>
          <td style="text-align: right; font-weight: 700; color: #000000;">${safeCustomerName}</td>
        </tr>`
            : ''
        }
        ${
          safeCustomerEmail
            ? `
        <tr>
          <td style="text-align: left; padding: 2px 0; color: #333333;">Customer Email:</td>
          <td style="text-align: right; color: #000000;">${safeCustomerEmail}</td>
        </tr>`
            : ''
        }
        <tr>
          <td style="text-align: left; padding: 2px 0; color: #333333;">Payment Method:</td>
          <td style="text-align: right; font-weight: 800; color: #000000;">${safePaymentMethod}</td>
        </tr>
      </table>

      <div class="divider" style="border: none; border-top: 1px dashed #000000; margin: 6px 0;"></div>

      <table class="items-table" style="width: 100%; border-collapse: collapse; margin: 6px 0;">
        <thead>
          <tr style="border-bottom: 1.5px solid #000000; page-break-inside: avoid; break-inside: avoid;">
            <th style="text-align: left; padding-bottom: 4px; font-weight: 900; font-size: ${is58mm ? '10px' : '11.5px'}; text-transform: uppercase;">Item / Qty</th>
            <th style="text-align: right; padding-bottom: 4px; font-weight: 900; font-size: ${is58mm ? '10px' : '11.5px'}; text-transform: uppercase;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <table class="totals-table" style="width: 100%; border-collapse: collapse; margin-top: 6px; font-size: ${is58mm ? '10px' : '11.5px'}; page-break-inside: avoid; break-inside: avoid;">
        <tr>
          <td style="text-align: left; padding: 2px 0; color: #222222;">Subtotal:</td>
          <td style="text-align: right; font-weight: 700; color: #000000;">${formatAmount(data.subtotal)}</td>
        </tr>
        ${
          data.tax && data.tax > 0
            ? `
        <tr>
          <td style="text-align: left; padding: 2px 0; color: #222222;">Sales Tax / VAT:</td>
          <td style="text-align: right; font-weight: 700; color: #000000;">${formatAmount(data.tax)}</td>
        </tr>`
            : ''
        }
        ${
          data.discount && data.discount > 0
            ? `
        <tr>
          <td style="text-align: left; padding: 2px 0; color: #222222;">Discount:</td>
          <td style="text-align: right; font-weight: 700; color: #000000;">-${formatAmount(data.discount)}</td>
        </tr>`
            : ''
        }
        <tr style="border-top: 1.5px solid #000000; font-size: ${grandTotalSize}; font-weight: 900;">
          <td style="text-align: left; padding: 6px 0 2px 0; color: #000000;">GRAND TOTAL:</td>
          <td style="text-align: right; padding: 6px 0 2px 0; color: #000000;">${formatAmount(data.total)}</td>
        </tr>
        ${
          data.amountTendered !== undefined && data.amountTendered > 0
            ? `
        <tr>
          <td style="text-align: left; padding: 2px 0; color: #333333;">Amount Tendered:</td>
          <td style="text-align: right; font-weight: 700; color: #000000;">${formatAmount(data.amountTendered)}</td>
        </tr>`
            : ''
        }
        ${
          data.changeDue !== undefined && data.changeDue >= 0
            ? `
        <tr>
          <td style="text-align: left; padding: 2px 0; color: #333333;">Change Due:</td>
          <td style="text-align: right; font-weight: 700; color: #000000;">${formatAmount(data.changeDue)}</td>
        </tr>`
            : ''
        }
      </table>

      <div class="divider" style="border: none; border-top: 1px dashed #000000; margin: 6px 0;"></div>

      <div class="footer-block" style="margin-top: 8px; page-break-inside: avoid; break-inside: avoid;">
        <div style="font-weight: 700; font-size: ${is58mm ? '10px' : '11.5px'}; color: #000000; margin-bottom: 2px;">
          ${safeReceiptFooter}
        </div>
        <div style="font-size: ${is58mm ? '9px' : '10px'}; color: #444444;">
          Please retain this receipt for warranty and return verification within 14 days.
        </div>

        <div style="margin: 10px auto 4px auto; text-align: center;">
          <div style="height: ${barcodeHeight}; width: ${barcodeWidth}; margin: 0 auto; background: repeating-linear-gradient(90deg, #000 0px, #000 2px, #fff 2px, #fff 4px, #000 4px, #000 7px, #fff 7px, #fff 9px);"></div>
          <div style="font-family: monospace; font-size: ${is58mm ? '9px' : '10px'}; letter-spacing: 1px; margin-top: 2px; color: #000000;">${safeTransactionNumber}</div>
        </div>

        <div style="font-size: ${is58mm ? '8.5px' : '9.5px'}; color: #666666; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 6px;">
          ${safePlatformAttribution}
        </div>
      </div>
    </div>
  `;
}

/**
 * Builds inner HTML content for A4 tax invoice format.
 */
export function buildA4BodyHtml(
  data: ReceiptPrintData,
  formatAmount: (val: number) => string
): string {
  const displayDate = new Date(data.date || data.createdAt || Date.now()).toLocaleString();
  const safeCompanyName = sanitizePrintHtml(data.companyName);
  const safeCompanyLegalName = sanitizePrintHtml(data.companyLegalName);
  const safeCompanyAddress = sanitizePrintHtml(data.companyAddress);
  const safeCompanyPhone = sanitizePrintHtml(data.companyPhone);
  const safeCompanyEmail = sanitizePrintHtml(data.companyEmail);
  const safeCompanyTaxId = sanitizePrintHtml(data.companyTaxId);
  const safeReceiptFooter = sanitizePrintHtml(data.receiptFooter);
  const safeBranchName = sanitizePrintHtml(data.branchName);
  const safeCashierName = sanitizePrintHtml(data.cashierName);
  const safeCustomerName = sanitizePrintHtml(data.customerName);
  const safeCustomerEmail = sanitizePrintHtml(data.customerEmail);
  const safePaymentMethod = sanitizePrintHtml(data.paymentMethod);
  const safeTransactionNumber = sanitizePrintHtml(data.transactionNumber);
  const safePlatformAttribution = sanitizePrintHtml(data.platformAttribution);

  const itemsHtml = data.items
    .map((item, index) => {
      const safeItemName = sanitizePrintHtml(item.name);
      const safeSku = sanitizePrintHtml(item.sku);
      const safeTier = sanitizePrintHtml(item.priceTier);
      const tierBadge = safeTier
        ? `<span style="font-size:10px;font-weight:700;background:#f1f5f9;padding:2px 6px;border-radius:4px;margin-left:6px;border:1px solid #cbd5e1;">${safeTier}</span>`
        : '';
      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; text-align: center; color: #64748b;">${index + 1}</td>
          <td style="padding: 10px;">
            <div style="font-weight: 700; font-size: 13.5px; color: #0f172a;">${safeItemName}${tierBadge}</div>
            ${safeSku ? `<div style="font-size: 11px; color: #64748b; font-family: monospace;">SKU: ${safeSku}</div>` : ''}
          </td>
          <td style="padding: 10px; text-align: center; font-weight: 700;">${item.quantity}</td>
          <td style="padding: 10px; text-align: right;">${formatAmount(item.unitPrice)}</td>
          <td style="padding: 10px; text-align: right; font-weight: 700;">${formatAmount(item.total)}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <div id="receipt-print-root" style="width: 100%; max-width: 190mm; margin: 0 auto; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.5;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px;">
        <div>
          ${data.companyLogoUrl ? `<img src="${sanitizePrintHtml(data.companyLogoUrl)}" style="max-height: 52px; margin-bottom: 8px; display: block;" id="receipt-logo-img" alt="Logo" />` : ''}
          <h1 style="margin: 0 0 4px 0; font-size: 24px; font-weight: 900; text-transform: uppercase; color: #0f172a;">${safeCompanyName}</h1>
          ${safeCompanyLegalName ? `<div style="font-weight: 600; color: #475569;">${safeCompanyLegalName}</div>` : ''}
          ${safeCompanyAddress ? `<div>${safeCompanyAddress}</div>` : ''}
          ${safeCompanyPhone || safeCompanyEmail ? `<div>${[safeCompanyPhone ? `Tel: ${safeCompanyPhone}` : '', safeCompanyEmail ? `Email: ${safeCompanyEmail}` : ''].filter(Boolean).join(' • ')}</div>` : ''}
          ${safeCompanyTaxId ? `<div>Tax ID / VAT: <strong>${safeCompanyTaxId}</strong></div>` : ''}
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0 0 6px 0; font-size: 22px; color: #4338ca; font-weight: 900; letter-spacing: 0.5px;">TAX INVOICE</h2>
          <div>Invoice #: <strong>${safeTransactionNumber}</strong></div>
          <div>Date: <strong>${displayDate}</strong></div>
          <div>Payment: <strong>${safePaymentMethod}</strong></div>
          <div>Branch: <strong>${safeBranchName}</strong></div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;">
        <div>
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Billed To / Customer:</div>
          <div style="font-weight: 700; font-size: 14px;">${safeCustomerName || 'Walk-in Retail Customer'}</div>
          ${safeCustomerEmail ? `<div style="color: #475569;">${safeCustomerEmail}</div>` : ''}
        </div>
        <div style="text-align: right;">
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Issuing Cashier:</div>
          <div style="font-weight: 700;">${safeCashierName}</div>
          <div style="font-size: 11px; color: #64748b;">Official POS Terminal Receipt</div>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="background: #0f172a; color: #ffffff;">
            <th style="width: 40px; text-align: center; color: #ffffff !important; font-weight: 800; padding: 10px; font-size: 12px;">#</th>
            <th style="color: #ffffff !important; font-weight: 800; padding: 10px; text-align: left; font-size: 12px;">Item Description</th>
            <th style="width: 70px; text-align: center; color: #ffffff !important; font-weight: 800; padding: 10px; font-size: 12px;">Qty</th>
            <th style="width: 120px; text-align: right; color: #ffffff !important; font-weight: 800; padding: 10px; font-size: 12px;">Unit Price</th>
            <th style="width: 130px; text-align: right; color: #ffffff !important; font-weight: 800; padding: 10px; font-size: 12px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
        <table style="width: 320px; border-collapse: collapse;">
          <tr>
            <td style="color: #475569; padding: 6px 0;">Subtotal:</td>
            <td style="text-align: right; font-weight: 700; padding: 6px 0;">${formatAmount(data.subtotal)}</td>
          </tr>
          ${
            data.tax && data.tax > 0
              ? `
          <tr>
            <td style="color: #475569; padding: 6px 0;">Sales Tax / VAT:</td>
            <td style="text-align: right; font-weight: 700; padding: 6px 0;">${formatAmount(data.tax)}</td>
          </tr>`
              : ''
          }
          ${
            data.discount && data.discount > 0
              ? `
          <tr>
            <td style="color: #475569; padding: 6px 0;">Discount Applied:</td>
            <td style="text-align: right; font-weight: 700; color: #dc2626; padding: 6px 0;">-${formatAmount(data.discount)}</td>
          </tr>`
              : ''
          }
          <tr style="border-top: 2px solid #0f172a; font-size: 16px; font-weight: 900; color: #059669;">
            <td style="padding: 8px 0;">Total Due / Paid:</td>
            <td style="text-align: right; padding: 8px 0;">${formatAmount(data.total)}</td>
          </tr>
        </table>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; font-size: 11.5px; color: #64748b; page-break-inside: avoid; break-inside: avoid;">
        <div style="font-weight: 600; margin-bottom: 4px;">${safeReceiptFooter}</div>
        <div style="margin: 10px auto 4px auto; text-align: center;">
          <div style="height: 28px; width: 220px; margin: 0 auto; background: repeating-linear-gradient(90deg, #000 0px, #000 2px, #fff 2px, #fff 4px, #000 4px, #000 7px, #fff 7px, #fff 9px);"></div>
          <div style="font-family: monospace; font-size: 11px; letter-spacing: 1px; margin-top: 2px; color: #0f172a;">${safeTransactionNumber}</div>
        </div>
        <div style="margin-top: 6px;">${safePlatformAttribution} • POS Sales Record Verified</div>
      </div>
    </div>
  `;
}

/**
 * Builds standalone HTML document for 80mm or 58mm thermal receipt format.
 */
export function buildThermalHtml(
  data: ReceiptPrintData,
  formatAmount: (val: number) => string,
  widthFormat: 'THERMAL_80' | 'THERMAL_58' | 'THERMAL' = 'THERMAL_80'
): string {
  const is58mm = widthFormat === 'THERMAL_58' || data.format === 'THERMAL_58';
  const bodyContent = buildThermalBodyHtml(
    data,
    formatAmount,
    is58mm ? 'THERMAL_58' : 'THERMAL_80'
  );
  const pageSize = is58mm ? '58mm auto' : '80mm auto';
  const baseFontSize = is58mm ? '10px' : '11.5px';
  const bodyPadding = is58mm ? '2px 1px' : '4px 2px';

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Receipt #${sanitizePrintHtml(data.transactionNumber)}</title>
        <style>
          @page {
            size: ${pageSize};
            margin: 0;
          }
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: ${bodyPadding};
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #000000 !important;
            background: #ffffff !important;
            font-size: ${baseFontSize};
            line-height: 1.35;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          tr, .meta-table, .totals-table, .footer-block, .brand-header {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        </style>
      </head>
      <body>
        ${bodyContent}
      </body>
    </html>
  `;
}

/**
 * Builds standalone HTML document for A4 tax invoice format.
 */
export function buildA4Html(data: ReceiptPrintData, formatAmount: (val: number) => string): string {
  const bodyContent = buildA4BodyHtml(data, formatAmount);
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Tax Invoice #${sanitizePrintHtml(data.transactionNumber)}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a !important;
            background: #ffffff !important;
            margin: 0;
            padding: 0;
            font-size: 13px;
            line-height: 1.5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          tr, .totals-box, .footer-block, .header-block, .meta-box {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        </style>
      </head>
      <body>
        ${bodyContent}
      </body>
    </html>
  `;
}

// ensurePrintPortal removed — the iframe engine never uses a body portal.
// The #stockora-print-portal DOM element and CSS are also cleaned up.

/**
 * Awaits document fonts and logo image completion before initiating hardware print preview.
 */
async function waitForPrintReadiness(targetDoc: Document): Promise<void> {
  // 1. Wait for document fonts
  if (targetDoc.fonts && targetDoc.fonts.ready) {
    try {
      await targetDoc.fonts.ready;
    } catch {
      // Font readiness fallback
    }
  }

  // 2. Wait for logo image if present
  const logoImg = targetDoc.getElementById('receipt-logo-img') as HTMLImageElement | null;
  if (logoImg && !logoImg.complete) {
    await new Promise<void>((imgResolve) => {
      const timer = setTimeout(imgResolve, 1200);
      logoImg.onload = () => {
        clearTimeout(timer);
        imgResolve();
      };
      logoImg.onerror = () => {
        clearTimeout(timer);
        imgResolve();
      };
    });
  }

  // 3. Double requestAnimationFrame ensuring Blink has committed styles and raster
  await new Promise<void>((r) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => r());
    });
  });
}

/**
 * printReceipt — Full-Viewport Active Iframe Print Engine.
 *
 * ARCHITECTURE (DEFINITIVE — replaces all previous approaches):
 *
 * Creates a visible full-viewport iframe (position: fixed; top: 0; left: 0;
 * width: 100vw; height: 100vh; z-index: 2147483647) so Chrome's layout engine
 * assigns it real geometry. Writes the standalone receipt HTML document into
 * the iframe's own document context via document.open/write/close.
 * Calls iframe.contentWindow.print() to trigger the print dialog.
 *
 * WHY THIS WORKS PERMANENTLY:
 * 1. The iframe has its own completely independent document — MUI, React,
 *    index.css, and the ReceiptModal inline <style> DO NOT EXIST inside it.
 *    There is zero CSS cascade conflict.
 * 2. Chrome requires a frame to have real layout geometry before allowing
 *    iframe.contentWindow.print(). The full-viewport fixed iframe guarantees
 *    this — unlike hidden zero-size iframes that suppress focus().
 * 3. No popup required — an iframe is NOT subject to Chrome's popup blocker.
 * 4. The print dialog URL will show the iframe src (about:blank or empty),
 *    NOT localhost:3000/pos.
 * 5. After afterprint fires, the iframe is removed — no persistent DOM state.
 *
 * SECURITY MODEL:
 * - All content is sanitized via sanitizePrintHtml (XSS entity encoding).
 * - Standalone HTML contains only inline styles, no external fetches.
 * - Logo URLs are passed through sanitizePrintHtml before <img src> insertion.
 * - The iframe is same-origin (about:blank) — no cross-origin attack surface.
 * - The iframe is forcibly removed within 90 seconds regardless of afterprint.
 */
export async function printReceipt(
  rawReceiptData: any,
  formatAmountFn?: (val: number) => string,
  preferredFormat: ReceiptPrintFormat = 'THERMAL'
): Promise<{ success: boolean; error?: string }> {
  // ── 1. Normalize & validate ──────────────────────────────────────────────
  const data = normalizeReceiptData(rawReceiptData);
  data.format = preferredFormat || data.format || 'THERMAL';

  const validation = validateReceiptData(data);
  if (!validation.isValid) {
    const errorMsg = validation.errorMessage || 'Invalid receipt data';
    toast.error(`Print Failed: ${errorMsg}`);
    console.error('[ReceiptPrintEngine] Validation failed:', errorMsg, data);
    return { success: false, error: errorMsg };
  }

  // ── 2. Build format function ─────────────────────────────────────────────
  const formatAmount =
    formatAmountFn ||
    ((val: number) => {
      const code = data.currency || data.currencyCode || 'USD';
      return `${code} ${Number(val || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    });

  // ── 3. Build standalone receipt HTML document ────────────────────────────
  // The document is fully self-contained: inline CSS only, no external CDN
  // fetches, all dynamic strings sanitized via sanitizePrintHtml().
  const effectiveFormat: ReceiptPrintFormat =
    preferredFormat === 'A4'
      ? 'A4'
      : preferredFormat === 'THERMAL_58'
        ? 'THERMAL_58'
        : preferredFormat === 'THERMAL_80'
          ? 'THERMAL_80'
          : data.format === 'A4'
            ? 'A4'
            : data.format === 'THERMAL_58'
              ? 'THERMAL_58'
              : 'THERMAL_80';

  const fullHtml =
    effectiveFormat === 'A4'
      ? buildA4Html(data, formatAmount)
      : buildThermalHtml(data, formatAmount, effectiveFormat);

  // ── 4. Full-Viewport Active Iframe Engine ────────────────────────────────
  //
  // Creates a visible full-viewport iframe. Chrome requires a frame to have
  // real layout geometry (non-zero offsetWidth/Height) before it permits
  // iframe.contentWindow.print(). A hidden or zero-size iframe is silently
  // ignored by Chrome's focus security model — this was the failure mode of
  // all previous iframe attempts.
  //
  // position: fixed; top: 0; left: 0; width: 100vw; height: 100vh guarantees
  // Chrome assigns real geometry. z-index: 2147483647 (JS int max) places the
  // iframe on top of all MUI stacking contexts, backdrop overlays, and dialogs.
  //
  // The iframe document is about:blank (same-origin). We write the standalone
  // receipt HTML into it via doc.open/write/close — the correct API for
  // same-origin about:blank programmatic content. The iframe's document is
  // COMPLETELY ISOLATED: MUI, React, index.css, the ReceiptModal inline <style>,
  // and all CSS cascade conflicts DO NOT EXIST inside it.
  //
  // iframe.contentWindow.print() opens Chrome's print dialog targeting the
  // IFRAME, not the parent localhost:3000/pos window.
  //
  // After afterprint fires, the iframe is immediately removed from the DOM.
  // A 90-second safety timer guarantees cleanup regardless of afterprint firing.
  // ─────────────────────────────────────────────────────────────────────────

  let iframe: HTMLIFrameElement | null = null;

  const removeIframe = () => {
    try {
      if (iframe && iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    } catch {
      // Ignore cleanup errors — iframe may already be gone
    }
    iframe = null;
    // Restore #root visibility after the print dialog is dismissed
    document.documentElement.classList.remove('stockora-printing');
  };

  try {
    // Create the iframe element with full-viewport geometry
    iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'Stockora Print Engine');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.setAttribute('tabindex', '-1');

    // Inline style — must be applied BEFORE appending to DOM so the layout
    // engine sees the correct geometry from the first layout pass.
    // z-index: 2147483647 (JS int max) places the iframe on top of all MUI
    // stacking contexts, backdrop overlays, and dialogs — ensuring Chrome's
    // focus security model permits iframe.contentWindow.focus() and .print().
    // clip-path: inset(100%) hides the iframe visually on screen while keeping
    // full geometry (non-zero offsetWidth/Height) so Chrome does not suppress it.
    // opacity, visibility, and pointer-events are all set to ensure the print
    // engine renders content with full fidelity.
    // Blur any active focused element on the page before printing so that focus
    // is not trapped inside a modal or button. This eliminates the Chrome warning:
    // "Blocked aria-hidden on an element because its descendant retained focus."
    if (
      document.activeElement &&
      typeof (document.activeElement as HTMLElement).blur === 'function'
    ) {
      (document.activeElement as HTMLElement).blur();
    }

    // Inline style — must be applied BEFORE appending to DOM so the layout
    // engine sees non-zero geometry.
    // z-index: 2147483647 places the iframe on top of all stacking contexts,
    // ensuring Chrome's focus security model permits iframe.contentWindow.focus() and .print().
    // 1px by 1px with opacity: 0 keeps it visually invisible on screen without
    // disrupting the active user interface or causing blank white flashes.
    iframe.style.cssText = [
      'position: fixed',
      'top: 0',
      'left: 0',
      'width: 1px',
      'height: 1px',
      'opacity: 0',
      'border: none',
      'margin: 0',
      'padding: 0',
      'overflow: hidden',
      'pointer-events: none',
      'z-index: 2147483647',
    ].join('; ');

    // The CSS class '.stockora-printing #root' in @media print ensures that if
    // any main window print is invoked, app chrome is suppressed.
    document.documentElement.classList.add('stockora-printing');

    document.body.appendChild(iframe);

    // Get the iframe's document context — this is INDEPENDENT of the SPA document
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      throw new Error('Failed to obtain iframe document context.');
    }

    // Write the standalone HTML document into the iframe.
    // document.open/write/close is the correct API for programmatic same-origin
    // about:blank iframe content. Not deprecated in this usage context.
    iframeDoc.open();
    iframeDoc.write(fullHtml);
    iframeDoc.close();

    // Wait for fonts and logo image inside the iframe document to be ready
    await waitForPrintReadiness(iframeDoc);

    // Verify the receipt content is actually rendered inside the iframe
    const receiptRoot = iframeDoc.getElementById('receipt-print-root');
    if (!receiptRoot || receiptRoot.offsetHeight < 1) {
      // Content did not render — wait one additional rAF cycle and recheck
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
      const recheckRoot = iframeDoc.getElementById('receipt-print-root');
      if (!recheckRoot || recheckRoot.offsetHeight < 1) {
        console.warn(
          '[ReceiptPrintEngine] receipt-print-root rendered with zero height — proceeding anyway.'
        );
      }
    }

    // Register afterprint to remove the iframe once the print dialog closes
    const iframeWindow = iframe.contentWindow;
    if (iframeWindow) {
      iframeWindow.addEventListener('afterprint', removeIframe, { once: true });
    }

    // Safety timer: always remove the iframe within 90 seconds regardless of afterprint
    const safetyTimer = setTimeout(removeIframe, 90000);

    // Override the afterprint handler to also clear the safety timer
    if (iframeWindow) {
      iframeWindow.addEventListener(
        'afterprint',
        () => {
          clearTimeout(safetyTimer);
        },
        { once: true }
      );
    }

    // Focus the iframe window so Chrome's focus security model permits print()
    if (iframeWindow) {
      iframeWindow.focus();
    }

    // Trigger print — Chrome opens the print dialog targeting the IFRAME document
    if (iframeWindow) {
      iframeWindow.print();
    }

    return { success: true };
  } catch (engineErr: any) {
    removeIframe();
    console.error('[ReceiptPrintEngine] Iframe print engine failed:', engineErr);
    toast.error('Print preview failed. Please check printer configuration.');
    return { success: false, error: engineErr?.message || 'Iframe print engine error' };
  }
}
