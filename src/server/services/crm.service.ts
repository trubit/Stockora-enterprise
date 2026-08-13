import mongoose from 'mongoose';
import { Customer, ICustomer, ChurnRiskLevel } from '../models/Customer.js';
import { CustomerTimeline, CustomerEventType } from '../models/CustomerTimeline.js';
import { CustomerSegment } from '../models/CustomerSegment.js';
import { Transaction } from '../models/Transaction.js';
import { ResilientExecutor } from '../utils/resiliency/index.js';
import { logger } from '../logger.js';

export class CRMService {
  /**
   * Retrieves complete Customer 360 Profile with Timeline
   */
  public static async getCustomer360(customerId: string) {
    return await ResilientExecutor.execute({ name: `customer360:${customerId}` }, async () => {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        throw new Error(`Customer not found: ${customerId}`);
      }

      const timeline = await CustomerTimeline.find({
        customerId: new mongoose.Types.ObjectId(customerId),
      })
        .sort({ createdAt: -1 })
        .limit(50);

      return {
        customer,
        timeline,
      };
    });
  }

  /**
   * Records a Customer Timeline activity event
   */
  public static async recordTimelineEvent(
    customerId: string,
    eventType: CustomerEventType,
    title: string,
    description?: string,
    metadata?: Record<string, unknown>,
    authorId?: string,
    authorName?: string
  ) {
    return await CustomerTimeline.create({
      tenantId: 'default',
      companyId: 'default',
      customerId: new mongoose.Types.ObjectId(customerId),
      eventType,
      title,
      description,
      metadata,
      authorId: authorId ? new mongoose.Types.ObjectId(authorId) : undefined,
      authorName,
    });
  }

  /**
   * Recalculates customer analytics (CLV, AOV, Churn Risk) from transaction history
   */
  public static async recalculateCustomerMetrics(customerId: string): Promise<ICustomer> {
    return await ResilientExecutor.execute({ name: `crm-metrics:${customerId}` }, async () => {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        throw new Error(`Customer not found: ${customerId}`);
      }

      const txList = await Transaction.find({
        $or: [{ customerEmail: customer.email }, { customerId: customer._id }],
        status: 'COMPLETED',
      }).sort({ createdAt: 1 });

      const totalOrders = txList.length;
      let totalSpending = 0;
      let firstPurchaseDate: Date | undefined;
      let lastPurchaseDate: Date | undefined;

      if (totalOrders > 0) {
        firstPurchaseDate = txList[0].createdAt;
        lastPurchaseDate = txList[totalOrders - 1].createdAt;
        totalSpending = txList.reduce((acc, t) => acc + (t.total || 0), 0);
      }

      const avgOrderValue = totalOrders > 0 ? Number((totalSpending / totalOrders).toFixed(2)) : 0;

      // Days since last purchase
      const daysSinceLastPurchase = lastPurchaseDate
        ? Math.floor((Date.now() - new Date(lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24))
        : 365;

      // Churn Risk Score calculation
      let churnRiskScore = 10;
      if (daysSinceLastPurchase > 90) churnRiskScore += 40;
      else if (daysSinceLastPurchase > 45) churnRiskScore += 20;

      if (totalOrders === 1) churnRiskScore += 15;

      churnRiskScore = Math.min(99, Math.max(5, churnRiskScore));

      let churnRiskLevel: ChurnRiskLevel = 'LOW';
      if (churnRiskScore >= 75) churnRiskLevel = 'CRITICAL';
      else if (churnRiskScore >= 50) churnRiskLevel = 'HIGH';
      else if (churnRiskScore >= 30) churnRiskLevel = 'MEDIUM';

      // Customer Lifetime Value (CLV) = AOV * annual purchase frequency * estimated lifespan (3 years)
      const lifespanYears = 3;
      const purchaseFrequencyPerYear =
        totalOrders > 0 ? (totalOrders / (daysSinceLastPurchase || 1)) * 365 : 1;
      const clvScore = Math.round(
        avgOrderValue * Math.min(24, purchaseFrequencyPerYear) * lifespanYears
      );

      customer.totalOrders = totalOrders;
      customer.totalSpending = totalSpending;
      customer.avgOrderValue = avgOrderValue;
      customer.firstPurchaseDate = firstPurchaseDate;
      customer.lastPurchaseDate = lastPurchaseDate;
      customer.clvScore = clvScore;
      customer.churnRiskScore = churnRiskScore;
      customer.churnRiskLevel = churnRiskLevel;

      await customer.save();
      logger.info(
        `[CRM Service] Recalculated metrics for ${customer.name}: CLV=$${clvScore}, ChurnRisk=${churnRiskLevel}`
      );
      return customer;
    });
  }

  /**
   * Evaluates dynamic segments for all customers
   */
  public static async evaluateSegments() {
    const segments = await CustomerSegment.find({ isActive: true });
    const customers = await Customer.find({ isActive: true });

    for (const segment of segments) {
      let count = 0;
      for (const customer of customers) {
        let matches = true;
        for (const rule of segment.rules) {
          const custVal = (customer as any)[rule.field];
          if (rule.operator === 'GREATER_THAN' && Number(custVal || 0) <= Number(rule.value)) {
            matches = false;
          } else if (rule.operator === 'LESS_THAN' && Number(custVal || 0) >= Number(rule.value)) {
            matches = false;
          } else if (rule.operator === 'EQUALS' && String(custVal) !== String(rule.value)) {
            matches = false;
          }
        }
        if (matches) count++;
      }
      segment.memberCount = count;
      await segment.save();
    }

    logger.info(`[CRM Service] Dynamic customer segments evaluated (${segments.length} segments)`);
  }

  /**
   * Export customer data for privacy compliance (GDPR/CCPA)
   */
  public static async exportCustomerData(customerId: string) {
    const { customer, timeline } = await this.getCustomer360(customerId);
    return {
      exportTimestamp: new Date().toISOString(),
      customer,
      timeline,
    };
  }
}
