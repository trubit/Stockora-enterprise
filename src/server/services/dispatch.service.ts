import { Dispatch, type IDispatch, type IDispatchPackageRef } from '../models/Dispatch.js';
import { Package } from '../models/Package.js';
import { OmnichannelOrder } from '../models/OmnichannelOrder.js';
import { NotFoundError, ValidationError } from '../errors/AppError.js';
import { eventBus } from '../events/eventBus.js';

export interface CreateDispatchParams {
  companyId: string;
  warehouseId: string;
  carrier: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  packageIds: string[];
  userId: string;
  idempotencyKey?: string;
}

export class DispatchService {
  /**
   * Create a Dispatch manifest for carrier pickup
   */
  async createDispatchManifest(params: CreateDispatchParams): Promise<IDispatch> {
    const {
      companyId,
      warehouseId,
      carrier,
      driverName,
      driverPhone,
      vehicleNumber,
      packageIds,
      userId,
      idempotencyKey,
    } = params;

    if (idempotencyKey) {
      const existing = await Dispatch.findOne({ idempotencyKey });
      if (existing) return existing;
    }

    const packages = await Package.find({ _id: { $in: packageIds }, warehouseId });
    if (packages.length === 0) {
      throw new ValidationError('No valid packages found for dispatch manifest.');
    }

    const packageRefs: IDispatchPackageRef[] = [];
    let totalWeight = 0;

    for (const pkg of packages) {
      if (pkg.status === 'DISPATCHED') {
        throw new ValidationError(`Package [${pkg.packageNumber}] is already dispatched.`);
      }

      packageRefs.push({
        packageId: pkg._id,
        packageNumber: pkg.packageNumber,
        orderId: pkg.orderId,
        orderNumber: pkg.orderNumber,
        trackingNumber: pkg.trackingNumber,
        weight: pkg.weight || 0,
      });

      totalWeight += pkg.weight || 0;
    }

    const dispatchNumber = `DISP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    const dispatch = await Dispatch.create({
      dispatchNumber,
      companyId,
      warehouseId,
      carrier,
      driverName,
      driverPhone,
      vehicleNumber,
      packages: packageRefs,
      totalPackages: packages.length,
      totalWeight,
      status: 'VERIFIED',
      verifiedBy: userId,
      verifiedAt: new Date(),
      idempotencyKey,
      createdBy: userId,
    });

    eventBus.emit('warehouse.dispatch.created', {
      dispatchId: dispatch._id.toString(),
      dispatchNumber,
      carrier,
    });

    return dispatch;
  }

  /**
   * Confirm & Execute Dispatch Manifest (Hands off stock to carrier)
   */
  async executeDispatch(dispatchId: string, userId: string): Promise<IDispatch> {
    const dispatch = await Dispatch.findById(dispatchId);
    if (!dispatch) throw new NotFoundError('Dispatch manifest not found.');

    if (dispatch.status === 'DISPATCHED') {
      return dispatch; // Already dispatched
    }

    // 1. Mark packages as DISPATCHED
    const packageIds = dispatch.packages.map((p) => p.packageId);
    await Package.updateMany(
      { _id: { $in: packageIds } },
      { $set: { status: 'DISPATCHED', dispatchedAt: new Date() } }
    );

    // 2. Mark orders as SHIPPED / FULFILLED
    const orderIds = dispatch.packages.map((p) => p.orderId);
    await OmnichannelOrder.updateMany(
      { _id: { $in: orderIds } },
      { $set: { fulfillmentStatus: 'SHIPPED', status: 'COMPLETED' } }
    );

    dispatch.status = 'DISPATCHED';
    dispatch.dispatchedAt = new Date();
    await dispatch.save();

    eventBus.emit('warehouse.order.dispatched', {
      dispatchId: dispatch._id.toString(),
      dispatchNumber: dispatch.dispatchNumber,
      totalPackages: dispatch.totalPackages,
    });

    return dispatch;
  }
}

export const dispatchService = new DispatchService();
