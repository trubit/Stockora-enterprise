import { PutAwayTask, type IPutAwayTask, type PutAwayStrategy } from '../models/PutAwayTask.js';
import { WarehouseLocation } from '../models/WarehouseLocation.js';
import { GoodsReceipt } from '../models/GoodsReceipt.js';
import { Product } from '../models/Product.js';
import { inventoryLocationService } from './inventory-location.service.js';
import { NotFoundError, ValidationError } from '../errors/AppError.js';
import { eventBus } from '../events/eventBus.js';

export interface CreatePutAwayFromReceiptParams {
  companyId: string;
  warehouseId: string;
  goodsReceiptId: string;
  strategy?: PutAwayStrategy;
  createdBy: string;
}

export interface ConfirmPutAwayParams {
  putAwayTaskId: string;
  confirmedLocationId: string;
  confirmedQuantity: number;
  userId: string;
}

export class PutAwayService {
  /**
   * Automatically generate Put-Away tasks from an inspected Goods Receipt
   */
  async createPutAwayTasksFromReceipt(
    params: CreatePutAwayFromReceiptParams
  ): Promise<IPutAwayTask[]> {
    const receipt = await GoodsReceipt.findById(params.goodsReceiptId);
    if (!receipt) throw new NotFoundError('Goods Receipt not found.');

    // Find receiving location
    const receivingLocation = await WarehouseLocation.findOne({
      warehouseId: params.warehouseId,
      locationType: 'RECEIVING',
      isActive: true,
    });

    if (!receivingLocation) {
      throw new ValidationError('No active RECEIVING location found in this warehouse.');
    }

    const tasks: IPutAwayTask[] = [];

    for (const item of receipt.items) {
      if (item.quantityReceived <= 0) continue;

      const strategy = params.strategy || 'NEAREST_AVAILABLE';
      const recommendation = await this.recommendLocation({
        warehouseId: params.warehouseId,
        productId: item.productId.toString(),
        quantity: item.quantityReceived,
        strategy,
      });

      const taskNumber = `PUT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

      const task = await PutAwayTask.create({
        taskNumber,
        companyId: params.companyId,
        warehouseId: params.warehouseId,
        goodsReceiptId: receipt._id,
        productId: item.productId,
        quantity: item.quantityReceived,
        sourceLocationId: receivingLocation._id,
        suggestedLocationId: recommendation.locationId || undefined,
        strategy,
        suggestionReason: recommendation.reason,
        status: 'PENDING',
        createdBy: params.createdBy,
      });

      tasks.push(task);

      eventBus.emit('warehouse.putaway.created', {
        taskId: task._id.toString(),
        productId: item.productId.toString(),
        suggestedLocationId: recommendation.locationId,
      });
    }

    return tasks;
  }

  /**
   * Recommend optimal put-away location based on configurable strategy
   */
  async recommendLocation(params: {
    warehouseId: string;
    productId: string;
    quantity: number;
    strategy: PutAwayStrategy;
  }): Promise<{ locationId: string | null; reason: string }> {
    const { warehouseId, productId, quantity, strategy } = params;

    const product = await Product.findById(productId);
    const storageLocations = await WarehouseLocation.find({
      warehouseId,
      locationType: 'STORAGE',
      isActive: true,
    }).sort({ locationCode: 1 });

    if (storageLocations.length === 0) {
      return { locationId: null, reason: 'No active STORAGE locations available.' };
    }

    if (strategy === 'CAPACITY_BASED') {
      // Find location with most available capacity
      const best = storageLocations.find((loc) => {
        if (!loc.capacityUnits) return true;
        return loc.capacityUnits - loc.currentUnits >= quantity;
      });

      if (best) {
        return {
          locationId: best._id.toString(),
          reason: `Capacity strategy selected ${best.locationCode} (${(best.capacityUnits || 0) - best.currentUnits} units free space).`,
        };
      }
    }

    if (strategy === 'PRODUCT_CATEGORY' && product?.category) {
      // Find location designated or matching category
      const matched = storageLocations.find((loc) =>
        loc.notes?.toLowerCase().includes(product.category.toLowerCase())
      );
      if (matched) {
        return {
          locationId: matched._id.toString(),
          reason: `Category strategy matched product category "${product.category}" with zone location ${matched.locationCode}.`,
        };
      }
    }

    // Default: NEAREST_AVAILABLE (first active storage location with room)
    const availableLoc =
      storageLocations.find((loc) => {
        if (!loc.capacityUnits) return true;
        return loc.capacityUnits - loc.currentUnits >= quantity;
      }) || storageLocations[0];

    return {
      locationId: availableLoc._id.toString(),
      reason: `Nearest Available strategy selected location ${availableLoc.locationCode}.`,
    };
  }

  /**
   * Confirm Put-Away completion by worker
   */
  async confirmPutAway(params: ConfirmPutAwayParams): Promise<IPutAwayTask> {
    const task = await PutAwayTask.findById(params.putAwayTaskId);
    if (!task) throw new NotFoundError('Put-away task not found.');

    if (task.status === 'COMPLETED') {
      throw new ValidationError('Put-away task is already completed.');
    }

    // Move stock from RECEIVING to confirmed storage location
    await inventoryLocationService.moveStock({
      companyId: task.companyId.toString(),
      warehouseId: task.warehouseId.toString(),
      productId: task.productId.toString(),
      quantity: params.confirmedQuantity,
      fromLocationId: task.sourceLocationId.toString(),
      toLocationId: params.confirmedLocationId,
      lotNumber: task.lotNumber,
      expiryDate: task.expiryDate,
      movementType: 'PUT_AWAY',
      referenceId: task.taskNumber,
      referenceType: 'PutAwayTask',
      userId: params.userId,
      notes: `Put-away task ${task.taskNumber} completed.`,
    });

    task.confirmedLocationId = params.confirmedLocationId as any;
    task.confirmedQuantity = params.confirmedQuantity;
    task.status = 'COMPLETED';
    task.completedAt = new Date();
    await task.save();

    eventBus.emit('warehouse.putaway.completed', {
      taskId: task._id.toString(),
      locationId: params.confirmedLocationId,
      quantity: params.confirmedQuantity,
    });

    return task;
  }

  /**
   * Get pending put-away tasks for a warehouse
   */
  async getPendingTasks(warehouseId: string): Promise<IPutAwayTask[]> {
    return PutAwayTask.find({ warehouseId, status: { $in: ['PENDING', 'IN_PROGRESS'] } })
      .populate('productId', 'name sku barcode')
      .populate('sourceLocationId', 'locationCode')
      .populate('suggestedLocationId', 'locationCode')
      .sort({ createdAt: -1 })
      .lean() as unknown as IPutAwayTask[];
  }
}

export const putAwayService = new PutAwayService();
