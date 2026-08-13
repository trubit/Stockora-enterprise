import type { Request, Response } from 'express';
import { Customer } from '../models/Customer.js';
import { CustomerSegment } from '../models/CustomerSegment.js';
import { MarketingCampaign } from '../models/MarketingCampaign.js';
import { Coupon } from '../models/Coupon.js';
import { CRMService } from '../services/crm.service.js';
import { LoyaltyService } from '../services/loyalty.service.js';
import { CampaignService } from '../services/campaign.service.js';
import { CRMCopilotService } from '../services/crm-copilot.service.js';
import { logger } from '../logger.js';

export class CRMController {
  /**
   * GET /api/v1/crm/dashboard
   */
  public static async getDashboardData(_req: Request, res: Response) {
    try {
      const totalCustomers = await Customer.countDocuments({ isActive: true });
      const vipCustomers = await Customer.countDocuments({ loyaltyTier: 'PLATINUM' });
      const atRiskCustomers = await Customer.countDocuments({
        churnRiskLevel: { $in: ['HIGH', 'CRITICAL'] },
      });
      const totalSegments = await CustomerSegment.countDocuments({ isActive: true });
      const activeCampaigns = await MarketingCampaign.countDocuments({ status: 'ACTIVE' });

      const topCustomers = await Customer.find({ isActive: true })
        .sort({ totalSpending: -1 })
        .limit(5);

      res.status(200).json({
        success: true,
        data: {
          kpis: {
            totalCustomers,
            vipCustomers,
            atRiskCustomers,
            totalSegments,
            activeCampaigns,
          },
          topCustomers,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`[CRM Controller] Dashboard error: ${msg}`);
      res.status(500).json({ success: false, message: msg });
    }
  }

  /**
   * GET /api/v1/crm/customers/:id/360
   */
  public static async getCustomer360(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const data = await CRMService.getCustomer360(id);
      res.status(200).json({ success: true, data });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(404).json({ success: false, message: msg });
    }
  }

  /**
   * POST /api/v1/crm/customers/:id/recalculate
   */
  public static async recalculateMetrics(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const customer = await CRMService.recalculateCustomerMetrics(id);
      res.status(200).json({ success: true, data: customer });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, message: msg });
    }
  }

  /**
   * GET /api/v1/crm/segments
   */
  public static async getSegments(_req: Request, res: Response) {
    try {
      await CRMService.evaluateSegments();
      const segments = await CustomerSegment.find().sort({ createdAt: -1 });
      res.status(200).json({ success: true, data: segments });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, message: msg });
    }
  }

  /**
   * POST /api/v1/crm/segments
   */
  public static async createSegment(req: Request, res: Response) {
    try {
      const { name, code, description, rules, isDynamic } = req.body;
      const segment = await CustomerSegment.create({
        name,
        code: code || `SEG-${Date.now().toString().slice(-4)}`,
        description,
        rules: rules || [],
        isDynamic: isDynamic !== undefined ? isDynamic : true,
      });
      await CRMService.evaluateSegments();
      res.status(201).json({ success: true, data: segment });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(400).json({ success: false, message: msg });
    }
  }

  /**
   * GET /api/v1/crm/campaigns
   */
  public static async getCampaigns(_req: Request, res: Response) {
    try {
      const campaigns = await MarketingCampaign.find().sort({ createdAt: -1 });
      res.status(200).json({ success: true, data: campaigns });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, message: msg });
    }
  }

  /**
   * POST /api/v1/crm/campaigns
   */
  public static async createCampaign(req: Request, res: Response) {
    try {
      const { title, type, channel, messageTemplate, targetSegmentId, couponCode } = req.body;
      const userId = (req as any).user?.id || '000000000000000000000000';

      const campaign = await MarketingCampaign.create({
        title,
        type: type || 'PROMOTIONAL',
        channel: channel || 'EMAIL',
        messageTemplate,
        targetSegmentId,
        couponCode,
        createdBy: userId,
      });

      res.status(201).json({ success: true, data: campaign });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(400).json({ success: false, message: msg });
    }
  }

  /**
   * POST /api/v1/crm/campaigns/:id/dispatch
   */
  public static async dispatchCampaign(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const campaign = await CampaignService.dispatchCampaign(id);
      res.status(200).json({ success: true, data: campaign });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, message: msg });
    }
  }

  /**
   * GET /api/v1/crm/coupons
   */
  public static async getCoupons(_req: Request, res: Response) {
    try {
      const coupons = await Coupon.find().sort({ createdAt: -1 });
      res.status(200).json({ success: true, data: coupons });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, message: msg });
    }
  }

  /**
   * POST /api/v1/crm/coupons
   */
  public static async createCoupon(req: Request, res: Response) {
    try {
      const { code, description, discountType, discountValue, minPurchaseAmount, validUntil } =
        req.body;
      const coupon = await Coupon.create({
        code,
        description,
        discountType: discountType || 'PERCENTAGE',
        discountValue,
        minPurchaseAmount: minPurchaseAmount || 0,
        validUntil: validUntil || new Date(Date.now() + 30 * 86400000),
      });

      res.status(201).json({ success: true, data: coupon });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(400).json({ success: false, message: msg });
    }
  }

  /**
   * POST /api/v1/crm/coupons/validate
   */
  public static async validateCoupon(req: Request, res: Response) {
    try {
      const { code, purchaseTotal } = req.body;
      if (!code) {
        return res.status(400).json({ success: false, message: 'Coupon code is required.' });
      }

      const result = await CampaignService.validateCoupon(code, Number(purchaseTotal || 0));
      res.status(200).json({ success: true, data: result });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, message: msg });
    }
  }

  /**
   * POST /api/v1/crm/loyalty/earn
   */
  public static async earnLoyaltyPoints(req: Request, res: Response) {
    try {
      const { customerId, transactionTotal, referenceId } = req.body;
      const customer = await LoyaltyService.earnPoints(
        customerId,
        Number(transactionTotal),
        referenceId
      );
      res.status(200).json({ success: true, data: customer });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(400).json({ success: false, message: msg });
    }
  }

  /**
   * POST /api/v1/crm/loyalty/redeem
   */
  public static async redeemLoyaltyPoints(req: Request, res: Response) {
    try {
      const { customerId, pointsToRedeem, rewardReason } = req.body;
      const customer = await LoyaltyService.redeemPoints(
        customerId,
        Number(pointsToRedeem),
        rewardReason
      );
      res.status(200).json({ success: true, data: customer });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(400).json({ success: false, message: msg });
    }
  }

  /**
   * POST /api/v1/crm/copilot/query
   */
  public static async copilotQuery(req: Request, res: Response) {
    try {
      const { sessionId, prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ success: false, message: 'prompt is required.' });
      }

      const activeSession = sessionId || 'default-crm-session';
      const answer = await CRMCopilotService.queryCRMCopilot(activeSession, prompt);
      res.status(200).json({ success: true, data: { answer, sessionId: activeSession } });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, message: msg });
    }
  }
}
