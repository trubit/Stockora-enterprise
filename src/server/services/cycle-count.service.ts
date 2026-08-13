import {
  CycleCount,
  type ICycleCount,
  type CountType,
  type ICycleCountItem,
} from '../models/CycleCount.js';
import { InventoryLocation } from '../models/InventoryLocation.js';
import { WarehouseLocation } from '../models/WarehouseLocation.js';
import { Product } from '../models/Product.js';
import { inventoryLocationService } from './inventory-location.service.js';
import { NotFoundError, ValidationError } from '../errors/AppError.js';
import { eventBus } from '../events/eventBus.js';

export interface CreateCycleCountParams {
  companyId: string;
  warehouseId: string;
  countType: CountType;
  zoneId?: string;
  locationIds?: string[];
  productIds?: string[];
  isBlindCount?: boolean;
  assignedCounterId?: string;
  assignedCounterName?: string;
  createdBy: string;
}

export interface RecordCountItemInput {
  itemId: string;
  countedQuantity: number;
  notes?: string;
}

export class CycleCountService {
  /**
   * Create a new Cycle Count task
   */
  async createCycleCount(params: CreateCycleCountParams): Promise<ICycleCount> {
    const {
      companyId,
      warehouseId,
      countType,
      zoneId,
      locationIds,
      productIds,
      isBlindCount = true,
      assignedCounterId,
      assignedCounterName,
      createdBy,
    } = params;

    const query: any = { warehouseId, availableQuantity: { $gte: 0 } };
    if (productIds && productIds.length > 0) query.productId = { $in: productIds };
    if (locationIds && locationIds.length > 0) query.locationId = { $in: locationIds };

    const stockRecords = await InventoryLocation.find(query)
      .populate('productId', 'name sku costPrice')
      .populate('locationId', 'locationCode')
      .limit(200);

    const items: ICycleCountItem[] = [];

    for (const rec of stockRecords) {
      const prod = rec.productId as any;
      const loc = rec.locationId as any;
      if (!prod || !loc) continue;

      items.push({
        productId: prod._id,
        sku: prod.sku || 'SKU',
        name: prod.name || 'Product',
        locationId: loc._id,
        locationCode: loc.locationCode,
        lotNumber: rec.lotNumber,
        serialNumber: rec.serialNumber,
        expectedQuantity: rec.quantity,
        unitCost: prod.costPrice || 0,
        status: 'PENDING',
      } as any);
    }

    const countNumber = `CNT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    const count = await CycleCount.create({
      countNumber,
      companyId,
      warehouseId,
      countType,
      zoneId,
      isBlindCount,
      status: 'ASSIGNED',
      assignedCounterId,
      assignedCounterName,
      items,
      totalExpectedItems: items.length,
      totalCountedItems: 0,
      totalVarianceCount: 0,
      totalVarianceValue: 0,
      createdBy,
    });

    eventBus.emit('warehouse.count.created', { countId: count._id.toString(), countNumber });

    return count;
  }

  /**
   * Submit physical count results for items
   */
  async submitCountResults(
    countId: string,
    counterId: string,
    countedItems: RecordCountItemInput[]
  ): Promise<ICycleCount> {
    const count = await CycleCount.findById(countId);
    if (!count) throw new NotFoundError('Cycle count not found.');

    let totalVarianceCount = 0;
    let totalVarianceValue = 0;
    let countedCount = 0;

    for (const input of countedItems) {
      const itemIndex = count.items.findIndex((i: any) => i._id.toString() === input.itemId);
      if (itemIndex === -1) continue;

      const item = count.items[itemIndex];
      item.countedQuantity = input.countedQuantity;
      item.variance = input.countedQuantity - item.expectedQuantity;
      item.varianceValue = item.variance * (item.unitCost || 0);
      item.status = 'COUNTED';
      item.countedAt = new Date();
      item.counterId = counterId as any;
      if (input.notes) item.notes = input.notes;

      totalVarianceCount += Math.abs(item.variance);
      totalVarianceValue += Math.abs(item.varianceValue);
      countedCount++;
    }

    count.totalCountedItems += countedCount;
    count.totalVarianceCount += totalVarianceCount;
    count.totalVarianceValue += totalVarianceValue;

    // Determine if approval required (e.g. if variance > $500 or > 10 items)
    const requiresApproval = totalVarianceValue > 500 || totalVarianceCount > 10;
    count.approvalRequired = requiresApproval;
    count.status = requiresApproval ? 'REVIEW_REQUIRED' : 'APPROVED';

    await count.save();

    // If auto-approved (low variance), apply adjustments automatically
    if (!requiresApproval) {
      await this.applyCountAdjustments(count._id.toString(), counterId);
    }

    return count;
  }

  /**
   * Approve & Apply Cycle Count Adjustments to Inventory
   */
  async applyCountAdjustments(countId: string, userId: string): Promise<ICycleCount> {
    const count = await CycleCount.findById(countId);
    if (!count) throw new NotFoundError('Cycle count not found.');

    for (const item of count.items) {
      if (item.status === 'ADJUSTED' || item.variance === undefined || item.variance === 0) {
        continue;
      }

      const variance = item.variance;
      if (variance > 0) {
        // Positive variance: add stock
        await inventoryLocationService.moveStock({
          companyId: count.companyId.toString(),
          warehouseId: count.warehouseId.toString(),
          productId: item.productId.toString(),
          quantity: variance,
          toLocationId: item.locationId.toString(),
          lotNumber: item.lotNumber,
          movementType: 'CYCLE_COUNT',
          referenceId: count.countNumber,
          referenceType: 'CycleCount',
          userId,
          notes: `Cycle count ${count.countNumber} positive variance adjustment (+${variance}).`,
        });
      } else if (variance < 0) {
        // Negative variance: deduct stock
        await inventoryLocationService.moveStock({
          companyId: count.companyId.toString(),
          warehouseId: count.warehouseId.toString(),
          productId: item.productId.toString(),
          quantity: Math.abs(variance),
          fromLocationId: item.locationId.toString(),
          lotNumber: item.lotNumber,
          movementType: 'CYCLE_COUNT',
          referenceId: count.countNumber,
          referenceType: 'CycleCount',
          userId,
          notes: `Cycle count ${count.countNumber} negative variance adjustment (${variance}).`,
        });
      }

      item.status = 'ADJUSTED';
    }

    count.status = 'COMPLETED';
    count.approvedBy = userId as any;
    count.approvedAt = new Date();
    count.completedAt = new Date();
    await count.save();

    eventBus.emit('warehouse.count.completed', {
      countId: count._id.toString(),
      countNumber: count.countNumber,
      totalVarianceValue: count.totalVarianceValue,
    });

    return count;
  }
}

export const cycleCountService = new CycleCountService();
