import { Package, type IPackage, type IPackageItem } from '../models/Package.js';
import { PackingStation, type IPackingStation } from '../models/PackingStation.js';
import { PickList } from '../models/PickList.js';
import { OmnichannelOrder } from '../models/OmnichannelOrder.js';
import { NotFoundError, ValidationError } from '../errors/AppError.js';
import { eventBus } from '../events/eventBus.js';

export interface CreatePackageParams {
  companyId: string;
  warehouseId: string;
  orderId: string;
  orderNumber: string;
  packingStationId?: string;
  items: IPackageItem[];
  packagingType?: string;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  carrier?: string;
  shippingMethod?: string;
  packerId: string;
  idempotencyKey?: string;
}

export class PackingService {
  /**
   * Create & initialize a Packing Station
   */
  async createPackingStation(params: {
    companyId: string;
    warehouseId: string;
    stationCode: string;
    name: string;
    createdBy: string;
  }): Promise<IPackingStation> {
    const existing = await PackingStation.findOne({
      warehouseId: params.warehouseId,
      stationCode: params.stationCode.toUpperCase(),
    });
    if (existing) {
      throw new ValidationError(`Packing station code [${params.stationCode}] already exists.`);
    }

    return PackingStation.create({
      companyId: params.companyId,
      warehouseId: params.warehouseId,
      stationCode: params.stationCode.toUpperCase(),
      name: params.name,
      isActive: true,
      createdBy: params.createdBy,
    });
  }

  /**
   * Pack Picked Items into a Shipping Package
   */
  async packOrder(params: CreatePackageParams): Promise<IPackage> {
    const {
      companyId,
      warehouseId,
      orderId,
      orderNumber,
      packingStationId,
      items,
      packagingType = 'BOX_MED',
      weight,
      length,
      width,
      height,
      carrier,
      shippingMethod,
      packerId,
      idempotencyKey,
    } = params;

    if (idempotencyKey) {
      const existingPkg = await Package.findOne({ idempotencyKey });
      if (existingPkg) return existingPkg;
    }

    // Verify pick list is completed
    const pickList = await PickList.findOne({
      orderId,
      status: { $in: ['PICKED', 'IN_PROGRESS'] },
    });
    if (pickList && pickList.status !== 'PICKED') {
      console.warn(`[Packing] Order ${orderNumber} has partial pick state.`);
    }

    const packageNumber = `PKG-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    const pkg = await Package.create({
      packageNumber,
      companyId,
      warehouseId,
      orderId,
      orderNumber,
      packingStationId,
      packerId,
      items,
      packagingType,
      weight,
      length,
      width,
      height,
      carrier,
      shippingMethod,
      status: 'PACKED',
      packedAt: new Date(),
      idempotencyKey,
      createdBy: packerId,
    });

    // Update OmnichannelOrder state
    const order = await OmnichannelOrder.findById(orderId);
    if (order) {
      order.fulfillmentStatus = 'PACKED';
      await order.save();
    }

    eventBus.emit('warehouse.order.packed', {
      packageId: pkg._id.toString(),
      orderId,
      packageNumber,
    });

    return pkg;
  }

  /**
   * Get active packages for an order
   */
  async getPackagesByOrder(orderId: string): Promise<IPackage[]> {
    return Package.find({ orderId }).sort({ createdAt: -1 }).lean() as unknown as IPackage[];
  }
}

export const packingService = new PackingService();
