import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { warehouseService } from '../services/warehouse.service.ts';
import { inventoryLocationService } from '../services/inventory-location.service.ts';
import { putAwayService } from '../services/putaway.service.ts';
import { allocationService } from '../services/allocation.service.ts';
import { pickingService } from '../services/picking.service.ts';
import { packingService } from '../services/packing.service.ts';
import { dispatchService } from '../services/dispatch.service.ts';
import { warehouseTransferService } from '../services/warehouse-transfer.service.ts';
import { cycleCountService } from '../services/cycle-count.service.ts';
import { warehouseAnalyticsService } from '../services/warehouse-analytics.service.ts';
import { warehouseAIService } from '../services/warehouse-ai.service.ts';
import { ValidationError } from '../errors/AppError.js';

export class WarehouseController {
  // Warehouses
  async createWarehouse(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = (req.user as any)?.companyId || 'default-company';
      const branchId = req.body.branchId || (req.user as any)?.branchId || 'default-branch';
      const warehouse = await warehouseService.createWarehouse({
        ...req.body,
        companyId,
        branchId,
      });
      res.status(201).json(warehouse);
    } catch (err) {
      next(err);
    }
  }

  async getWarehouses(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = (req.user as any)?.companyId || 'default-company';
      const branchId = req.query.branchId as string;
      const warehouses = await warehouseService.getWarehouses(companyId, branchId);
      res.json(warehouses);
    } catch (err) {
      next(err);
    }
  }

  async getWarehouseById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const warehouse = await warehouseService.getWarehouseById(req.params.id);
      res.json(warehouse);
    } catch (err) {
      next(err);
    }
  }

  // Zones & Locations
  async createZone(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = (req.user as any)?.companyId || 'default-company';
      const userId = req.user?.id || 'system';
      const zone = await warehouseService.createZone({
        ...req.body,
        warehouseId: req.params.id,
        companyId,
        createdBy: userId,
      });
      res.status(201).json(zone);
    } catch (err) {
      next(err);
    }
  }

  async getZones(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const zones = await warehouseService.getZones(req.params.id);
      res.json(zones);
    } catch (err) {
      next(err);
    }
  }

  async createLocation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = (req.user as any)?.companyId || 'default-company';
      const userId = req.user?.id || 'system';
      const location = await warehouseService.createLocation({
        ...req.body,
        warehouseId: req.params.id,
        companyId,
        createdBy: userId,
      });
      res.status(201).json(location);
    } catch (err) {
      next(err);
    }
  }

  async getLocations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const locations = await warehouseService.getLocations(req.params.id, req.query as any);
      res.json(locations);
    } catch (err) {
      next(err);
    }
  }

  // Put-away
  async createPutAwayFromReceipt(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = (req.user as any)?.companyId || 'default-company';
      const userId = req.user?.id || 'system';
      const tasks = await putAwayService.createPutAwayTasksFromReceipt({
        companyId,
        warehouseId: req.params.id,
        goodsReceiptId: req.body.goodsReceiptId,
        strategy: req.body.strategy,
        createdBy: userId,
      });
      res.status(201).json(tasks);
    } catch (err) {
      next(err);
    }
  }

  async confirmPutAway(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'system';
      const task = await putAwayService.confirmPutAway({
        putAwayTaskId: req.body.putAwayTaskId,
        confirmedLocationId: req.body.confirmedLocationId,
        confirmedQuantity: req.body.confirmedQuantity,
        userId,
      });
      res.json(task);
    } catch (err) {
      next(err);
    }
  }

  async getPendingPutAway(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tasks = await putAwayService.getPendingTasks(req.params.id);
      res.json(tasks);
    } catch (err) {
      next(err);
    }
  }

  // Allocation
  async allocateOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = (req.user as any)?.companyId || 'default-company';
      const userId = req.user?.id || 'system';
      const allocation = await allocationService.allocateOrder({
        ...req.body,
        companyId,
        createdBy: userId,
      });
      res.status(201).json(allocation);
    } catch (err) {
      next(err);
    }
  }

  async releaseAllocation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const allocation = await allocationService.releaseAllocation(req.params.id);
      res.json(allocation);
    } catch (err) {
      next(err);
    }
  }

  // Picking
  async createPickList(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = (req.user as any)?.companyId || 'default-company';
      const userId = req.user?.id || 'system';
      const pickList = await pickingService.createPickList({
        ...req.body,
        companyId,
        createdBy: userId,
      });
      res.status(201).json(pickList);
    } catch (err) {
      next(err);
    }
  }

  async scanAndPickItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const pickerId = req.user?.id || 'picker-1';
      const result = await pickingService.scanAndPickItem({
        ...req.body,
        pickerId,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async handleShortPick(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const pickerId = req.user?.id || 'picker-1';
      const result = await pickingService.handleShortPick({
        ...req.body,
        pickerId,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async createWave(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = (req.user as any)?.companyId || 'default-company';
      const userId = req.user?.id || 'system';
      const wave = await pickingService.createPickingWave({
        ...req.body,
        companyId,
        createdBy: userId,
      });
      res.status(201).json(wave);
    } catch (err) {
      next(err);
    }
  }

  // Packing
  async packOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = (req.user as any)?.companyId || 'default-company';
      const packerId = req.user?.id || 'packer-1';
      const pkg = await packingService.packOrder({
        ...req.body,
        companyId,
        packerId,
      });
      res.status(201).json(pkg);
    } catch (err) {
      next(err);
    }
  }

  // Dispatch
  async createDispatchManifest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = (req.user as any)?.companyId || 'default-company';
      const userId = req.user?.id || 'system';
      const dispatch = await dispatchService.createDispatchManifest({
        ...req.body,
        companyId,
        userId,
      });
      res.status(201).json(dispatch);
    } catch (err) {
      next(err);
    }
  }

  async executeDispatch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'system';
      const dispatch = await dispatchService.executeDispatch(req.params.id, userId);
      res.json(dispatch);
    } catch (err) {
      next(err);
    }
  }

  // Transfers
  async requestTransfer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'system';
      const transfer = await warehouseTransferService.requestTransfer({
        ...req.body,
        createdBy: userId,
      });
      res.status(201).json(transfer);
    } catch (err) {
      next(err);
    }
  }

  async approveTransfer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'system';
      const transfer = await warehouseTransferService.approveTransfer(req.params.id, userId);
      res.json(transfer);
    } catch (err) {
      next(err);
    }
  }

  async shipTransfer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'system';
      const transfer = await warehouseTransferService.shipTransfer(
        req.params.id,
        userId,
        req.body.trackingNumber
      );
      res.json(transfer);
    } catch (err) {
      next(err);
    }
  }

  async receiveTransfer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'system';
      const transfer = await warehouseTransferService.receiveTransfer(
        req.params.id,
        userId,
        req.body.receivedItems
      );
      res.json(transfer);
    } catch (err) {
      next(err);
    }
  }

  // Cycle Counting
  async createCycleCount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = (req.user as any)?.companyId || 'default-company';
      const userId = req.user?.id || 'system';
      const count = await cycleCountService.createCycleCount({
        ...req.body,
        companyId,
        createdBy: userId,
      });
      res.status(201).json(count);
    } catch (err) {
      next(err);
    }
  }

  async submitCycleCount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'system';
      const count = await cycleCountService.submitCountResults(
        req.params.id,
        userId,
        req.body.items
      );
      res.json(count);
    } catch (err) {
      next(err);
    }
  }

  async approveCycleCount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'system';
      const count = await cycleCountService.applyCountAdjustments(req.params.id, userId);
      res.json(count);
    } catch (err) {
      next(err);
    }
  }

  // Analytics & AI
  async getAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const analytics = await warehouseAnalyticsService.getWarehouseAnalytics(req.params.id);
      res.json(analytics);
    } catch (err) {
      next(err);
    }
  }

  async getAIInsights(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const insights = await warehouseAIService.getWarehouseAIInsights(req.params.id);
      res.json(insights);
    } catch (err) {
      next(err);
    }
  }
}

export const warehouseController = new WarehouseController();
