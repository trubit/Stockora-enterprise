import { RegionalSettings } from '../models/RegionalSettings.js';
import { Tenant } from '../models/Tenant.js';
import { Customer } from '../models/Customer.js';
import { MoneyMath } from '../../shared/formatters.js';
import type { ITaxRateItem, ITaxConfiguration } from '../models/RegionalSettings.js';

export interface TaxCalculationLineItem {
  productId?: string;
  sku?: string;
  name?: string;
  unitPrice: number;
  quantity: number;
  discountAmount?: number;
  taxCategory?: 'STANDARD' | 'REDUCED' | 'ZERO_RATED' | 'EXEMPT';
  taxRateOverride?: number;
}

export interface CalculatedLineItemTax {
  productId?: string;
  sku?: string;
  name?: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxableSubtotal: number;
  taxRatePercentage: number;
  taxAmount: number;
  lineTotal: number;
  isInclusive: boolean;
  category: string;
}

export interface TaxCalculationResult {
  subtotal: number;
  discountTotal: number;
  taxableAmount: number;
  taxTotal: number;
  grandTotal: number;
  taxType: string;
  isTaxInclusive: boolean;
  isExempt: boolean;
  exemptionReason?: string;
  lineItems: CalculatedLineItemTax[];
}

export class TaxService {
  /**
   * Authoritative server-side tax calculation for line items.
   */
  public static async calculateTax(params: {
    tenantId?: string;
    items: TaxCalculationLineItem[];
    customerId?: string;
    overrideTaxInclusive?: boolean;
  }): Promise<TaxCalculationResult> {
    const { tenantId, items, customerId, overrideTaxInclusive } = params;

    // 1. Fetch Tenant Regional Tax Settings
    let taxConfig: ITaxConfiguration = {
      taxType: 'VAT',
      defaultTaxRate: 7.5,
      isTaxInclusive: false,
      taxExemptionAllowed: true,
      taxRates: [],
    };

    if (tenantId) {
      const reg = await RegionalSettings.findOne({ tenantId }).lean();
      if (reg && reg.taxConfig) {
        taxConfig = reg.taxConfig;
      } else {
        const tenant = await Tenant.findById(tenantId).lean();
        if (tenant?.taxConfig) {
          taxConfig = {
            taxType: (tenant.taxConfig.taxRegistrationName as any) || 'VAT',
            defaultTaxRate: tenant.taxConfig.defaultTaxRate ?? 7.5,
            isTaxInclusive: tenant.taxConfig.isTaxInclusive ?? false,
            taxExemptionAllowed: tenant.taxConfig.taxExemptionAllowed ?? true,
            taxRates: [],
          };
        }
      }
    }

    const isInclusive =
      overrideTaxInclusive !== undefined ? overrideTaxInclusive : taxConfig.isTaxInclusive;

    // 2. Check Customer Tax Exemption
    let isCustomerExempt = false;
    let exemptionReason: string | undefined = undefined;

    if (customerId && taxConfig.taxExemptionAllowed) {
      const customer = await Customer.findById(customerId).lean();
      if (customer && (customer as any).isTaxExempt) {
        isCustomerExempt = true;
        exemptionReason = (customer as any).taxExemptionNumber
          ? `Exemption Cert #${(customer as any).taxExemptionNumber}`
          : 'Verified Tax Exempt Organization';
      }
    }

    // 3. Process Line Items
    let subtotalSum = 0;
    let discountSum = 0;
    let taxableSum = 0;
    let taxSum = 0;
    let grandTotalSum = 0;

    const calculatedLines: CalculatedLineItemTax[] = [];

    for (const item of items) {
      const qty = item.quantity > 0 ? item.quantity : 1;
      const rawLineTotal = MoneyMath.multiply(item.unitPrice, qty);
      const discount = item.discountAmount ? Math.min(item.discountAmount, rawLineTotal) : 0;
      const netLine = MoneyMath.subtract(rawLineTotal, discount);

      subtotalSum = MoneyMath.add(subtotalSum, rawLineTotal);
      discountSum = MoneyMath.add(discountSum, discount);

      // Determine applicable tax rate
      let ratePercentage = 0;
      let category = item.taxCategory || 'STANDARD';

      if (isCustomerExempt || category === 'EXEMPT') {
        ratePercentage = 0;
        category = 'EXEMPT';
      } else if (category === 'ZERO_RATED') {
        ratePercentage = 0;
      } else if (item.taxRateOverride !== undefined) {
        ratePercentage = item.taxRateOverride;
      } else {
        // Lookup in tenant tax rates or default
        const matchedRate = taxConfig.taxRates?.find(
          (r: ITaxRateItem) => r.isActive && r.category === category
        );
        ratePercentage = matchedRate ? matchedRate.ratePercentage : taxConfig.defaultTaxRate;
      }

      let lineTax = 0;
      let taxableLineAmount = 0;
      let finalLineTotal = 0;

      if (ratePercentage === 0 || isCustomerExempt) {
        lineTax = 0;
        taxableLineAmount = netLine;
        finalLineTotal = netLine;
      } else if (isInclusive) {
        // Tax Inclusive: Base = Net / (1 + Rate / 100), Tax = Net - Base
        const baseAmount = MoneyMath.round(netLine / (1 + ratePercentage / 100), 2);
        lineTax = MoneyMath.subtract(netLine, baseAmount);
        taxableLineAmount = baseAmount;
        finalLineTotal = netLine; // Total remains netLine
      } else {
        // Tax Exclusive: Tax = Net * (Rate / 100), Total = Net + Tax
        lineTax = MoneyMath.round(netLine * (ratePercentage / 100), 2);
        taxableLineAmount = netLine;
        finalLineTotal = MoneyMath.add(netLine, lineTax);
      }

      taxableSum = MoneyMath.add(taxableSum, taxableLineAmount);
      taxSum = MoneyMath.add(taxSum, lineTax);
      grandTotalSum = MoneyMath.add(grandTotalSum, finalLineTotal);

      calculatedLines.push({
        productId: item.productId,
        sku: item.sku,
        name: item.name,
        quantity: qty,
        unitPrice: item.unitPrice,
        discountAmount: discount,
        taxableSubtotal: taxableLineAmount,
        taxRatePercentage: ratePercentage,
        taxAmount: lineTax,
        lineTotal: finalLineTotal,
        isInclusive,
        category,
      });
    }

    return {
      subtotal: subtotalSum,
      discountTotal: discountSum,
      taxableAmount: taxableSum,
      taxTotal: taxSum,
      grandTotal: grandTotalSum,
      taxType: taxConfig.taxType || 'VAT',
      isTaxInclusive: isInclusive,
      isExempt: isCustomerExempt,
      exemptionReason,
      lineItems: calculatedLines,
    };
  }
}
