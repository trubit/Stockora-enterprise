import { PickList, type IPickList, type IPickItem } from '../models/PickList.js';
import { PickingWave, type IPickingWave } from '../models/PickingWave.js';
import { InventoryAllocation } from '../models/InventoryAllocation.js';
import { Product } from '../models/Product.js';
import { WarehouseLocation } from '../models/WarehouseLocation.js';
import { inventoryLocationService } from './inventory-location.service.js';
import { NotFoundError, ValidationError } from '../errors/AppError.js';
import { eventBus } from '../events/eventBus.js';

export interface CreatePickListParams {
  companyId: string;
  warehouseId: string;
  orderId: string;
  orderNumber: string;
  allocationId?: string;
  waveId?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  createdBy: string;
}

export interface BarcodePickScanParams {
  pickListId: string;
  itemId: string;
  scannedSku: string;
  scannedLocationCode: string;
  quantityToPick: number;
  pickerId: string;
  idempotencyKey?: string;
}

export interface ShortPickParams {
  pickListId: string;
  itemId: string;
  shortReason: string;
  quantityPicked: number;
  pickerId: string;
}

export class PickingService {
  /**
   * Create Pick List from Allocation or Order
   */
  async createPickList(params: CreatePickListParams): Promise<IPickList> {
    const {
      companyId,
      warehouseId,
      orderId,
      orderNumber,
      allocationId,
      waveId,
      priority = 'NORMAL',
      createdBy,
    } = params;

    const items: IPickItem[] = [];

    if (allocationId) {
      const alloc = await InventoryAllocation.findById(allocationId);
      if (alloc) {
        for (const item of alloc.items) {
          if (item.warehouseId.toString() !== warehouseId) continue;

          const product = await Product.findById(item.productId);
          const location = item.locationId
            ? await WarehouseLocation.findById(item.locationId)
            : await WarehouseLocation.findOne({ warehouseId, locationType: 'PICKING' });

          items.push({
            productId: item.productId,
            sku: product?.sku || 'UNKNOWN',
            name: product?.name || 'Item',
            locationId: location?._id || item.locationId,
            locationCode: location?.locationCode || 'A-01-01',
            quantityRequired: item.quantityAllocated || item.quantityRequired,
            quantityPicked: 0,
            quantityShort: 0,
            lotNumber: item.lotNumber,
            expiryDate: item.expiryDate,
            status: 'PENDING',
          } as any);
        }
      }
    }

    if (items.length === 0) {
      throw new ValidationError('No pickable items found for this warehouse allocation.');
    }

    const pickListNumber = `PICK-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    const pickList = await PickList.create({
      pickListNumber,
      companyId,
      warehouseId,
      orderId,
      orderNumber,
      allocationId,
      waveId,
      status: 'PENDING',
      priority,
      items,
      totalItems: items.length,
      totalPicked: 0,
      totalShort: 0,
      createdBy,
    });

    eventBus.emit('warehouse.pick.created', {
      pickListId: pickList._id.toString(),
      orderId,
      warehouseId,
    });

    return pickList;
  }

  /**
   * Scan Barcode & Pick Item with strict product & location validation
   */
  async scanAndPickItem(params: BarcodePickScanParams): Promise<IPickList> {
    const {
      pickListId,
      itemId,
      scannedSku,
      scannedLocationCode,
      quantityToPick,
      pickerId,
      idempotencyKey,
    } = params;

    const pickList = await PickList.findById(pickListId);
    if (!pickList) throw new NotFoundError('Pick list not found.');

    if (idempotencyKey && pickList.idempotencyKey === idempotencyKey) {
      return pickList; // Idempotent repeat
    }

    const itemIndex = pickList.items.findIndex((i: any) => i._id.toString() === itemId);
    if (itemIndex === -1) throw new NotFoundError('Pick item not found on pick list.');

    const item = pickList.items[itemIndex];

    // 1. Wrong Product Protection
    const product = await Product.findById(item.productId);
    const validSkus = [product?.sku, product?.barcode].filter(Boolean);
    if (!validSkus.some((s) => s?.toLowerCase() === scannedSku.trim().toLowerCase())) {
      throw new ValidationError(
        `WRONG PRODUCT SCANNED! Expected SKU: [${item.sku}], Scanned: [${scannedSku}]. Pick operation blocked.`
      );
    }

    // 2. Wrong Location Protection
    if (scannedLocationCode.trim().toUpperCase() !== item.locationCode.trim().toUpperCase()) {
      throw new ValidationError(
        `WRONG LOCATION SCANNED! Expected Location: [${item.locationCode}], Scanned: [${scannedLocationCode}]. Pick operation blocked.`
      );
    }

    // 3. Pick Quantity Validation
    const remainingToPick = item.quantityRequired - item.quantityPicked;
    if (quantityToPick > remainingToPick) {
      throw new ValidationError(
        `Cannot pick ${quantityToPick} units. Only ${remainingToPick} units remaining to pick for this item.`
      );
    }

    // Perform Stock Movement: PICK (moves reserved stock out of location)
    await inventoryLocationService.moveStock({
      companyId: pickList.companyId.toString(),
      warehouseId: pickList.warehouseId.toString(),
      productId: item.productId.toString(),
      quantity: quantityToPick,
      fromLocationId: item.locationId.toString(),
      lotNumber: item.lotNumber,
      expiryDate: item.expiryDate,
      movementType: 'PICK',
      referenceId: pickList.pickListNumber,
      referenceType: 'PickList',
      userId: pickerId,
      notes: `Picked ${quantityToPick} units for order ${pickList.orderNumber}.`,
    });

    item.quantityPicked += quantityToPick;
    item.scannedSku = scannedSku;
    item.scannedLocationCode = scannedLocationCode;
    item.pickedAt = new Date();

    if (item.quantityPicked >= item.quantityRequired) {
      item.status = 'PICKED';
    } else {
      item.status = 'PARTIAL';
    }

    pickList.totalPicked += quantityToPick;
    pickList.assignedPickerId = pickerId as any;
    if (idempotencyKey) pickList.idempotencyKey = idempotencyKey;

    const allPicked = pickList.items.every((i) => i.status === 'PICKED' || i.status === 'SHORT');
    pickList.status = allPicked ? 'PICKED' : 'IN_PROGRESS';
    if (allPicked) pickList.completedAt = new Date();

    await pickList.save();

    eventBus.emit('warehouse.pick.completed', {
      pickListId: pickList._id.toString(),
      itemId,
      quantityPicked: quantityToPick,
    });

    return pickList;
  }

  /**
   * Handle Short Pick (stock missing/damaged at location)
   */
  async handleShortPick(params: ShortPickParams): Promise<IPickList> {
    const { pickListId, itemId, shortReason, quantityPicked, pickerId } = params;

    const pickList = await PickList.findById(pickListId);
    if (!pickList) throw new NotFoundError('Pick list not found.');

    const item = pickList.items.find((i: any) => i._id.toString() === itemId);
    if (!item) throw new NotFoundError('Pick item not found.');

    const shortQty = item.quantityRequired - quantityPicked;

    if (quantityPicked > 0) {
      // Pick what is available
      item.quantityPicked = quantityPicked;
      await inventoryLocationService.moveStock({
        companyId: pickList.companyId.toString(),
        warehouseId: pickList.warehouseId.toString(),
        productId: item.productId.toString(),
        quantity: quantityPicked,
        fromLocationId: item.locationId.toString(),
        lotNumber: item.lotNumber,
        movementType: 'PICK',
        referenceId: pickList.pickListNumber,
        referenceType: 'PickList',
        userId: pickerId,
        notes: `Partial pick (${quantityPicked}/${item.quantityRequired}) with short pick recorded.`,
      });
    }

    item.quantityShort = shortQty;
    item.status = 'SHORT';
    item.shortReason = shortReason;

    pickList.totalShort += shortQty;
    pickList.totalPicked += quantityPicked;

    const allFinished = pickList.items.every((i) => i.status === 'PICKED' || i.status === 'SHORT');
    pickList.status = allFinished ? 'PICKED' : 'IN_PROGRESS';

    await pickList.save();

    eventBus.emit('warehouse.pick.short', {
      pickListId: pickList._id.toString(),
      itemId,
      shortReason,
      quantityShort: shortQty,
    });

    return pickList;
  }

  /**
   * Create Wave Picking Batch
   */
  async createPickingWave(params: {
    companyId: string;
    warehouseId: string;
    name?: string;
    orderIds: string[];
    deliveryZone?: string;
    shippingMethod?: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    createdBy: string;
  }): Promise<IPickingWave> {
    const waveNumber = `WAVE-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    const wave = await PickingWave.create({
      waveNumber,
      companyId: params.companyId,
      warehouseId: params.warehouseId,
      name: params.name || `Wave ${waveNumber}`,
      status: 'RELEASED',
      orderIds: params.orderIds,
      deliveryZone: params.deliveryZone,
      shippingMethod: params.shippingMethod,
      priority: params.priority || 'NORMAL',
      totalOrders: params.orderIds.length,
      releasedAt: new Date(),
      createdBy: params.createdBy,
    });

    eventBus.emit('warehouse.wave.created', { waveId: wave._id.toString() });

    return wave;
  }
}

export const pickingService = new PickingService();
