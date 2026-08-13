import type { Request, Response } from 'express';
import { POSService } from '../services/pos.service.js';
import { RegisterSessionService } from '../services/register-session.service.js';

export class POSController {
  /**
   * POST /api/v1/pos/checkout
   */
  public static async checkout(req: Request, res: Response) {
    try {
      const order = await POSService.checkout(req.body);
      res.status(201).json({ success: true, data: order });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(400).json({ success: false, message: msg });
    }
  }

  /**
   * POST /api/v1/pos/hold
   */
  public static async holdSale(req: Request, res: Response) {
    try {
      const { cashierId, cashierName, branchId, cartItems, customer, notes } = req.body;
      const held = await POSService.holdSale(
        cashierId,
        cashierName,
        branchId,
        cartItems,
        customer,
        notes
      );
      res.status(201).json({ success: true, data: held });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(400).json({ success: false, message: msg });
    }
  }

  /**
   * POST /api/v1/pos/resume/:holdId
   */
  public static async resumeSale(req: Request, res: Response) {
    try {
      const holdId = String(req.params.holdId);
      const held = await POSService.resumeSale(holdId);
      res.status(200).json({ success: true, data: held });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(404).json({ success: false, message: msg });
    }
  }

  /**
   * GET /api/v1/pos/held/:branchId
   */
  public static async getHeldSales(req: Request, res: Response) {
    try {
      const branchId = String(req.params.branchId);
      const sales = await POSService.getHeldSales(branchId);
      res.status(200).json({ success: true, data: sales });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, message: msg });
    }
  }

  /**
   * GET /api/v1/pos/receipt/:orderNumber
   */
  public static async getReceipt(req: Request, res: Response) {
    try {
      const orderNumber = String(req.params.orderNumber);
      const width = (req.query.width as '58mm' | '80mm') || '80mm';
      const receipt = await POSService.generateReceipt(orderNumber, width);
      res.status(200).json({ success: true, data: receipt });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(404).json({ success: false, message: msg });
    }
  }

  /**
   * POST /api/v1/pos/sync-offline
   */
  public static async syncOffline(req: Request, res: Response) {
    try {
      const { transactions } = req.body;
      const result = await POSService.syncOfflineQueue(transactions || []);
      res.status(200).json({ success: true, data: result });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, message: msg });
    }
  }

  /**
   * POST /api/v1/pos/register/open
   */
  public static async openRegister(req: Request, res: Response) {
    try {
      const { registerId, registerName, branchId, cashierId, cashierName, openingFloat } = req.body;
      const session = await RegisterSessionService.openRegister(
        registerId,
        registerName,
        branchId,
        cashierId,
        cashierName,
        Number(openingFloat)
      );
      res.status(201).json({ success: true, data: session });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(400).json({ success: false, message: msg });
    }
  }

  /**
   * POST /api/v1/pos/register/cash-movement
   */
  public static async cashMovement(req: Request, res: Response) {
    try {
      const { registerId, type, amount, reason, performedBy } = req.body;
      const session = await RegisterSessionService.recordCashMovement(
        registerId,
        type,
        Number(amount),
        reason,
        performedBy
      );
      res.status(200).json({ success: true, data: session });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(400).json({ success: false, message: msg });
    }
  }

  /**
   * POST /api/v1/pos/register/close
   */
  public static async closeRegister(req: Request, res: Response) {
    try {
      const { registerId, closingCash, managerNotes } = req.body;
      const session = await RegisterSessionService.closeRegister(
        registerId,
        Number(closingCash),
        managerNotes
      );
      res.status(200).json({ success: true, data: session });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(400).json({ success: false, message: msg });
    }
  }

  /**
   * GET /api/v1/pos/register/active/:registerId
   */
  public static async getActiveRegister(req: Request, res: Response) {
    try {
      const registerId = String(req.params.registerId);
      const session = await RegisterSessionService.getActiveSession(registerId);
      res.status(200).json({ success: true, data: session });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, message: msg });
    }
  }
}
