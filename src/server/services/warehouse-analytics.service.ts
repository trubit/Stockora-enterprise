import { Warehouse } from '../models/Warehouse.js';
import { WarehouseLocation } from '../models/WarehouseLocation.js';
import { PickList } from '../models/PickList.js';
import { Package } from '../models/Package.js';
import { Dispatch } from '../models/Dispatch.js';
import { PutAwayTask } from '../models/PutAwayTask.js';
import { CycleCount } from '../models/CycleCount.js';
import { StockMovement } from '../models/StockMovement.js';
import { memoryCache } from '../utils/cache.js';

export interface IWarehouseAnalytics {
  warehouseId: string;
  warehouseName: string;
  capacity: {
    totalLocations: number;
    totalCapacityUnits: number;
    usedUnits: number;
    utilizationPercentage: number;
  };
  fulfillment: {
    totalPickLists: number;
    completedPickLists: number;
    pendingPickLists: number;
    pickAccuracyPercentage: number;
    totalPackagesPacked: number;
    totalDispatchesExecuted: number;
  };
  logistics: {
    pendingPutawayTasks: number;
    recentStockMovements30d: number;
    totalCycleCountVarianceValue: number;
  };
}

export class WarehouseAnalyticsService {
  /**
   * Executive Warehouse Dashboard Analytics
   */
  async getWarehouseAnalytics(warehouseId: string): Promise<IWarehouseAnalytics> {
    const cacheKey = `analytics:warehouse:${warehouseId}`;
    const cached = memoryCache.get<IWarehouseAnalytics>(cacheKey);
    if (cached) return cached;

    const warehouse = await Warehouse.findById(warehouseId);

    // Locations & Capacity
    const locations = await WarehouseLocation.find({ warehouseId, isActive: true });
    let totalCapUnits = 0;
    let totalUsedUnits = 0;
    for (const loc of locations) {
      totalCapUnits += loc.capacityUnits || 0;
      totalUsedUnits += loc.currentUnits || 0;
    }

    // Picking Metrics
    const pickLists = await PickList.find({ warehouseId });
    const totalPickLists = pickLists.length;
    const completedPickLists = pickLists.filter((p) => p.status === 'PICKED').length;
    const totalItemsPicked = pickLists.reduce((acc, p) => acc + (p.totalPicked || 0), 0);
    const totalItemsShort = pickLists.reduce((acc, p) => acc + (p.totalShort || 0), 0);

    const pickAccuracy =
      totalItemsPicked + totalItemsShort > 0
        ? Math.round((totalItemsPicked / (totalItemsPicked + totalItemsShort)) * 100)
        : 100;

    // Packing Metrics
    const packages = await Package.find({ warehouseId });
    const totalPackages = packages.length;

    // Dispatch Metrics
    const dispatches = await Dispatch.find({ warehouseId });
    const totalDispatches = dispatches.length;

    // Put-away & Receiving Metrics
    const putawayTasks = await PutAwayTask.find({ warehouseId });
    const pendingPutaway = putawayTasks.filter((t) => t.status === 'PENDING').length;

    // Stock Movement History (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentMovements = await StockMovement.find({
      $or: [{ fromWarehouseId: warehouseId }, { toWarehouseId: warehouseId }],
      createdAt: { $gte: thirtyDaysAgo },
    }).countDocuments();

    // Cycle Count Variance
    const counts = await CycleCount.find({ warehouseId, status: 'COMPLETED' });
    const totalVarianceValue = counts.reduce((acc, c) => acc + (c.totalVarianceValue || 0), 0);

    const data: IWarehouseAnalytics = {
      warehouseId,
      warehouseName: warehouse?.name || 'Warehouse',
      capacity: {
        totalLocations: locations.length,
        totalCapacityUnits: totalCapUnits || warehouse?.capacityUnits || 0,
        usedUnits: totalUsedUnits,
        utilizationPercentage:
          totalCapUnits > 0 ? Math.round((totalUsedUnits / totalCapUnits) * 100) : 0,
      },
      fulfillment: {
        totalPickLists,
        completedPickLists,
        pendingPickLists: totalPickLists - completedPickLists,
        pickAccuracyPercentage: pickAccuracy,
        totalPackagesPacked: totalPackages,
        totalDispatchesExecuted: totalDispatches,
      },
      logistics: {
        pendingPutawayTasks: pendingPutaway,
        recentStockMovements30d: recentMovements,
        totalCycleCountVarianceValue: totalVarianceValue,
      },
    };

    memoryCache.set(cacheKey, data, 10000);
    return data;
  }
}

export const warehouseAnalyticsService = new WarehouseAnalyticsService();
